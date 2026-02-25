/**
 * Types pour la base de données d'applications
 * @module apps/types
 */

/**
 * Structure d'une application dans la base de données
 */
export interface AppEntry {
  /** Chemin complet vers l'exécutable */
  path: string;
  /** Catégorie principale (browser, ide, media, etc.) */
  category: string;
  /** Mots-clés pour recherche sémantique */
  keywords: string[];
  /** Description courte de l'application */
  description: string;
  /** Alias alternatifs pour le nom */
  aliases?: string[];
}

/**
 * Résultat de recherche avec score de pertinence
 */
export interface SearchResult {
  name: string;
  score: number;
}

/**
 * Catégories d'applications disponibles
 */
export type AppCategory =
  | "browser"
  | "ide"
  | "3d-printing"
  | "creative"
  | "media"
  | "productivity"
  | "communication"
  | "system"
  | "gaming"
  | "other";
