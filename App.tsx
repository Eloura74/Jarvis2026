/**
 * Composant Principal OMNI / J.A.R.V.I.S.
 *
 * Architecture :
 * 1. KernelProvider : Fournit l'état global (Logs, Status, Memory)
 * 2. JarvisShell : Consomme le Kernel et gère l'orchestration (Brain, Interaction, UI)
 */

import React, { useState, useRef } from "react";
import { Toaster } from "react-hot-toast";

// Context
import { KernelProvider, useKernel } from "./contexts/KernelContext";

// Composants UI
import { PremiumLayout } from "./components/PremiumLayout";
import { toasterConfig } from "./utils/toasterConfig";
import { SystemStatus } from "./types";
import { CommandInfo } from "./types/app.types";

// Hooks Spécialisés
import { useJarvisInteraction } from "./hooks/useJarvisInteraction";
import { useJarvisBrain } from "./hooks/useJarvisBrain";
import { useAutonomy } from "./hooks/useAutonomy";

// ============================================================================
// SHELL (Composant Interne avec accès au Kernel)
// ============================================================================

const JarvisShell: React.FC = () => {
  // Accès au "Noyau" via Context
  const { status, setStatus, logs, addLog, appMemory, updateMemory, findApp } =
    useKernel();

  // État local UI (non-partagé)
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);

  // ========================================
  // CERVEAU & INTERACTION
  // ========================================

  const brainRef = useRef<any>(null);

  // Interaction (Voix/Micro)
  const interaction = useJarvisInteraction({
    status,
    setStatus,
    addLog,
    onCommandReceived: (text) => {
      brainRef.current?.processCommand(text);
    },
  });

  // Cerveau (Logique)
  const brain = useJarvisBrain({
    appMemory,
    updateMemory,
    findApp,
    addLog,
    setStatus,
    speak: interaction.speak,
    setActiveOverlay,
  });

  brainRef.current = brain;

  // ========================================
  // AUTONOMIE
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
        // Données Cerveau (Commande & Historique)
        commandCount={brain.commandHistory.length}
        successTrigger={brain.successTrigger}
        onCommand={brain.processCommand}
        // Données Interaction (Micro)
        isListening={interaction.isListening}
        onMicrophoneClick={interaction.handleMicrophoneClick}
        // Données Système (Via Context Kernel)
        cpuUsage={Math.floor(20 + Math.random() * 15)}
        memoryUsage="4.2 GB"
        logs={logs.map((log) => ({
          source: log.source,
          message: log.message,
          type: log.type as any,
        }))}
        isProcessing={status === SystemStatus.PROCESSING}
        processingMessage={activeOverlay || "🤖 JARVIS analyse..."}
      />
      <Toaster {...toasterConfig} />
    </>
  );
};

// ============================================================================
// APP ROOT (Wrapper Provider)
// ============================================================================

const App: React.FC = () => {
  return (
    <KernelProvider>
      <JarvisShell />
    </KernelProvider>
  );
};

export default App;
