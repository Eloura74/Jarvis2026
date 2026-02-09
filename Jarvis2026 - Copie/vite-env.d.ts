/// <reference types="vite/client" />

/**
 * Déclarations TypeScript pour les variables d'environnement Vite
 *
 * Ce fichier étend l'interface ImportMetaEnv pour ajouter le support
 * des variables d'environnement personnalisées de notre application.
 *
 * Avec Vite, toutes les variables préfixées par VITE_ sont exposées
 * via import.meta.env côté client.
 */

interface ImportMetaEnv {
  /**
   * Clé API Google Gemini
   *
   * Cette clé est requise pour communiquer avec l'API Gemini.
   * Elle doit être définie dans le fichier .env.local
   *
   * Format : AIza...
   */
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
