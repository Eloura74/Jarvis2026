import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { LogEntry, SystemStatus, AppMemory } from "../types";
import { useSystemStatus } from "../hooks/useSystemStatus";
import { useAppMemory } from "../hooks/useAppMemory";
import { useAppPaths, AppPath } from "../hooks/useAppPaths";
import {
  useConversationMemory,
  ChatMessage,
} from "../hooks/useConversationMemory";
import { INITIAL_LOGS } from "../constants";

// ========================================
// TYPES
// ========================================

export interface VoiceSettings {
  voiceURI: string | null;
  pitch: number;
  rate: number;
  volume: number;
}

interface KernelContextType {
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

// ========================================
// CONTEXT
// ========================================

const KernelContext = createContext<KernelContextType | undefined>(undefined);

// ========================================
// PROVIDER
// ========================================

interface KernelProviderProps {
  children: ReactNode;
}

export const KernelProvider: React.FC<KernelProviderProps> = ({ children }) => {
  // 1. Gestion des Logs
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);

  const addLog = useCallback(
    (
      message: string,
      source: LogEntry["source"] = "SYSTEM",
      type: LogEntry["type"] = "info",
    ) => {
      const newLog: LogEntry = {
        id: Date.now().toString() + Math.random().toString(),
        timestamp: new Date().toISOString(),
        message,
        source,
        type: type as any,
      };
      setLogs((prev) => [newLog, ...prev].slice(0, 100));
    },
    [],
  );

  const clearLogs = useCallback(() => setLogs([]), []);

  // 2. Gestion du Statut Système
  const { status, setStatus } = useSystemStatus();

  // 3. Gestion de la Mémoire App & Chemins
  const { memory: appMemory, updateMemory } = useAppMemory();
  const { findApp } = useAppPaths();

  // 4. Gestion de la Mémoire Conversationnelle (Corrigé)
  const {
    history: conversationHistory,
    addMessage: addConversationMessage,
    clearHistory: clearConversationHistory,
    getContext: getConversationContext,
  } = useConversationMemory();

  // 5. Mode Visuel
  const [visualMode, setVisualModeState] = useState<{
    query: string | null;
    isVisible: boolean;
  }>({
    query: null,
    isVisible: false,
  });

  const setVisualMode = useCallback(
    (query: string | null, isVisible: boolean) => {
      setVisualModeState({ query, isVisible });
    },
    [],
  );

  // 6. Paramètres Voix (NOUVEAU)
  const [voiceSettings, setVoiceSettingsState] = useState<VoiceSettings>(() => {
    // Charger depuis localStorage si dispo
    const saved = localStorage.getItem("jarvis_voice_settings");
    return saved
      ? JSON.parse(saved)
      : {
          voiceURI: null,
          pitch: 1.0,
          rate: 1.0,
          volume: 1.0,
        };
  });

  const setVoiceSettings = useCallback((settings: VoiceSettings) => {
    setVoiceSettingsState(settings);
    localStorage.setItem("jarvis_voice_settings", JSON.stringify(settings));
  }, []);

  // 7. Gestion du Wake Word (NOUVEAU)
  const [wakeWordEnabled, setWakeWordEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem("jarvis_wake_word_enabled");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const setWakeWordEnabled = useCallback((enabled: boolean) => {
    setWakeWordEnabledState(enabled);
    localStorage.setItem("jarvis_wake_word_enabled", JSON.stringify(enabled));
  }, []);

  // Valeur exposée
  const value: KernelContextType = {
    status,
    setStatus,
    logs,
    addLog,
    clearLogs,
    appMemory,
    updateMemory,
    findApp,
    conversationHistory,
    addConversationMessage,
    clearConversationHistory,
    getConversationContext,
    visualMode,
    setVisualMode,
    voiceSettings,
    setVoiceSettings,
    wakeWordEnabled,
    setWakeWordEnabled,
  };

  return (
    <KernelContext.Provider value={value}>{children}</KernelContext.Provider>
  );
};

// ========================================
// HOOK DE CONSOMMATION
// ========================================

export const useKernel = () => {
  const context = useContext(KernelContext);
  if (context === undefined) {
    throw new Error("useKernel must be used within a KernelProvider");
  }
  return context;
};
