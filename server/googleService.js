/**
 * googleService.js - Service de gestion des APIs Google
 *
 * Responsabilités :
 * 1. Authentification OAuth2
 * 2. Interaction avec Gmail (lecture/envoi)
 * 3. Interaction avec Calendar (évènements)
 */

import { google } from "googleapis";
import fs from "fs/promises";
import path from "path";

const TOKEN_PATH = path.join(process.cwd(), "google_token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "google_credentials.json");

// Singleton du client OAuth2 : évite de recréer le client (et ses listeners) à chaque appel
// Cela empêche l'accumulation de listeners "tokens" qui génèrent des logs répétitifs
let _oAuth2ClientSingleton = null;
let _tokenDataCache = null; // Cache en mémoire du token courant
let _lastTokenLogTime = 0; // Timestamp du dernier log de refresh (throttle)
const TOKEN_LOG_THROTTLE_MS = 5 * 60 * 1000; // 1 log de refresh max toutes les 5 minutes
// Flag levé après un invalid_grant : stoppe toutes les tentatives automatiques
// jusqu'à ce qu'une nouvelle authentification soit effectuée via setTokenFromCode
let _authRevoked = false;

/**
 * Charge les credentials depuis le fichier
 */
async function loadCredentials() {
  try {
    const content = await fs.readFile(CREDENTIALS_PATH, "utf8");
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

/**
 * Sauvegarde les credentials
 */
export async function saveCredentials(credentials) {
  await fs.writeFile(CREDENTIALS_PATH, JSON.stringify(credentials, null, 2));
}

/**
 * Crée (ou retourne) le client OAuth2 singleton.
 * Un seul client est instancié pour toute la durée de vie du serveur.
 * Cela évite l'accumulation de listeners "tokens" qui génèrent des logs répétitifs
 * et une fuite mémoire progressive.
 */
async function getOAuth2Client() {
  // Retourner le singleton s'il existe déjà
  if (_oAuth2ClientSingleton) return _oAuth2ClientSingleton;

  // 1. Priorité aux variables d'environnement (.env.local)
  const env_id = process.env.GOOGLE_CLIENT_ID;
  const env_secret = process.env.GOOGLE_CLIENT_SECRET;
  const env_redirect = process.env.GOOGLE_REDIRECT_URI;

  if (env_id && env_secret) {
    const redirect_uri =
      env_redirect || "http://localhost:3001/api/google/callback";
    _oAuth2ClientSingleton = new google.auth.OAuth2(
      env_id,
      env_secret,
      redirect_uri,
    );
  } else {
    // 2. Fallback sur le fichier JSON (non recommandé mais garde la compatibilité)
    const raw = await loadCredentials();
    if (!raw) return null;

    const credentials = raw.web || raw;
    const client_id = credentials.client_id;
    const client_secret = credentials.client_secret;

    const redirect_uri =
      credentials.redirect_uri ||
      (credentials.redirect_uris && credentials.redirect_uris[0]) ||
      "http://localhost:3001/api/google/callback";

    if (!client_id || !client_secret) return null;

    _oAuth2ClientSingleton = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uri,
    );
  }

  // Enregistrer le listener "tokens" UNE SEULE FOIS sur le singleton
  // Ce listener est déclenché automatiquement par la lib Google quand un token est rafraîchi
  _oAuth2ClientSingleton.on("tokens", async (newTokens) => {
    // Fusionner avec le cache en mémoire pour conserver le refresh_token
    const merged = { ..._tokenDataCache, ...newTokens };
    _tokenDataCache = merged;
    try {
      await fs.writeFile(TOKEN_PATH, JSON.stringify(merged));
      // Throttle : log visible seulement si le dernier log date de plus de 5 minutes
      // Évite le spam de logs à chaque appel Gmail/Calendar
      const now = Date.now();
      if (now - _lastTokenLogTime > TOKEN_LOG_THROTTLE_MS) {
        console.log("🔄 [Google] Token rafraîchi et sauvegardé.");
        _lastTokenLogTime = now;
      }
    } catch (e) {
      console.error(
        "❌ [Google] Impossible de sauvegarder le token rafraîchi:",
        e.message,
      );
    }
  });

  return _oAuth2ClientSingleton;
}

/**
 * Invalide le singleton OAuth2 (utile après un nouveau setTokenFromCode).
 * Permet de forcer la recréation du client avec les nouvelles credentials.
 */
export function resetOAuth2Client() {
  _oAuth2ClientSingleton = null;
  _tokenDataCache = null;
  _lastTokenLogTime = 0;
  _authRevoked = false;
}

/**
 * Retourne true si l'authentification Google est révoquée (invalid_grant).
 * Permet aux services périodiques (calendarReminder, etc.) de s'auto-suspendre.
 */
export function isAuthRevoked() {
  return _authRevoked;
}

/**
 * Génère l'URL d'authentification
 */
export async function getAuthUrl() {
  const oAuth2Client = await getOAuth2Client();
  if (!oAuth2Client) throw new Error("Credentials non configurés");

  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "select_account", // Force le choix du compte pour rafraîchir les scopes
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/calendar", // Accès complet (lecture/écriture)
    ],
  });
}

/**
 * Échange le code contre un token et réinitialise le singleton.
 * Appelé lors du callback OAuth2 (/api/google/callback).
 */
export async function setTokenFromCode(code) {
  // Réinitialiser le singleton ET le flag de révocation pour permettre la reconnexion
  resetOAuth2Client();
  const oAuth2Client = await getOAuth2Client();
  const { tokens } = await oAuth2Client.getToken(code);
  // Sauvegarder le token et mettre à jour le cache mémoire
  _tokenDataCache = tokens;
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
  console.log("✅ [Google] Nouveau token OAuth2 sauvegardé.");
  return tokens;
}

/**
 * Récupère un client authentifié avec refresh automatique du token.
 * Utilise le singleton OAuth2 et le cache mémoire pour éviter les lectures disque répétées.
 * Le listener "tokens" est enregistré UNE SEULE FOIS sur le singleton (dans getOAuth2Client).
 */
async function getAuthorizedClient() {
  // Si le token est révoqué (invalid_grant), bloquer immédiatement sans log
  // Les services périodiques doivent appeler isAuthRevoked() pour s'auto-suspendre
  if (_authRevoked) {
    throw new Error(
      "Session Google expirée - reconnectez-vous via /api/google/auth-url",
    );
  }

  const oAuth2Client = await getOAuth2Client();
  if (!oAuth2Client) throw new Error("Client non configuré");

  // Charger le token depuis le cache mémoire ou depuis le disque (1 seule lecture au démarrage)
  if (!_tokenDataCache) {
    try {
      const token = await fs.readFile(TOKEN_PATH, "utf8");
      _tokenDataCache = JSON.parse(token);
    } catch (err) {
      throw new Error(
        "Utilisateur non authentifié - veuillez vous connecter via /api/google/auth-url",
      );
    }
  }

  // Appliquer les credentials du cache sur le client singleton
  oAuth2Client.setCredentials(_tokenDataCache);

  // Vérifier si le token est expiré et forcer un refresh si nécessaire
  // Marge de 2 minutes pour éviter les erreurs de timing réseau
  const expiryDate = _tokenDataCache.expiry_date;
  const isExpired = expiryDate && Date.now() >= expiryDate - 120000;

  if (isExpired && _tokenDataCache.refresh_token) {
    try {
      // Log throttlé : visible seulement si le dernier log date de plus de 5 minutes
      const now = Date.now();
      if (now - _lastTokenLogTime > TOKEN_LOG_THROTTLE_MS) {
        console.log("🔄 [Google] Token expiré, refresh en cours...");
      }
      const { credentials } = await oAuth2Client.refreshAccessToken();
      const merged = { ..._tokenDataCache, ...credentials };
      // Mettre à jour le cache mémoire ET le fichier disque
      _tokenDataCache = merged;
      await fs.writeFile(TOKEN_PATH, JSON.stringify(merged));
      oAuth2Client.setCredentials(merged);
      // Log throttlé
      if (now - _lastTokenLogTime > TOKEN_LOG_THROTTLE_MS) {
        console.log("✅ [Google] Token rafraîchi avec succès.");
        _lastTokenLogTime = now;
      }
    } catch (refreshErr) {
      console.error("❌ [Google] Échec du refresh token:", refreshErr.message);
      // Si invalid_grant : le refresh token est définitivement révoqué
      // Lever le flag pour stopper toutes les tentatives automatiques futures
      if (refreshErr.message?.includes("invalid_grant")) {
        _authRevoked = true;
        console.error(
          "🔒 [Google] Token révoqué (invalid_grant). Reconnexion requise : /api/google/auth-url",
        );
      }
      _tokenDataCache = null;
      throw new Error(
        "Session Google expirée - reconnectez-vous via /api/google/auth-url",
      );
    }
  }

  return oAuth2Client;
}

/**
 * GMAIL : Liste les derniers messages
 */
export async function listEmails(maxResults = 5, q = "") {
  const auth = await getAuthorizedClient();
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q, // Ajout du filtre de recherche (ex: "from:laura", "subject:important")
  });

  const messages = res.data.messages || [];
  const detailedMessages = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
      });
      return {
        id: msg.id,
        snippet: detail.data.snippet,
        subject: detail.data.payload.headers.find((h) => h.name === "Subject")
          ?.value,
        from: detail.data.payload.headers.find((h) => h.name === "From")?.value,
        date: detail.data.payload.headers.find((h) => h.name === "Date")?.value,
      };
    }),
  );

  return detailedMessages;
}

/**
 * GMAIL : Envoie un mail
 */
export async function sendEmail(to, subject, body) {
  const auth = await getAuthorizedClient();
  const gmail = google.gmail({ version: "v1", auth });

  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const messageParts = [
    `From: me`,
    `To: ${to}`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    `Subject: ${utf8Subject}`,
    "",
    body,
  ];
  const message = messageParts.join("\n");

  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  });

  return { success: true };
}

/**
 * CALENDAR : Liste les prochains évènements
 */
export async function listEvents(maxResults = 10) {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });

  return res.data.items.map((event) => ({
    id: event.id,
    summary: event.summary,
    start: event.start.dateTime || event.start.date,
    end: event.end.dateTime || event.end.date,
    location: event.location,
  }));
}

/**
 * CALENDAR : Crée un évènement
 */
export async function createEvent(eventDetails) {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary: eventDetails.summary,
    location: eventDetails.location || "",
    description: eventDetails.description || "Ajouté par J.A.R.V.I.S.",
    start: {
      dateTime: eventDetails.startTime, // Format ISO : 2026-02-16T10:00:00Z
      timeZone: "Europe/Paris",
    },
    end: {
      dateTime: eventDetails.endTime,
      timeZone: "Europe/Paris",
    },
  };

  const res = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });

  return res.data;
}

/**
 * CALENDAR : Supprime un évènement
 */
export async function deleteEvent(eventId) {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.delete({
    calendarId: "primary",
    eventId: eventId,
  });

  return { success: true, message: "Événement supprimé" };
}

/**
 * CALENDAR : Met à jour un évènement (partiel)
 */
export async function updateEvent(eventId, eventDetails) {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth });

  const event = {};
  if (eventDetails.summary) event.summary = eventDetails.summary;
  if (eventDetails.startTime)
    event.start = {
      dateTime: eventDetails.startTime,
      timeZone: "Europe/Paris",
    };
  if (eventDetails.endTime)
    event.end = { dateTime: eventDetails.endTime, timeZone: "Europe/Paris" };

  const res = await calendar.events.patch({
    calendarId: "primary",
    eventId: eventId,
    resource: event,
  });

  return res.data;
}
