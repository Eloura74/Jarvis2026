/**
 * Service de rappels Calendar proactifs pour J.A.R.V.I.S.
 *
 * Vérifie toutes les 5 minutes les événements Google Calendar à venir.
 * Si un événement est dans moins de 30 minutes, envoie un rappel SSE au frontend.
 * Évite les doublons grâce à un Set des IDs déjà notifiés.
 */

import { listEvents, isAuthRevoked } from "../googleService.js";
import { broadcastEvent } from "../routes/events.js";
import fs from "fs/promises";
import path from "path";

// Chemin vers le token Google (défini dans googleService.js aussi)
const TOKEN_PATH = path.join(process.cwd(), "google_token.json");

/**
 * Retourne true si un token Google est disponible sur le disque
 */
async function hasGoogleToken() {
  try {
    await fs.access(TOKEN_PATH);
    return true;
  } catch {
    return false;
  }
}

// IDs des événements déjà notifiés (évite les doublons)
const notifiedEventIds = new Set();

// Intervalle de vérification : 5 minutes
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

// Seuil de rappel : notifier si l'événement est dans moins de 30 minutes
const REMINDER_THRESHOLD_MS = 30 * 60 * 1000;

let intervalId = null;

/**
 * Formate la durée restante en texte lisible
 * @param {number} ms - Millisecondes restantes
 * @returns {string} - Ex: "dans 15 minutes"
 */
function formatTimeUntil(ms) {
  const minutes = Math.round(ms / 60000);
  if (minutes <= 1) return "dans moins d'une minute";
  if (minutes < 60) return `dans ${minutes} minutes`;
  const hours = Math.round(minutes / 60);
  return `dans ${hours} heure${hours > 1 ? "s" : ""}`;
}

/**
 * Vérifie les événements à venir et envoie des rappels SSE
 */
async function checkUpcomingEvents() {
  // Si le token Google est révoqué (invalid_grant), ne pas tenter d'appel API
  if (isAuthRevoked()) return;

  // Si aucun token Google n'est présent sur le disque, ne rien faire silencieusement
  if (!(await hasGoogleToken())) return;

  try {
    // Récupérer les 10 prochains événements
    const events = await listEvents(10);
    const now = Date.now();

    for (const event of events) {
      // Ignorer les événements sans date de début précise
      if (!event.start) continue;

      const startTime = new Date(event.start).getTime();
      const timeUntil = startTime - now;

      // Ignorer les événements déjà passés ou trop loin dans le futur
      if (timeUntil < 0 || timeUntil > REMINDER_THRESHOLD_MS) continue;

      // Ignorer si déjà notifié
      if (notifiedEventIds.has(event.id)) continue;

      // Marquer comme notifié
      notifiedEventIds.add(event.id);

      const timeUntilText = formatTimeUntil(timeUntil);
      const messageToSpeak = `Rappel agenda, Monsieur : ${event.summary} ${timeUntilText}.`;

      console.log(`📅 [CALENDAR REMINDER] ${event.summary} ${timeUntilText}`);

      // Envoyer le rappel via SSE
      broadcastEvent(
        "CALENDAR_REMINDER",
        {
          id: event.id,
          summary: event.summary,
          start: event.start,
          location: event.location || null,
          timeUntil: timeUntilText,
        },
        messageToSpeak,
      );
    }

    // Nettoyer les IDs notifiés trop anciens (> 2h) pour éviter la fuite mémoire
    // On ne peut pas itérer et supprimer directement, donc on reconstruit le Set
    // en gardant seulement les événements futurs récents (non implémenté ici pour simplicité)
  } catch (err) {
    // Silencieux si Google non configuré : pas de token, refresh token manquant, auth révoquée
    const msg = err.message || "";
    const isSilentError =
      msg.includes("non authentifié") ||
      msg.includes("No refresh token") ||
      msg.includes("refresh token") ||
      msg.includes("invalid_grant") ||
      msg.includes("Token has been expired");

    if (!isSilentError) {
      console.error("❌ [CALENDAR REMINDER] Erreur vérification:", msg);
    }
  }
}

/**
 * Démarre le service de rappels Calendar
 */
export function startCalendarReminder() {
  if (intervalId) return; // Déjà démarré

  console.log(
    "📅 [CALENDAR REMINDER] Service démarré (vérification toutes les 5 min)",
  );

  // Première vérification après 60 secondes (laisser le temps au token d'être chargé)
  setTimeout(() => {
    checkUpcomingEvents();
    intervalId = setInterval(checkUpcomingEvents, CHECK_INTERVAL_MS);
  }, 60000);
}

/**
 * Arrête le service de rappels Calendar
 */
export function stopCalendarReminder() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("📅 [CALENDAR REMINDER] Service arrêté");
  }
}
