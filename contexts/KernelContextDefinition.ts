import { createContext } from "react";
import { SystemStatus, LogEntry, AppMemory } from "../types";
import { AppPath } from "../hooks/useAppPaths";
import { ChatMessage } from "../hooks/useConversationMemory";

export interface VoiceSettings {
  voiceURI: string | null;
  pitch: number;
  rate: number;
  volume: number;
}

export interface KernelContextType {
  // État Système
  status: SystemStatus;
  setStatus: (status: SystemStatus) => void;

  // Logs
  logs: LogEntry[];
  addLog: (
    message: string,
    source?: LogEntry["source"],
    type?: LogEntry["type"],
  ) => void;
  clearLogs: () => void;

  // Mémoire Applicative
  appMemory: AppMemory[];
  updateMemory: (appName: string, path: string) => void;
  findApp: (appName: string) => AppPath | null;

  // Mémoire Conversationnelle
  conversationHistory: ChatMessage[];
  addConversationMessage: (role: "user" | "model", text: string) => void;
  clearConversationHistory: () => void;
  getConversationContext: () => string;

  // Mode Visuel (Images)
  visualMode: { query: string | null; isVisible: boolean };
  setVisualMode: (query: string | null, isVisible: boolean) => void;

  // Paramètres Voix
  voiceSettings: VoiceSettings;
  setVoiceSettings: (settings: VoiceSettings) => void;

  // Wake Word (NOUVEAU)
  wakeWordEnabled: boolean;
  setWakeWordEnabled: (enabled: boolean) => void;
}

export const KernelContext = createContext<KernelContextType | undefined>(
  undefined,
);
