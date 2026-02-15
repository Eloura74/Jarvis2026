/**
 * Composant Principal OMNI / J.A.R.V.I.S.
 *
 * Architecture :
 * 1. KernelProvider : Fournit l'état global (Logs, Status, Memory)
 * 2. JarvisShell : Consomme le Kernel et gère l'orchestration (Brain, Interaction, UI)
 */

import React, { useState, useRef, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";
import { checkBackendStatus } from "./services/backendApi";

// Context
import { KernelProvider, useKernel } from "./contexts/KernelContext";
import { MemoryProvider } from "./contexts/MemoryContext"; // NOUVEAU

// Composants UI
import { PremiumLayout } from "./components/PremiumLayout";
import { ImageOverlay } from "./components/ImageOverlay";
import HolographicHUD from "./components/HolographicHUD";
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

interface JarvisShellProps {
  shouldGreet?: boolean;
}

const JarvisShell: React.FC<JarvisShellProps> = ({ shouldGreet }) => {
  // Accès au "Noyau" via Context
  const {
    status,
    setStatus,
    logs,
    addLog,
    appMemory,
    updateMemory,
    findApp,
    visualMode,
    setVisualMode,
    addConversationMessage,
    getConversationContext,
  } = useKernel();

  // État local UI (non-partagé)
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);

  // Système (Stats Dynamiques)
  const systemStats = useSystemStats();

  // ========================================
  // VÉRIFICATION BACKEND AU DÉMARRAGE
  // ========================================
  useEffect(() => {
    const verifyBackend = async () => {
      const isOnline = await checkBackendStatus();
      if (!isOnline) {
        addLog(
          "⚠️ BACKEND OFFLINE - Les commandes ne fonctionneront pas !",
          "SYSTEM",
          "error",
        );
        addLog(
          "💡 Démarrez le backend : cd server && node server.js",
          "SYSTEM",
          "warning",
        );
        console.error(
          "\n" +
            "═══════════════════════════════════════════════════════════\n" +
            "  ⚠️  BACKEND NON DÉMARRÉ\n" +
            "═══════════════════════════════════════════════════════════\n" +
            "\n" +
            "Le serveur backend (port 3001) n'est pas accessible.\n" +
            "\n" +
            "SOLUTION:\n" +
            "1. Ouvrez un nouveau terminal\n" +
            "2. Allez dans le dossier: cd server\n" +
            "3. Démarrez le serveur: node server.js\n" +
            "\n" +
            "OU utilisez le script automatique:\n" +
            "   Double-cliquez sur start-jarvis.bat\n" +
            "\n" +
            "═══════════════════════════════════════════════════════════\n",
        );
      } else {
        addLog("✅ Backend connecté (port 3001)", "SYSTEM", "success");
        console.log("✅ Backend online - Ready to execute commands");
      }
    };
    verifyBackend();
  }, [addLog]);

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
    stopConversation: interaction.stopFullConversation, // NOUVEAU : Arrêt sécurisé de la boucle
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
  // SALUTATION AU DÉMARRAGE (IRON MAN STYLE)
  // ========================================
  const hasGreeted = useRef(false);

  useEffect(() => {
    if (shouldGreet && !hasGreeted.current && systemStats.cpuUsage) {
      hasGreeted.current = true;

      // 1. Déterminer le moment de la journée
      const hour = new Date().getHours();
      let greeting = "Bonjour";
      if (hour >= 18) greeting = "Bonsoir";
      else if (hour < 5) greeting = "Salutations nocturnes";

      // 2. Construire le rapport système
      const cpu = Math.round(systemStats.cpuUsage);

      const messages = [
        `${greeting} Monsieur.`,
        "Initialisation des protocoles terminée.",
        `CPU stable à ${cpu} pourcents.`,
        "Tous les systèmes sont opérationnels.",
        "Je suis à votre service.",
      ];

      // 3. Parler
      let delay = 500;
      messages.forEach((msg) => {
        setTimeout(() => {
          interaction.speak(msg);
        }, delay);
        // Estimation temps de parole : ~60ms par caractère + pause
        delay += msg.length * 60 + 1000;
      });
    }
  }, [shouldGreet, systemStats.cpuUsage, interaction]);

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
        tokenUsage={brain.lastTokenUsage} // NOUVEAU
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

      {/* HUD Holographique pour les suggestions magiques */}
      <HolographicHUD notifications={brain.hudNotifications} />
    </>
  );
};

// ============================================================================
// APP ROOT (Wrapper Provider)
// ============================================================================

import { StartOverlay } from "./components/StartOverlay";
import { IntroSequence } from "./components/IntroSequence";

const App: React.FC = () => {
  const [showStart, setShowStart] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  // Fonction pour "réveiller" l'audio context
  const unlockAudio = () => {
    const synth = window.speechSynthesis;
    if (synth) {
      if (synth.paused) synth.resume();
      const utterance = new SpeechSynthesisUtterance("");
      utterance.volume = 0;
      utterance.rate = 1;
      synth.speak(utterance);
      console.log("🔓 Audio Context débloqué via interaction utilisateur");
    }
  };

  const handleStart = () => {
    unlockAudio();
    setShowStart(false);
    setShowIntro(true); // Lancer la vidéo d'intro
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    setIntroFinished(true); // Active la salutation de JARVIS
  };

  return (
    <KernelProvider>
      <MemoryProvider>
        <AnimatePresence>
          {showStart && (
            <StartOverlay onStart={handleStart} key="start-overlay" />
          )}

          {showIntro && (
            <IntroSequence
              onComplete={handleIntroComplete}
              key="intro-sequence"
            />
          )}
        </AnimatePresence>

        {/* Le Shell est toujours là mais caché par les overlays z-index élevés */}
        <JarvisShell shouldGreet={introFinished} />
      </MemoryProvider>
    </KernelProvider>
  );
};

export default App;
