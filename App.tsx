/**
 * Composant Principal OMNI / J.A.R.V.I.S.
 *
 * Interface web immersive simulant un système d'exploitation intelligent.
 * Architecture Refactorisée : Orchestration via Hooks Spécialisés.
 */

import React, { useState, useCallback, useRef } from "react";
import { Toaster } from "react-hot-toast";

// Composants & Styles
import { PremiumLayout } from "./components/PremiumLayout";
import { INITIAL_LOGS } from "./constants";
import { toasterConfig } from "./utils/toasterConfig";
import { LogEntry, SystemStatus } from "./types";

// Hooks Spécialisés (Architecture Modulaire)
import { useJarvisInteraction } from "./hooks/useJarvisInteraction";
import { useJarvisBrain } from "./hooks/useJarvisBrain";
import { useAppMemory } from "./hooks/useAppMemory";
import { useAppPaths } from "./hooks/useAppPaths";
import { useAutonomy } from "./hooks/useAutonomy";
import { useSystemStatus } from "./hooks/useSystemStatus";

const App: React.FC = () => {
  // ========================================
  // ÉTAT GLOBAL & SERVICES PARTAGÉS
  // ========================================
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const { status, setStatus } = useSystemStatus();
  const { memory: appMemory, updateMemory } = useAppMemory();
  const { findApp } = useAppPaths();

  // Gestion centralisée des logs
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

  // ========================================
  // CERVEAU & INTERACTION (Cyclic Dependency resolved via Refs)
  // ========================================

  // 1. Brain Ref (pour être appelé par Interaction)
  const brainRef = useRef<any>(null);

  // 2. Interaction (Gère Voix, Micro, Synthèse)
  // Elle a besoin de savoir quoi faire quand une commande arrive
  const interaction = useJarvisInteraction({
    status,
    setStatus,
    addLog,
    onCommandReceived: (text) => {
      // Redirection vers le cerveau via la ref
      if (brainRef.current) {
        brainRef.current.processCommand(text);
      }
    },
  });

  // 3. Brain (Gère Gemini, Outils, Historique)
  // Il a besoin de parler (speak)
  const brain = useJarvisBrain({
    appMemory,
    updateMemory,
    findApp,
    addLog,
    setStatus,
    speak: interaction.speak,
    setActiveOverlay,
  });

  // Mise à jour de la ref pour boucler la boucle
  brainRef.current = brain;

  // ========================================
  // MODULES AUTONOMES
  // ========================================
  useAutonomy({
    enabled: status === SystemStatus.IDLE,
    onAction: (msg) => addLog(msg, "OMNI", "info"),
  });

  // ========================================
  // RENDER UI
  // ========================================
  return (
    <>
      <PremiumLayout
        status={
          status === SystemStatus.IDLE
            ? "idle"
            : status === SystemStatus.LISTENING
              ? "listening"
              : status === SystemStatus.PROCESSING
                ? "processing"
                : "speaking"
        }
        // Données du Cerveau
        commandCount={brain.commandHistory.length}
        successTrigger={brain.successTrigger}
        onCommand={brain.processCommand}
        // Données d'Interaction
        isListening={interaction.isListening}
        onMicrophoneClick={interaction.handleMicrophoneClick}
        // Données Système
        cpuUsage={Math.floor(20 + Math.random() * 15)} // Simulation
        memoryUsage="4.2 GB"
        logs={logs.map((log) => ({
          source: log.source,
          message: log.message,
          type: log.type as "info" | "success" | "error" | "warning",
        }))}
        isProcessing={status === SystemStatus.PROCESSING}
        processingMessage={activeOverlay || "🤖 JARVIS analyse..."}
      />

      <Toaster {...toasterConfig} />
    </>
  );
};

export default App;
