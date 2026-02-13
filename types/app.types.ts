/**
 * Types spécifiques à l'application JARVIS
 * Complète les types de base dans ./types
 */

// Réexport types de base
export type { LogEntry, OmniDecision } from "../types";
export { SystemStatus } from "../types";

/**
 * Configuration utilisateur JARVIS
 */
export interface JarvisSettings {
  wakeWordEnabled: boolean;
  voiceLanguage: "fr-FR" | "en-US" | "en-GB";
  wakeWordThreshold: number;
  voiceVolume: number;
  theme: "classic" | "ironman" | "matrix";
}

/**
 * Information sur une commande exécutée
 */
export interface CommandInfo {
  text: string;
  timestamp: number;
  result?: string;
  status?: "success" | "error" | "pending";
}

/**
 * Contexte passé aux handlers
 */
export interface HandlerContext {
  addLog: (
    message: string,
    source?: "SYSTEM" | "USER" | "OMNI" | "KERNEL" | "VOICE",
    type?: "info" | "success" | "error" | "warning",
  ) => void;
  setStatus: (status: SystemStatus) => void;
  setVisualMode?: (query: string | null, isVisible: boolean) => void; // Optionnel pour compatibilité
}
