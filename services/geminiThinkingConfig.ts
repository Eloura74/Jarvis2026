/**
 * geminiThinkingConfig.ts — Configuration du budget de réflexion Gemini 2.5 Flash
 *
 * Gemini 2.5 Flash supporte un "thinking budget" : le modèle peut réfléchir
 * en arrière-plan avant de générer la réponse finale en streaming.
 *
 * Modes disponibles :
 * - "off"      → 0 token de réflexion, vitesse maximale (réponses simples)
 * - "low"      → ~512 tokens, légère réflexion (questions factuelles)
 * - "auto"     → -1, Gemini décide seul (recommandé par défaut)
 * - "high"     → ~8192 tokens, réflexion approfondie (analyses complexes)
 *
 * La réflexion est SUPERPOSÉE au streaming : Gemini "pense" en interne
 * puis génère la réponse finale en flux continu — aucune latence perceptible
 * pour l'utilisateur si le budget est raisonnable (auto ou low).
 *
 * Référence : https://ai.google.dev/gemini-api/docs/thinking
 */

// ============================================================================
// CONSTANTES
// ============================================================================

/** Valeur spéciale Gemini : -1 = budget automatique (Gemini décide) */
export const THINKING_BUDGET_AUTO = -1;

/** Désactive complètement la réflexion (vitesse max, qualité réduite) */
export const THINKING_BUDGET_OFF = 0;

/** Réflexion légère — bon compromis vitesse/qualité pour questions factuelles */
export const THINKING_BUDGET_LOW = 512;

/** Réflexion approfondie — pour analyses, rapports, raisonnements complexes */
export const THINKING_BUDGET_HIGH = 8192;

/** Budget par défaut utilisé si aucun n'est spécifié */
export const THINKING_BUDGET_DEFAULT = THINKING_BUDGET_AUTO;

// ============================================================================
// TYPES
// ============================================================================

/** Modes nommés pour faciliter la configuration sans mémoriser les valeurs */
export type ThinkingMode = "off" | "low" | "auto" | "high";

/** Structure envoyée à l'API Gemini dans le champ config.thinkingConfig */
export interface GeminiThinkingConfig {
  thinkingBudget: number;
}

// ============================================================================
// HELPER — Sélection automatique du budget selon la complexité
// ============================================================================

/**
 * Détermine le budget de réflexion optimal selon le texte de la requête.
 *
 * Logique :
 * - Commandes simples (météo, heure, volume, lancement app) → OFF (0)
 *   Raison : réponse déterministe, pas besoin de réflexion, latence minimale.
 * - Requêtes complexes (analyse, rapport, comparaison, code) → HIGH (8192)
 *   Raison : la réflexion améliore significativement la qualité du raisonnement.
 * - Tout le reste → AUTO (-1)
 *   Raison : Gemini adapte lui-même selon la difficulté perçue.
 *
 * @param input - Texte de la commande utilisateur
 * @returns Valeur numérique du budget de réflexion
 */
export function selectThinkingBudget(input: string): number {
  const t = input.toLowerCase();

  // Commandes déterministes → pas de réflexion nécessaire
  const simplePatterns = [
    "météo",
    "weather",
    "volume",
    "mute",
    "ouvre",
    "lance",
    "allume",
    "éteins",
    "ferme",
    "minimise",
    "maximise",
    "timer",
    "minuteur",
    "heure",
    "quelle heure",
    "bonne nuit",
    "bonjour",
    "au revoir",
    "stop",
    "pause",
    "play",
    "screenshot",
    "capture",
  ];
  if (simplePatterns.some((p) => t.includes(p))) {
    return THINKING_BUDGET_OFF;
  }

  // Requêtes complexes → réflexion approfondie
  const complexPatterns = [
    "analyse",
    "rapport",
    "compare",
    "explique",
    "pourquoi",
    "comment fonctionne",
    "stratégie",
    "optimise",
    "résous",
    "débug",
    "code",
    "programme",
    "algorithme",
    "synthèse",
    "bilan",
    "évalue",
    "recommande",
    "planifie",
    "prévision",
  ];
  if (complexPatterns.some((p) => t.includes(p))) {
    return THINKING_BUDGET_HIGH;
  }

  // Par défaut : Gemini décide automatiquement
  return THINKING_BUDGET_AUTO;
}

/**
 * Convertit un mode nommé en valeur numérique.
 *
 * @param mode - Mode nommé ("off" | "low" | "auto" | "high")
 * @returns Valeur numérique correspondante
 */
export function thinkingModeToValue(mode: ThinkingMode): number {
  switch (mode) {
    case "off":
      return THINKING_BUDGET_OFF;
    case "low":
      return THINKING_BUDGET_LOW;
    case "auto":
      return THINKING_BUDGET_AUTO;
    case "high":
      return THINKING_BUDGET_HIGH;
    default:
      return THINKING_BUDGET_DEFAULT;
  }
}

/**
 * Construit l'objet thinkingConfig prêt à injecter dans la config Gemini.
 * Retourne undefined si le budget est 0 (désactivé) pour ne pas envoyer
 * un paramètre inutile à l'API.
 *
 * @param budget - Valeur numérique du budget (-1, 0, 512, 8192...)
 * @returns GeminiThinkingConfig ou undefined si désactivé
 */
export function buildThinkingConfig(
  budget: number,
): GeminiThinkingConfig | undefined {
  // Budget 0 = désactivé → ne pas envoyer le paramètre à l'API
  if (budget === THINKING_BUDGET_OFF) return undefined;
  return { thinkingBudget: budget };
}
