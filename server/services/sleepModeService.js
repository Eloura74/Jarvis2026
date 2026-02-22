/**
 * sleepModeService.js — Mode Veille Intelligente pour J.A.R.V.I.S.
 *
 * Fonctionnement :
 * - Active un mode "Ne pas déranger" configurable (DND)
 * - Réduit le volume TTS, suspend les notifications non critiques
 * - Envoie un événement SSE au frontend pour déclencher le screensaver
 * - Reprend automatiquement à l'heure de réveil configurée
 * - Expose des routes REST : POST /api/sleep/activate | /api/sleep/deactivate | GET /api/sleep/status
 */

import { broadcastEvent } from "../routes/events.js";

// État courant du mode veille
let _sleepActive = false;
let _wakeUpTimer = null;

// Configuration par défaut (peut être surchargée via l'API)
const DEFAULT_CONFIG = {
  // Volume TTS réduit pendant la veille (0.0 à 1.0)
  ttsVolume: 0.2,
  // Notifications autorisées pendant la veille (whitelist de types SSE)
  allowedNotifications: ["CALENDAR_REMINDER"],
  // Durée de veille par défaut si aucune heure de réveil fournie (8h)
  defaultDurationMs: 8 * 60 * 60 * 1000,
};

let _currentConfig = { ...DEFAULT_CONFIG };

/**
 * Active le mode veille intelligente.
 *
 * @param {object} options
 * @param {string|null} options.wakeUpTime - Heure de réveil ISO 8601 (ex: "2026-02-23T07:00:00")
 *                                           Si null, utilise la durée par défaut (8h)
 * @param {number|null} options.ttsVolume  - Volume TTS pendant la veille (0.0 à 1.0)
 * @param {string[]}    options.allowedNotifications - Types SSE autorisés pendant la veille
 * @returns {{ success: boolean, message: string, wakeUpAt: string|null }}
 */
export function activateSleepMode({ wakeUpTime = null, ttsVolume = null, allowedNotifications = null } = {}) {
  if (_sleepActive) {
    return { success: false, message: "Mode veille déjà actif." };
  }

  _sleepActive = true;

  // Appliquer la configuration personnalisée si fournie
  if (ttsVolume !== null) _currentConfig.ttsVolume = Math.max(0, Math.min(1, ttsVolume));
  if (allowedNotifications !== null) _currentConfig.allowedNotifications = allowedNotifications;

  // Calculer l'heure de réveil
  let wakeUpAt = null;
  let wakeUpMs = _currentConfig.defaultDurationMs;

  if (wakeUpTime) {
    const wakeDate = new Date(wakeUpTime);
    const now = Date.now();
    wakeUpMs = wakeDate.getTime() - now;
    // Sécurité : si l'heure de réveil est dans le passé ou dans moins de 1 minute, refuser
    if (wakeUpMs < 60_000) {
      _sleepActive = false;
      return { success: false, message: "Heure de réveil invalide ou déjà passée." };
    }
    wakeUpAt = wakeDate.toISOString();
  } else {
    wakeUpAt = new Date(Date.now() + wakeUpMs).toISOString();
  }

  // Programmer le réveil automatique
  _wakeUpTimer = setTimeout(() => {
    deactivateSleepMode({ reason: "wakeup_timer" });
  }, wakeUpMs);

  console.log(`🌙 [SLEEP MODE] Activé. Réveil prévu à ${wakeUpAt}`);

  // Notifier le frontend via SSE
  broadcastEvent(
    "SLEEP_MODE",
    {
      active: true,
      wakeUpAt,
      ttsVolume: _currentConfig.ttsVolume,
      allowedNotifications: _currentConfig.allowedNotifications,
    },
    "Mode veille activé, Monsieur. Bonne nuit.",
  );

  return { success: true, message: "Mode veille activé.", wakeUpAt };
}

/**
 * Désactive le mode veille et reprend le fonctionnement normal.
 *
 * @param {object} options
 * @param {string} options.reason - Raison de la désactivation ("manual" | "wakeup_timer" | "voice")
 * @returns {{ success: boolean, message: string }}
 */
export function deactivateSleepMode({ reason = "manual" } = {}) {
  if (!_sleepActive) {
    return { success: false, message: "Mode veille non actif." };
  }

  _sleepActive = false;
  _currentConfig = { ...DEFAULT_CONFIG };

  // Annuler le timer de réveil si désactivation manuelle
  if (_wakeUpTimer) {
    clearTimeout(_wakeUpTimer);
    _wakeUpTimer = null;
  }

  const isAutoWakeUp = reason === "wakeup_timer";
  const message = isAutoWakeUp
    ? "Bonjour Monsieur, il est l'heure de se lever. Bonne journée."
    : "Mode veille désactivé, Monsieur. Je suis de nouveau à votre disposition.";

  console.log(`☀️ [SLEEP MODE] Désactivé (raison: ${reason})`);

  // Notifier le frontend via SSE
  broadcastEvent(
    "SLEEP_MODE",
    { active: false, reason },
    message,
  );

  return { success: true, message: "Mode veille désactivé." };
}

/**
 * Retourne l'état courant du mode veille.
 * @returns {{ active: boolean, config: object, wakeUpAt: string|null }}
 */
export function getSleepModeStatus() {
  return {
    active: _sleepActive,
    config: _currentConfig,
    // Calculer l'heure de réveil restante si actif
    wakeUpAt: _sleepActive && _wakeUpTimer
      ? new Date(Date.now() + (_wakeUpTimer._idleTimeout || 0)).toISOString()
      : null,
  };
}

/**
 * Vérifie si une notification SSE doit être bloquée en mode veille.
 * Utilisé par broadcastEvent pour filtrer les notifications non critiques.
 *
 * @param {string} eventType - Type de l'événement SSE (ex: "WHATSAPP", "CALENDAR_REMINDER")
 * @returns {boolean} - true si la notification doit être bloquée
 */
export function shouldBlockNotification(eventType) {
  if (!_sleepActive) return false;
  return !_currentConfig.allowedNotifications.includes(eventType);
}
