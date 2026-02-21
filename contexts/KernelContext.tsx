import React, { useState, useCallback, ReactNode, useEffect } from "react";
import { LogEntry } from "../types";
import { useSystemStatus } from "../hooks/useSystemStatus";
import { useAppMemory } from "../hooks/useAppMemory";
import { useAppPaths } from "../hooks/useAppPaths";
import { useConversationMemory } from "../hooks/useConversationMemory";
import { INITIAL_LOGS } from "../constants";
import {
  KernelContext,
  KernelContextType,
  VoiceSettings,
} from "./KernelContextDefinition";
import {
  storageGet,
  storageSet,
  STORAGE_KEYS,
  runStorageCleanup,
} from "../services/storageService";

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
        type,
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

  // Nettoyage localStorage au montage (une seule fois)
  useEffect(() => {
    runStorageCleanup();
  }, []);

  // 6. Paramètres Voix
  const [voiceSettings, setVoiceSettingsState] = useState<VoiceSettings>(() =>
    storageGet<VoiceSettings>(STORAGE_KEYS.VOICE_SETTINGS, {
      voiceURI: null,
      pitch: 1.0,
      rate: 1.0,
      volume: 1.0,
    }),
  );

  const setVoiceSettings = useCallback((settings: VoiceSettings) => {
    setVoiceSettingsState(settings);
    storageSet(STORAGE_KEYS.VOICE_SETTINGS, settings);
  }, []);

  // 7. Gestion du Wake Word
  const [wakeWordEnabled, setWakeWordEnabledState] = useState<boolean>(() =>
    storageGet<boolean>(STORAGE_KEYS.WAKE_WORD_ENABLED, true),
  );

  const setWakeWordEnabled = useCallback((enabled: boolean) => {
    setWakeWordEnabledState(enabled);
    storageSet(STORAGE_KEYS.WAKE_WORD_ENABLED, enabled);
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
