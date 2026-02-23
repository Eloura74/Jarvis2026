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
import { runStorageCleanup } from "../services/storageService";
import { useAppSettings } from "../hooks/useAppSettings";

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

  // 6 & 7. Paramètres centralisés via backend (useAppSettings)
  const { settings: appSettings, updateSettings } = useAppSettings();

  // Adaptateur VoiceSettings → format attendu par les composants existants
  const voiceSettings: VoiceSettings = {
    voiceURI: appSettings.voiceURI,
    pitch: appSettings.voicePitch,
    rate: appSettings.voiceRate,
    volume: appSettings.voiceVolume,
  };

  const setVoiceSettings = useCallback(
    (settings: VoiceSettings) => {
      updateSettings({
        voiceURI: settings.voiceURI,
        voicePitch: settings.pitch,
        voiceRate: settings.rate,
        voiceVolume: settings.volume,
      });
    },
    [updateSettings],
  );

  const wakeWordEnabled = appSettings.wakeWordEnabled;

  const setWakeWordEnabled = useCallback(
    (enabled: boolean) => {
      updateSettings({ wakeWordEnabled: enabled });
    },
    [updateSettings],
  );

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
