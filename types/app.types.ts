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
export interface StatusStat {
  label: string;
  value: string | number;
  unit?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any; // Generic to avoid React dependency in shared types
  progress?: number;
  status?: "normal" | "warning" | "critical" | "error";
}

export interface StatusOverlayData {
  id: string;
  title: string;
  type: "printer" | "system" | "custom" | "traffic" | "fleet" | "search";
  lastUpdate: string;
  image?: string;
  stats: Array<{
    label: string;
    value: string | number;
    unit?: string;
    progress?: number;
    status?: "normal" | "warning" | "error";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon?: any;
  }>;
  // Nouveaux - Données enrichies (optionnelles)
  items?: StatusOverlayData[]; // Pour le mode "fleet"
  thumbnail?: string | null;
  nozzleTemp?: number;
  ip?: string;
  webcamUrl?: string;
  nozzleTarget?: number;
  bedTemp?: number;
  bedTarget?: number;
  currentLayer?: number;
  totalLayers?: number;
  speed?: number;
  printDuration?: number;
  eta?: number;

  // Search Results Data
  searchResults?: Array<{
    title: string;
    url: string;
    description: string;
    image: string | null;
    source: string;
  }>;

  // Traffic Data
  origin?: string;
  destination?: string;
  distance?: string;
  duration?: string;
  durationInTraffic?: string;
  trafficModel?: "best_guess" | "pessimistic" | "optimistic";
}

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
      | "CALENDAR"
      | "SECURITY",
    type?: "info" | "success" | "error" | "warning",
  ) => void;
  setStatus: (status: SystemStatus) => void;
  speak: (text: string) => void;
  setVisualMode?: (query: string | null, isVisible: boolean) => void;
  stopConversation?: () => void;
}

export interface ToolResult {
  status: "success" | "error";
  data?: unknown;
  message?: string;
}

export interface TechNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type: "info" | "success" | "warning" | "error" | "quantum" | "alert";
}
