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
 * Crée un client OAuth2
 */
async function getOAuth2Client() {
  // 1. Priorité aux variables d'environnement (.env.local)
  const env_id = process.env.GOOGLE_CLIENT_ID;
  const env_secret = process.env.GOOGLE_CLIENT_SECRET;
  const env_redirect = process.env.GOOGLE_REDIRECT_URI;

  if (env_id && env_secret) {
    const redirect_uri =
      env_redirect || "http://localhost:3001/api/google/callback";
    return new google.auth.OAuth2(env_id, env_secret, redirect_uri);
  }

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

  return new google.auth.OAuth2(client_id, client_secret, redirect_uri);
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
 * Échange le code contre un token
 */
export async function setTokenFromCode(code) {
  const oAuth2Client = await getOAuth2Client();
  const { tokens } = await oAuth2Client.getToken(code);
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
  return tokens;
}

/**
 * Récupère un client authentifié
 */
async function getAuthorizedClient() {
  const oAuth2Client = await getOAuth2Client();
  if (!oAuth2Client) throw new Error("Client non configuré");

  try {
    const token = await fs.readFile(TOKEN_PATH, "utf8");
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    throw new Error("Utilisateur non authentifié");
  }
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
