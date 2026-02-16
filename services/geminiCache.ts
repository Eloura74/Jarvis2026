/**
 * Cache intelligent pour Google Gemini API
 *
 * Système de mise en cache des décisions IA pour réduire drastiquement
 * les appels API et améliorer les temps de réponse.
 *
 * Fonctionnalités :
 * - Normalisation des commandes (insensible à la casse, verbes synonymes)
 * - TTL (Time To Live) de 24h avec expiration automatique
 * - LRU (Least Recently Used) avec limite de 200 entrées
 * - Statistiques de performance (hit rate, top commandes)
 * - Persistance optionnelle dans localStorage
 *
 * Impact attendu :
 * - Réduction de 60-80% des appels Gemini
 * - Latence réduite de ~400ms à ~0ms pour les commandes en cache
 * - Économie significative du quota API gratuit
 *
 * @module geminiCache
 */

import { OmniDecision } from "../types";
import { semanticSimilarity } from "./geminiCacheSemantic";

/**
 * Structure d'une entrée dans le cache
 */
interface CachedDecision {
  /** Commande originale (pour affichage) */
  command: string;
  /** Décision IA mise en cache */
  decision: OmniDecision;
  /** Timestamp de création (pour TTL) */
  timestamp: number;
  /** Nombre de fois que cette entrée a été réutilisée */
  hitCount: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Durée de vie du cache : 24 heures */
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h en millisecondes

/** Nombre maximum d'entrées en cache (LRU au-delà) */
const MAX_CACHE_SIZE = 200;

/** Clé localStorage pour persistance (optionnel) */
const STORAGE_KEY = "jarvis_gemini_cache";

// ============================================================================
// STOCKAGE
// ============================================================================

/**
 * Cache en mémoire (Map JavaScript pour performance O(1))
 * Clé = commande normalisée, Valeur = CachedDecision
 */
const cache = new Map<string, CachedDecision>();

// ============================================================================
// NORMALISATION DES COMMANDES
// ============================================================================

/**
 * Liste des verbes d'action courants (pour normalisation)
 * Permet de matcher "ouvre Chrome" avec "lance Chrome"
 */
const ACTION_VERBS = [
  "lance",
  "ouvre",
  "démarre",
  "start",
  "open",
  "launch",
  "ferme",
  "close",
  "quitte",
  "quit",
  "exit",
  "minimise",
  "minimize",
  "réduis",
  "maximise",
  "maximize",
  "agrandis",
  "recherche",
  "search",
  "cherche",
  "find",
  "va",
  "go",
  "aller",
];

/**
 * Normalise une commande pour améliorer le matching du cache
 *
 * Transformations appliquées :
 * - Lowercase (insensible à la casse)
 * - Suppression verbes d'action en début
 * - Trim des espaces
 * - Normalisation espaces multiples
 *
 * @param input - Commande brute utilisateur
 * @returns Commande normalisée pour clé de cache
 *
 * @example
 * normalizeCommand("Ouvre Chrome")   => "chrome"
 * normalizeCommand("Lance chrome")   => "chrome"
 * normalizeCommand("DÉMARRE CHROME") => "chrome"
 * normalizeCommand("  ouvre    notepad  ") => "notepad"
 */
function normalizeCommand(input: string): string {
  let normalized = input.toLowerCase().trim().replace(/\s+/g, " "); // Espaces multiples → simple

  // Retirer verbe d'action en début de phrase
  for (const verb of ACTION_VERBS) {
    const pattern = new RegExp(`^${verb}\\s+`, "i");
    if (pattern.test(normalized)) {
      normalized = normalized.replace(pattern, "").trim();
      break; // Un seul verbe par commande
    }
  }

  return normalized;
}

// ============================================================================
// OPÉRATIONS CACHE
// ============================================================================

/**
 * Récupère une décision depuis le cache si disponible et valide
 *
 * Vérifications effectuées :
 * 1. Existence de la clé normalisée
 * 2. Expiration (TTL 24h)
 * 3. Incrémentation du hit counter (analytics)
 *
 * @param input - Commande utilisateur
 * @returns Décision mise en cache ou null si absent/expiré
 *
 * @example
 * const decision = getCachedDecision("ouvre Chrome");
 * if (decision) {
 *   // Cache HIT : utiliser decision (0ms, 0 API call)
 *   console.log("✅ CACHE HIT");
 * } else {
 *   // Cache MISS : appeler Gemini
 *   console.log("❌ CACHE MISS");
 * }
 */
export function getCachedDecision(input: string): OmniDecision | null {
  const normalized = normalizeCommand(input);
  const cached = cache.get(normalized);

  // 🎯 Tentative 1: Match exact
  if (!cached) {
    // 🎯 Tentative 2: Match sémantique (fuzzy)
    return getCachedDecisionSemantic(normalized, input);
  }

  // Vérifier expiration (TTL 24h)
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    console.log(
      `🗑️ Cache expiré pour "${input}" (${Math.round(age / 1000 / 60 / 60)}h)`,
    );
    cache.delete(normalized);
    return null;
  }

  // Incrémenter compteur d'utilisation (analytics)
  cached.hitCount++;

  console.log(
    `✅ CACHE HIT (exact): "${input}" → "${cached.command}" (${cached.hitCount} réutilisations)`,
  );

  return cached.decision;
}

/**
 * Recherche sémantique dans le cache avec seuil de similarité
 * Utilisé en fallback si pas de match exact
 *
 * @param normalized - Commande normalisée (sans match exact)
 * @param original - Commande originale (pour logging)
 * @returns Décision similaire ou null
 */
function getCachedDecisionSemantic(
  normalized: string,
  original: string,
): OmniDecision | null {
  const SIMILARITY_THRESHOLD = 70; // 70% de similarité minimum

  let bestMatch: { key: string; entry: CachedDecision; score: number } | null =
    null;

  // Parcourir toutes les entrées du cache
  for (const [key, entry] of cache.entries()) {
    // Vérifier expiration
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL) {
      cache.delete(key);
      continue;
    }

    // Calculer similarité sémantique
    const score = semanticSimilarity(normalized, key);

    // Garder le meilleur match
    if (score >= SIMILARITY_THRESHOLD) {
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { key, entry, score };
      }
    }
  }

  if (bestMatch) {
    bestMatch.entry.hitCount++;
    console.log(
      `✅ CACHE HIT (semantic ${bestMatch.score}%): "${original}" ≈ "${bestMatch.entry.command}"`,
    );
    return bestMatch.entry.decision;
  }

  console.log(`❌ CACHE MISS: "${original}"`);
  return null;
}

/**
 * Sauvegarde une décision dans le cache
 *
 * Logique LRU (Least Recently Used) :
 * - Si cache plein (>= MAX_CACHE_SIZE), supprimer l'entrée la plus ancienne
 * - Ajouter la nouvelle entrée avec timestamp actuel
 *
 * @param input - Commande utilisateur originale
 * @param decision - Décision Gemini à mettre en cache
 *
 * @example
 * const decision = await parseCommand("ouvre Chrome", memories);
 * setCachedDecision("ouvre Chrome", decision);
 * // Prochaine fois : getCachedDecision("lance Chrome") → HIT (normalisé)
 */
export function setCachedDecision(input: string, decision: OmniDecision): void {
  const normalized = normalizeCommand(input);

  // Gestion LRU : supprimer entrée la plus ancienne si limite atteinte
  if (cache.size >= MAX_CACHE_SIZE) {
    // Map.keys() retourne dans ordre d'insertion → premier = plus ancien
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      const oldestEntry = cache.get(oldestKey);
      const commandName = oldestEntry?.command || "inconnu";
      console.log(`🗑️ Cache plein, suppression LRU: "${commandName}"`);
      cache.delete(oldestKey);
    }
  }

  // Ajouter nouvelle entrée
  cache.set(normalized, {
    command: input,
    decision,
    timestamp: Date.now(),
    hitCount: 0, // Sera incrémenté à chaque réutilisation
  });

  console.log(`💾 Cache sauvegardé: "${input}" → "${normalized}"`);
}

/**
 * Efface complètement le cache (reset)
 * Utile pour tests ou changement majeur de comportement IA
 */
export function clearCache(): void {
  cache.clear();
  console.log("🗑️ Cache Gemini effacé complet");
}

// ============================================================================
// STATISTIQUES & ANALYTICS
// ============================================================================

/**
 * Statistiques de performance du cache
 */
export interface CacheStats {
  /** Nombre total d'entrées en cache */
  size: number;
  /** Taux de hit global (calculé manuellement via tracking externe) */
  hitRate?: number;
  /** Top 10 des commandes les plus réutilisées */
  topCommands: Array<{
    command: string;
    hits: number;
    age: string; // "2h" / "1j" / "3s"
  }>;
  /** Âge moyen des entrées en cache */
  averageAge: string;
}

/**
 * Récupère les statistiques du cache pour monitoring
 *
 * Utile pour :
 * - Vérifier efficacité du cache (hit count élevé = bon)
 * - Debug (voir quelles commandes sont mises en cache)
 * - Analytics utilisateur (commandes fréquentes)
 *
 * @returns Statistiques détaillées
 *
 * @example
 * const stats = getCacheStats();
 * console.log(`Cache: ${stats.size} entrées`);
 * console.log(`Top commande: ${stats.topCommands[0].command} (${stats.topCommands[0].hits} hits)`);
 */
export function getCacheStats(): CacheStats {
  const entries = Array.from(cache.values());

  // Top commandes triées par hit count
  const topCommands = entries
    .sort((a, b) => b.hitCount - a.hitCount)
    .slice(0, 10)
    .map((entry) => ({
      command: entry.command,
      hits: entry.hitCount,
      age: formatAge(Date.now() - entry.timestamp),
    }));

  // Âge moyen des entrées
  const totalAge = entries.reduce(
    (sum, e) => sum + (Date.now() - e.timestamp),
    0,
  );
  const averageAge =
    entries.length > 0 ? formatAge(totalAge / entries.length) : "0s";

  return {
    size: cache.size,
    topCommands,
    averageAge,
  };
}

/**
 * Formate un timestamp en durée lisible
 * @param ms - Millisecondes
 * @returns Durée formatée ("2h", "1j", "45s")
 */
function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}j`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

// ============================================================================
// PERSISTANCE LOCALSTORAGE (OPTIONNEL)
// ============================================================================

/**
 * Sauvegarde le cache dans localStorage
 * Permet de conserver le cache entre sessions navigateur
 *
 * Note : Désactivé par défaut (peut être activé en V2)
 * Raison : Les décisions IA peuvent changer, mieux vaut un cache frais
 */
export function persistCache(): void {
  try {
    const entries = Array.from(cache.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    console.log(`💾 Cache persisté: ${entries.length} entrées`);
  } catch (error) {
    console.error("Erreur persistance cache:", error);
  }
}

/**
 * Restaure le cache depuis localStorage
 * À appeler au démarrage de l'application
 */
export function restoreCache(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const entries: [string, CachedDecision][] = JSON.parse(stored);

    // Filtrer les entrées expirées
    let restoredCount = 0;
    for (const [key, value] of entries) {
      const age = Date.now() - value.timestamp;
      if (age <= CACHE_TTL) {
        cache.set(key, value);
        restoredCount++;
      }
    }

    console.log(
      `♻️ Cache restauré: ${restoredCount}/${entries.length} entrées valides`,
    );
  } catch (error) {
    console.error("Erreur restauration cache:", error);
  }
}
