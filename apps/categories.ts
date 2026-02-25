/**
 * Utilitaires pour gérer les catégories d'applications
 * @module apps/categories
 */

import { APPS_DATABASE } from "./database";

/**
 * Récupère toutes les apps d'une catégorie
 *
 * @param category - Catégorie recherchée (browser, ide, media, etc.)
 * @returns Liste des noms d'apps dans cette catégorie
 */
export const getAppsByCategory = (category: string): string[] => {
  return Object.entries(APPS_DATABASE)
    .filter(([_, appData]) => appData.category === category)
    .map(([appName, _]) => appName);
};

/**
 * Génère la liste formatée des apps disponibles pour le system prompt Gemini
 *
 * @returns String formaté pour inclusion dans le prompt
 */
export const generateAppsListForPrompt = (): string => {
  const categories: Record<string, string[]> = {};

  // Grouper par catégorie
  Object.entries(APPS_DATABASE).forEach(([appName, appData]) => {
    if (!categories[appData.category]) {
      categories[appData.category] = [];
    }
    categories[appData.category].push(appName);
  });

  // Formater pour le prompt
  return Object.entries(categories)
    .map(([category, apps]) => `- ${category}: ${apps.join(", ")}`)
    .join("\n");
};

/**
 * Convertit APPS_DATABASE vers l'ancien format MOCK_FILE_SYSTEM (rétro-compatibilité)
 *
 * @returns Record<string, string> mappage nom → chemin
 */
export const getMockFileSystem = (): Record<string, string> => {
  const result: Record<string, string> = {};
  Object.entries(APPS_DATABASE).forEach(([appName, appData]) => {
    result[appName] = appData.path;
  });
  return result;
};
