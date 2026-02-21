/**
 * Service de stockage localStorage centralisé pour J.A.R.V.I.S.
 *
 * Remplace les accès directs à localStorage dispersés dans le code.
 * Gère le quota (5-10 MB navigateur), la sérialisation JSON,
 * et le nettoyage automatique des entrées expirées.
 *
 * TOUTES les clés connues sont déclarées ici pour éviter les collisions.
 */

// ============================================================================
// REGISTRE DES CLÉS CONNUES
// ============================================================================
export const STORAGE_KEYS = {
  MOOD_HISTORY: "jarvis-mood-history",
  PSYCH_PROFILE: "jarvis-psych-profile",
  COMMAND_HISTORY: "jarvis-command-history",
  CONVERSATION_CONTEXT: "jarvis-conversation-context",
  VOICE_SETTINGS: "jarvis-voice-settings",
  WAKE_WORD_ENABLED: "jarvis-wake-word-enabled",
  APP_MEMORY: "jarvis-app-memory",
  PREDICTION_MODEL: "jarvis-prediction-model",
  WORKFLOW_LIST: "jarvis-workflows",
  GHOST_HISTORY: "jarvis-ghost-history",
  AUTONOMY_LOG: "jarvis-autonomy-log",
  LAST_GREETING: "jarvis-last-greeting",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// Quota approximatif à ne pas dépasser (en bytes) — 4 MB de marge sur 5 MB
const QUOTA_WARN_BYTES = 4 * 1024 * 1024;

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Calcule la taille approximative du localStorage en bytes
 */
export function getStorageSize(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      total += key.length + (localStorage.getItem(key)?.length || 0);
    }
  }
  return total * 2; // UTF-16 = 2 bytes par caractère
}

/**
 * Retourne un rapport de l'utilisation du localStorage
 */
export function getStorageReport(): {
  totalBytes: number;
  totalKB: string;
  keys: { key: string; sizeKB: string }[];
  isNearQuota: boolean;
} {
  const keys: { key: string; sizeKB: string }[] = [];
  let totalBytes = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || "";
      const sizeBytes = (key.length + value.length) * 2;
      totalBytes += sizeBytes;
      keys.push({ key, sizeKB: (sizeBytes / 1024).toFixed(2) });
    }
  }

  // Trier par taille décroissante
  keys.sort((a, b) => parseFloat(b.sizeKB) - parseFloat(a.sizeKB));

  return {
    totalBytes,
    totalKB: (totalBytes / 1024).toFixed(2),
    keys,
    isNearQuota: totalBytes > QUOTA_WARN_BYTES,
  };
}

/**
 * Lit une valeur depuis localStorage avec parsing JSON automatique
 * @param key - Clé de stockage
 * @param defaultValue - Valeur par défaut si absent ou invalide
 */
export function storageGet<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[Storage] Erreur lecture "${key}", retour valeur par défaut`);
    return defaultValue;
  }
}

/**
 * Écrit une valeur dans localStorage avec sérialisation JSON.
 * Vérifie le quota avant d'écrire et avertit si proche de la limite.
 * @param key - Clé de stockage
 * @param value - Valeur à stocker
 * @returns true si succès, false si quota dépassé
 */
export function storageSet<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);

    // Vérification quota avant écriture
    const currentSize = getStorageSize();
    const newEntrySize = (key.length + serialized.length) * 2;
    if (currentSize + newEntrySize > QUOTA_WARN_BYTES) {
      console.warn(
        `[Storage] ⚠️ Quota proche (${(currentSize / 1024).toFixed(0)} KB). Nettoyage recommandé.`,
      );
    }

    localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      console.error(
        "[Storage] ❌ QUOTA DÉPASSÉ — Nettoyage d'urgence des entrées non essentielles...",
      );
      cleanupNonEssential();
      // Réessayer après nettoyage
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        console.error("[Storage] ❌ Impossible d'écrire même après nettoyage.");
        return false;
      }
    }
    console.error(`[Storage] Erreur écriture "${key}":`, err);
    return false;
  }
}

/**
 * Supprime une clé du localStorage
 */
export function storageRemove(key: string): void {
  localStorage.removeItem(key);
}

/**
 * Supprime les entrées non essentielles pour libérer de l'espace.
 * Conserve les paramètres critiques (voix, wake word, mémoire apps).
 */
export function cleanupNonEssential(): void {
  const nonEssentialKeys = [
    STORAGE_KEYS.GHOST_HISTORY,
    STORAGE_KEYS.AUTONOMY_LOG,
    STORAGE_KEYS.COMMAND_HISTORY,
    STORAGE_KEYS.CONVERSATION_CONTEXT,
  ];

  for (const key of nonEssentialKeys) {
    localStorage.removeItem(key);
    console.log(`[Storage] 🗑️ Nettoyé: ${key}`);
  }
}

/**
 * Nettoie les entrées de mood history de plus de N jours
 * @param maxDays - Nombre de jours à conserver (défaut: 30)
 */
export function cleanupMoodHistory(maxDays = 30): void {
  const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
  const history = storageGet<Array<{ timestamp: number }>>(
    STORAGE_KEYS.MOOD_HISTORY,
    [],
  );
  const filtered = history.filter((e) => e.timestamp > cutoff);
  storageSet(STORAGE_KEYS.MOOD_HISTORY, filtered);
}

/**
 * Nettoie l'historique de commandes en gardant les N dernières
 * @param maxEntries - Nombre d'entrées à conserver (défaut: 50)
 */
export function cleanupCommandHistory(maxEntries = 50): void {
  const history = storageGet<unknown[]>(STORAGE_KEYS.COMMAND_HISTORY, []);
  if (history.length > maxEntries) {
    storageSet(STORAGE_KEYS.COMMAND_HISTORY, history.slice(-maxEntries));
  }
}

/**
 * Nettoyage global : purge toutes les entrées expirées ou surdimensionnées.
 * À appeler au démarrage de l'application.
 */
export function runStorageCleanup(): void {
  cleanupMoodHistory(30);
  cleanupCommandHistory(50);

  const report = getStorageReport();
  console.log(
    `[Storage] 📊 Utilisation: ${report.totalKB} KB${report.isNearQuota ? " ⚠️ PROCHE DU QUOTA" : ""}`,
  );
}
