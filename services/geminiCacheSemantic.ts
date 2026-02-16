/**
 * Extension sémantique du cache Gemini
 *
 * Améliore le taux de hit en détectant des commandes similaires
 * même si elles ne matchent pas exactement après normalisation.
 *
 * Exemple :
 * - Cache: "rapport VZ330"
 * - User: "statut de la VZ330"
 * - Similarité: 65% → HIT si seuil ≥ 60%
 *
 * @module geminiCacheSemantic
 */

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 * (nombre minimum d'opérations pour transformer s1 en s2)
 *
 * @param s1 - Première chaîne
 * @param s2 - Deuxième chaîne
 * @returns Distance de Levenshtein (0 = identique)
 */
function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  // Initialisation matrice
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Calcul distances
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Deletion
        matrix[i][j - 1] + 1, // Insertion
        matrix[i - 1][j - 1] + cost, // Substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calcule le score de similarité entre deux commandes (0-100%)
 *
 * Algorithme :
 * 1. Distance de Levenshtein
 * 2. Normalisation par longueur max
 * 3. Conversion en pourcentage de similarité
 *
 * @param cmd1 - Première commande (normalisée)
 * @param cmd2 - Deuxième commande (normalisée)
 * @returns Score de similarité (0-100)
 *
 * @example
 * calculateSimilarity("rapport vz330", "statut vz330") // ~ 73%
 * calculateSimilarity("chrome", "firefox")             // ~ 28%
 */
export function calculateSimilarity(cmd1: string, cmd2: string): number {
  if (cmd1 === cmd2) return 100;

  const distance = levenshteinDistance(cmd1, cmd2);
  const maxLength = Math.max(cmd1.length, cmd2.length);

  // Similarity score: 1 - (distance / maxLength)
  const similarity = Math.max(0, 1 - distance / maxLength);

  return Math.round(similarity * 100);
}

/**
 * Extrait les mots-clés d'une commande pour améliorer matching
 * Filtre les stop words français (le, la, un, de, etc.)
 *
 * @param normalized - Commande normalisée
 * @returns Array de mots-clés significatifs
 *
 * @example
 * extractKeywords("rapport de l'imprimante vz330")
 * // → ["rapport", "imprimante", "vz330"]
 */
export function extractKeywords(normalized: string): string[] {
  const stopWords = [
    "le",
    "la",
    "les",
    "un",
    "une",
    "des",
    "de",
    "du",
    "à",
    "au",
    "en",
    "et",
    "ou",
    "pour",
    "sur",
    "dans",
    "avec",
    "sans",
    "par",
    "the",
    "a",
    "an",
    "of",
    "to",
    "in",
    "on",
    "for",
    "with",
  ];

  return normalized
    .split(/\s+/)
    .filter((word) => word.length > 2) // Min 3 caractères
    .filter((word) => !stopWords.includes(word));
}

/**
 * Calculate keyword overlap score entre deux commandes
 * Complète la distance de Levenshtein pour gérer ordre différent
 *
 * @param cmd1Keywords - Mots-clés commande 1
 * @param cmd2Keywords - Mots-clés commande 2
 * @returns Score d'overlap (0-100)
 *
 * @example
 * keywordOverlap(["rapport", "vz330"], ["vz330", "statut"]) // 50%
 */
export function keywordOverlap(
  cmd1Keywords: string[],
  cmd2Keywords: string[],
): number {
  if (cmd1Keywords.length === 0 || cmd2Keywords.length === 0) return 0;

  const set1 = new Set(cmd1Keywords);
  const set2 = new Set(cmd2Keywords);

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  // Jaccard Similarity
  return Math.round((intersection.size / union.size) * 100);
}

/**
 * Score combiné de similarité sémantique
 * Combine Levenshtein + Keyword Overlap pour plus de robustesse
 *
 * @param cmd1 - Commande 1 (normalisée)
 * @param cmd2 - Commande 2 (normalisée)
 * @returns Score final (0-100), fusion pondérée
 *
 * @example
 * semanticSimilarity("rapport imprimante vz330", "statut de la vz330")
 * // Levenshtein: ~60%, Keywords: ~66% → Combined: ~63%
 */
export function semanticSimilarity(cmd1: string, cmd2: string): number {
  const levenScore = calculateSimilarity(cmd1, cmd2);

  const keywords1 = extractKeywords(cmd1);
  const keywords2 = extractKeywords(cmd2);
  const keywordScore = keywordOverlap(keywords1, keywords2);

  // Moyenne pond érée: Levenshtein 60%, Keywords 40%
  // Keywords moins fiables car insensibles à l'ordre
  const combined = Math.round(levenScore * 0.6 + keywordScore * 0.4);

  return combined;
}
