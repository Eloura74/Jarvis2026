/**
 * Recherche fuzzy d'applications
 * @module apps/search
 */

import { APPS_DATABASE } from "./database";
import type { SearchResult } from "./types";

/**
 * Recherche fuzzy d'applications par nom ou mots-clés
 *
 * Algorithme:
 * 1. Recherche directe par nom/alias
 * 2. Recherche par mots-clés contenus
 * 3. Recherche par catégorie
 * 4. Score de pertinence basé sur correspondances
 *
 * @param query - Requête utilisateur (ex: "éditeur de code", "bambu", "navigateur")
 * @param maxResults - Nombre maximum de résultats (défaut: 5)
 * @returns Liste d'apps triées par pertinence
 */
export const searchApps = (query: string, maxResults: number = 5): string[] => {
  const queryLower = query.toLowerCase();
  const results: SearchResult[] = [];

  Object.entries(APPS_DATABASE).forEach(([appName, appData]) => {
    let score = 0;

    // Score 100 : Correspondance exacte du nom
    if (appName.toLowerCase() === queryLower) {
      score = 100;
    }
    // Score 90 : Correspondance d'alias
    else if (
      appData.aliases?.some((alias) => alias.toLowerCase() === queryLower)
    ) {
      score = 90;
    }
    // Score 80 : Nom contient la requête
    else if (appName.toLowerCase().includes(queryLower)) {
      score = 80;
    }
    // Score 70 : Alias contient la requête
    else if (
      appData.aliases?.some((alias) => alias.toLowerCase().includes(queryLower))
    ) {
      score = 70;
    }
    // Score 60 : Requête contient le nom (ex: "lance vscode maintenant" → vscode)
    else if (queryLower.includes(appName.toLowerCase())) {
      score = 60;
    }
    // Score 50 : Mots-clés correspondent
    else if (
      appData.keywords.some(
        (keyword) =>
          queryLower.includes(keyword) || keyword.includes(queryLower),
      )
    ) {
      score = 50;
    }
    // Score 40 : Catégorie correspond
    else if (
      queryLower.includes(appData.category) ||
      appData.category.includes(queryLower)
    ) {
      score = 40;
    }
    // Score 30 : Description correspond
    else if (appData.description.toLowerCase().includes(queryLower)) {
      score = 30;
    }

    if (score > 0) {
      results.push({ name: appName, score });
    }
  });

  // Tri par score décroissant, puis par nom alphabétique
  return results
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, maxResults)
    .map((r) => r.name);
};
