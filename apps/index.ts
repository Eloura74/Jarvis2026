/**
 * Point d'entrée du module apps
 * Export tous les utilitaires pour la gestion des applications
 * @module apps
 */

// Types
export type { AppEntry, SearchResult, AppCategory } from "./types";

// Database
export { APPS_DATABASE } from "./database";

// Search
export { searchApps } from "./search";

// Categories
export {
  getAppsByCategory,
  generateAppsListForPrompt,
  getMockFileSystem,
} from "./categories";
