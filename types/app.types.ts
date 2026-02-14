/**
 * Types spécifiques à l'application JARVIS
 * Complète les types de base dans ./types
 */

import { SystemStatus, LogEntry, OmniDecision } from "../types";

export { SystemStatus };
export type { LogEntry, OmniDecision };

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
    source?:
      | "SYSTEM"
      | "USER"
      | "OMNI"
      | "KERNEL"
      | "VOICE"
      | "GMAIL"
      | "CALENDAR",
    type?: "info" | "success" | "error" | "warning",
  ) => void;
  setStatus: (status: SystemStatus) => void;
  speak: (text: string) => void;
  setVisualMode?: (query: string | null, isVisible: boolean) => void;
  stopConversation?: () => void;
}
