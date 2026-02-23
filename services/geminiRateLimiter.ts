// ============================================================================
// RATE LIMITER & CIRCUIT BREAKER GEMINI
// ============================================================================
// Gère la protection contre les erreurs 429 (rate limiting) de l'API Gemini.
// - Circuit breaker : bloque les requêtes pendant BREAKER_COOLDOWN après un 429
// - Throttle : impose un délai minimum entre chaque requête (MIN_REQUEST_GAP)
// - Shield : peut être réinitialisé manuellement par l'utilisateur

// Durée de cooldown après un 429 (10 secondes)
const BREAKER_COOLDOWN = 10000;

// Délai minimum entre deux requêtes successives (1 seconde)
const MIN_REQUEST_GAP = 1000;

// Timestamp du dernier 429 reçu (0 = aucun)
let last429Time = cleanupOldShield();

// Timestamp de la dernière requête envoyée
let lastRequestTime = 0;

// ============================================================================
// NETTOYAGE AU DÉMARRAGE
// ============================================================================

/**
 * Supprime les anciens timestamps de shield stockés dans localStorage.
 * Si le timestamp a plus de 10 minutes, il est considéré périmé et supprimé.
 *
 * @returns Le timestamp stocké s'il est encore valide, sinon 0
 */
function cleanupOldShield(): number {
  const stored = localStorage.getItem("jarvis_last_429");
  if (stored) {
    const timestamp = parseInt(stored);
    const age = Date.now() - timestamp;
    if (age > 600000) {
      // Plus de 10 minutes → périmé
      localStorage.removeItem("jarvis_last_429");
      console.log(
        "🧹 Old neural shield timestamp cleaned up (",
        Math.round(age / 60000),
        "minutes old)",
      );
      return 0;
    }
    return timestamp;
  }
  return 0;
}

// ============================================================================
// ENREGISTREMENT D'UN 429
// ============================================================================

/**
 * Enregistre un événement 429 (rate limit) reçu de l'API Gemini.
 * Active le circuit breaker pour BREAKER_COOLDOWN millisecondes.
 */
export const record429 = () => {
  last429Time = Date.now();
  console.warn("🔻 Neural Core 429 Reported.");
};

// ============================================================================
// THROTTLE — DÉLAI MINIMUM ENTRE REQUÊTES
// ============================================================================

/**
 * Attend si nécessaire pour respecter le délai minimum entre requêtes.
 * Évite de saturer l'API Gemini avec des appels trop rapprochés.
 * Met à jour lastRequestTime après l'attente.
 */
export const waitIfNecessary = async () => {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_REQUEST_GAP) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_GAP - timeSinceLast),
    );
  }
  lastRequestTime = Date.now();
};

// ============================================================================
// CIRCUIT BREAKER — SHIELD
// ============================================================================

/**
 * Vérifie si le circuit breaker est actif (shield levé après un 429).
 * Retourne toujours false car la protection est désactivée à la demande de l'utilisateur.
 *
 * @returns false (protection désactivée)
 */
export const checkShield = (): boolean => {
  // EMERGENCY: PROTECTION DÉSACTIVÉE (Demande Utilisateur)
  return false;

  /*
  const timeSince = Date.now() - last429Time;
  if (timeSince > AUTO_RESET_THRESHOLD && last429Time > 0) {
    console.log("🔓 Shield auto-expired after 10 minutes. Resetting.");
    last429Time = 0;
    localStorage.removeItem("jarvis_last_429");
    return false;
  }
  return timeSince < BREAKER_COOLDOWN;
  */
};

/**
 * Réinitialise manuellement le neural shield (circuit breaker).
 * Appelé par l'utilisateur via l'interface HolographicHUD.
 */
export const resetNeuralShield = () => {
  last429Time = 0;
  localStorage.removeItem("jarvis_last_429");
  console.log("🔓 Neural Shield manually reset by user.");
};

// ============================================================================
// STATUT DU NEURAL CORE
// ============================================================================

/**
 * Retourne l'état actuel du neural core (surcharge, cooldown restant, etc.).
 * Utilisé par HolographicHUD et useQuantumObserver pour afficher l'état.
 *
 * @returns Objet contenant isOverloaded, remainingCooldown (secondes), lastRequestGap (ms)
 */
export const checkNeuralStatus = () => {
  const now = Date.now();
  const timeSince429 = now - last429Time;
  return {
    isOverloaded: timeSince429 < BREAKER_COOLDOWN,
    remainingCooldown: Math.max(
      0,
      Math.ceil((BREAKER_COOLDOWN - timeSince429) / 1000),
    ),
    lastRequestGap: now - lastRequestTime,
  };
};
