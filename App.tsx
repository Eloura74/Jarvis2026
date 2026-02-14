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
import { ImageOverlay } from "./components/ImageOverlay";
import { toasterConfig } from "./utils/toasterConfig";
import { SystemStatus } from "./types";

// Hooks Spécialisés
import { useJarvisInteraction } from "./hooks/useJarvisInteraction";
import { useJarvisBrain } from "./hooks/useJarvisBrain";
import { useAutonomy } from "./hooks/useAutonomy";
import { useSystemStats } from "./hooks/useSystemStats";
import {
  useGlobalShortcuts,
  createListenShortcut,
} from "./hooks/useGlobalShortcuts";

// ============================================================================
// SHELL (Composant Interne avec accès au Kernel)
// ============================================================================

const JarvisShell: React.FC = () => {
  // Accès au "Noyau" via Context
  const {
    status,
    setStatus,
    logs,
    addLog,
    appMemory,
    updateMemory,
    findApp,
    visualMode, // NOUVEAU
    setVisualMode, // NOUVEAU
    addConversationMessage, // NOUVEAU
    getConversationContext, // NOUVEAU
  } = useKernel();

  // État local UI (non-partagé)
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);

  // Système (Stats Dynamiques)
  const systemStats = useSystemStats();

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
    setVisualMode, // NOUVEAU
    addConversationMessage, // NOUVEAU
    getConversationContext, // NOUVEAU
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
  // RACCOURCIS CLAVIER GLOBAUX
  // ========================================

  useGlobalShortcuts({
    shortcuts: [
      createListenShortcut(() => {
        // Activer l'écoute vocale avec Ctrl+Space
        if (status === SystemStatus.IDLE) {
          interaction.handleMicrophoneClick();
        }
      }),
    ],
    enabled: true,
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
        successTrigger={brain.successTrigger}
        onCommand={brain.processCommand}
        // Données Interaction (Micro)
        isListening={interaction.isListening}
        onMicrophoneClick={interaction.handleMicrophoneClick}
        // Données Système (Via Context Kernel)
        cpuUsage={systemStats.cpuUsage}
        memoryUsage={`${systemStats.memoryUsage} GB`}
        processes={systemStats.processes} // NOUVEAU
        logs={logs.map((log) => ({
          source: log.source,
          message: log.message,
          type: log.type as any,
        }))}
        isProcessing={status === SystemStatus.PROCESSING}
        processingMessage={activeOverlay || "🤖 JARVIS analyse..."}
      />

      {/* Overlay Visuel (Images) */}
      <ImageOverlay
        query={visualMode.query}
        isVisible={visualMode.isVisible}
        onClose={() => setVisualMode(null, false)}
      />

      <Toaster {...toasterConfig} />
    </>
  );
};

// ============================================================================
// APP ROOT (Wrapper Provider)
// ============================================================================

import { StartOverlay } from "./components/StartOverlay";

const App: React.FC = () => {
  // Fonction pour "réveiller" l'audio context
  const unlockAudio = () => {
    const synth = window.speechSynthesis;
    if (synth) {
      // 1. Resume
      if (synth.paused) synth.resume();

      // 2. Jouer un silence
      const utterance = new SpeechSynthesisUtterance("");
      utterance.volume = 0;
      utterance.rate = 1; // Bug fix: some browsers need rate defined
      synth.speak(utterance);

      console.log("🔓 Audio Context débloqué via interaction utilisateur");
    }
  };

  return (
    <KernelProvider>
      <StartOverlay onStart={unlockAudio} />
      <JarvisShell />
    </KernelProvider>
  );
};

export default App;
