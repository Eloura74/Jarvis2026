import { useEffect, useRef, useState } from "react";
import { useKernel } from "../hooks/useKernel";

import { PremiumLayout } from "../components/PremiumLayout";
import { SystemStatus } from "../types";
import { StatusOverlayData } from "../types/app.types";

import { useJarvisInteraction } from "../hooks/useJarvisInteraction";
import { useJarvisBrain } from "../hooks/useJarvisBrain";
import { useAutonomy } from "../hooks/useAutonomy";
import { useSystemStats } from "../hooks/useSystemStats";

import { useBackendBootstrap } from "../hooks/useBackendBootstrap";
import { useGeminiBootstrap } from "../hooks/useGeminiBootstrap";
import { useGreeting } from "../hooks/useGreeting";
import { useShellShortcuts } from "../hooks/useShellShortcuts";

import ShellOverlays from "./overlays/ShellOverlays";
import ShellPanels from "./overlays/ShellPanels";
import { useProactiveEvents } from "../hooks/useProactiveEvents";
import { useDialogFlow } from "../hooks/useDialogFlow";
import { useHACameraRefresh } from "../hooks/useHACameraRefresh";

// déclaration du composant JarvisShell
export interface JarvisShellProps {
  shouldGreet?: boolean;
}

export default function JarvisShell({ shouldGreet }: JarvisShellProps) {
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

  // Bootstraps isolés
  useGeminiBootstrap();
  const { isBackendOnline } = useBackendBootstrap({ addLog });

  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [statusOverlay, setStatusOverlay] = useState<StatusOverlayData | null>(
    null,
  );

  const systemStats = useSystemStats();

  useEffect(() => {
    if (statusOverlay) {
      console.log(
        "🟢 APP: HolographicStatusOverlay update requested for:",
        statusOverlay.title,
      );
    } else {
      console.log("🟢 APP: Overlay closed, resetting Sphere to IDLE");
      // 🟣 SPHERE: IDLE when overlay closes — attendre que le backend soit prêt
      if (!isBackendOnline) return;
      fetch("http://localhost:3001/api/sphere/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "IDLE" }),
      }).catch(() => {});

      fetch("http://localhost:3001/api/sphere/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "IDLE" }),
      }).catch(() => {});
    }
  }, [statusOverlay, isBackendOnline]);

  useEffect(() => {
    console.log("🚀 JARVIS FRONTEND v1.1.0 - NAVIGATION FIX LOADED");
    console.log("🔌 Connecting to Backend at http://localhost:3001");
  }, []);

  // useBackendBootstrap maintenant appelé plus haut (retourne isBackendOnline)

  const brainRef = useRef<{
    processCommand: (cmd: string) => Promise<void>;
  } | null>(null);

  // Ref partagée : true quand un dialog flow est actif (ex: composition WhatsApp)
  // Passée à useJarvisInteraction pour réduire le délai anti-écho à 800ms
  const isDialogActiveRef = useRef(false);

  const interaction = useJarvisInteraction({
    status,
    setStatus,
    addLog,
    onCommandReceived: (text) => {
      brainRef.current?.processCommand(text);
    },
    isDialogActiveRef,
  });

  // ============================================================
  // DIALOG FLOW — Après useJarvisInteraction (besoin de speak)
  // Les refs stables sont passées à useJarvisBrain via props
  // ============================================================
  const dialogFlow = useDialogFlow({
    speak: (text, queue) => interaction.speak(text, queue),
    addLog,
    setStatusOverlay: (data) =>
      setStatusOverlay(data as StatusOverlayData | null),
    onSendWhatsApp: async (to, message) => {
      const response = await fetch("http://localhost:3001/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, message }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur envoi WhatsApp");
      }
    },
    onSphereMode: (mode) => {
      fetch("http://localhost:3001/api/sphere/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      }).catch(() => {});
    },
  });

  // Synchroniser la ref partagée avec l'état réel du dialog flow
  // Permet à useJarvisInteraction de réduire le délai anti-écho à 800ms
  useEffect(() => {
    isDialogActiveRef.current = dialogFlow.isDialogActive;
  }, [dialogFlow.isDialogActive]);

  const brain = useJarvisBrain({
    appMemory,
    updateMemory,
    findApp,
    addLog,
    setStatus,
    speak: interaction.speak,
    setActiveOverlay,
    setVisualMode,
    addConversationMessage,
    getConversationContext,
    stopConversation: interaction.stopFullConversation,
    interceptCommandRef: dialogFlow.interceptCommandRef,
    startWhatsAppFlowRef: dialogFlow.startWhatsAppFlowRef,
    setStatusOverlay: (data) => {
      console.log("🔮 SHELL: setStatusOverlay called with:", data?.title);
      if (statusOverlay && data && statusOverlay.id !== data.id) {
        setStatusOverlay(null);
        setTimeout(() => setStatusOverlay(data), 100);
      } else {
        setStatusOverlay(data);
      }
    },
  });

  useEffect(() => {
    brainRef.current = brain;
  }, [brain]);

  useAutonomy({
    enabled: status === SystemStatus.IDLE,
    onAction: (msg) => addLog(msg, "OMNI", "info"),
  });

  useGreeting({
    enabled: !!shouldGreet,
    systemStats,
    interaction,
  });

  useProactiveEvents({
    speak: interaction.speak,
    addLog,
    setStatusOverlay,
    onProactiveEvent: brain.onProactiveEvent,
  });

  useShellShortcuts({
    enabled: true,
    status,
    interaction,
  });

  // Rafraîchissement automatique des données HA (caméras + températures imprimantes)
  // Actif uniquement quand un overlay de type "printer" ou "fleet" est affiché
  // Intervalle : 10s — arrêt automatique quand l'overlay est fermé
  useHACameraRefresh({
    currentOverlay: statusOverlay,
    setStatusOverlay,
    enabled: true,
  });

  const premiumStatus =
    status === SystemStatus.IDLE
      ? "idle"
      : status === SystemStatus.LISTENING
        ? "listening"
        : status === SystemStatus.PROCESSING
          ? "processing"
          : "speaking";

  return (
    <>
      <PremiumLayout
        status={premiumStatus}
        successTrigger={brain.successTrigger}
        onCommand={brain.processCommand}
        tokenUsage={brain.lastTokenUsage}
        isListening={interaction.isListening}
        onMicrophoneClick={interaction.handleMicrophoneClick}
        cpuUsage={systemStats.cpuUsage}
        memoryUsage={`${systemStats.memoryUsage} GB`}
        processes={systemStats.processes}
        logs={logs.map((log) => ({
          source: log.source,
          message: log.message,
          type: log.type,
        }))}
        isProcessing={status === SystemStatus.PROCESSING}
        processingMessage={activeOverlay || "🤖 JARVIS analyse..."}
        onToggleLogs={() =>
          setActiveOverlay(activeOverlay === "LOGS" ? null : "LOGS")
        }
      />

      <ShellOverlays
        visualMode={visualMode}
        setVisualMode={setVisualMode}
        statusOverlay={statusOverlay}
        setStatusOverlay={setStatusOverlay}
        hudNotifications={brain.hudNotifications}
      />

      <ShellPanels
        activeOverlay={activeOverlay}
        setActiveOverlay={setActiveOverlay}
        onToggleGemini={() => interaction.handleMicrophoneClick()}
      />
    </>
  );
}
