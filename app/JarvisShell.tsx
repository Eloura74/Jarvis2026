import { useEffect, useRef, useState } from "react";
import { useKernel } from "../contexts/KernelContext";

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

import ShellOverlays from "./overlays/ShellOverlays.tsx";
import ShellPanels from "./overlays/ShellPanels.tsx";

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
    }
  }, [statusOverlay]);

  useEffect(() => {
    console.log("🚀 JARVIS FRONTEND v1.1.0 - NAVIGATION FIX LOADED");
    console.log("🔌 Connecting to Backend at http://localhost:3001");
  }, []);

  // Vérif backend isolée (log + console)
  useBackendBootstrap({ addLog });

  const brainRef = useRef<any>(null);

  const interaction = useJarvisInteraction({
    status,
    setStatus,
    addLog,
    onCommandReceived: (text) => {
      brainRef.current?.processCommand(text);
    },
  });

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

  brainRef.current = brain;

  useAutonomy({
    enabled: status === SystemStatus.IDLE,
    onAction: (msg) => addLog(msg, "OMNI", "info"),
  });

  useGreeting({
    enabled: !!shouldGreet,
    systemStats,
    interaction,
  });

  useShellShortcuts({
    enabled: true,
    status,
    interaction,
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
          type: log.type as any,
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
