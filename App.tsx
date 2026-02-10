/**
 * Composant Principal OMNI / J.A.R.V.I.S.
 *
 * Interface web immersive simulant un système d'exploitation intelligent.
 * Orchestre tous les composants et hooks pour créer l'expérience J.A.R.V.I.S.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
// Composants Premium UI
import { PremiumLayout } from "./components/PremiumLayout";

import { parseCommand } from "./services/geminiService";
import { trackCommand } from "./services/predictionEngine";
import { LogEntry, SystemStatus } from "./types";
import { CommandInfo } from "./types/app.types";
import { INITIAL_LOGS } from "./constants";
import * as handlers from "./handlers";
import { HandlerContext } from "./types/app.types";
import { Toaster } from "react-hot-toast";
import { toasterConfig } from "./utils/toasterConfig";

// Hooks
import { useVoiceRecognition } from "./hooks/useVoiceRecognition";
import { useVoiceSynthesis } from "./hooks/useVoiceSynthesis";
import { useSystemStatus } from "./hooks/useSystemStatus";
import { useAppMemory } from "./hooks/useAppMemory";
import { useAutonomy } from "./hooks/useAutonomy";
import { useWakeWord } from "./hooks/useWakeWord";

export interface JarvisSettings {
  wakeWordEnabled: boolean;
  voiceLanguage: "fr-FR" | "en-US" | "en-GB";
  wakeWordThreshold: number;
  voiceVolume: number;
  theme: "classic" | "ironman" | "matrix";
}

const App: React.FC = () => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [commandHistory, setCommandHistory] = useState<CommandInfo[]>([]);
  const [successTrigger, setSuccessTrigger] = useState(0); // Trigger pour animation succès
  const [conversationMode, setConversationMode] = useState(false); // 🆕 Mode conversation continue

  // Settings utilisateur (État gardé pour future implémentation configuration)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [settings] = useState<JarvisSettings>({
    wakeWordEnabled: false,
    voiceLanguage: "fr-FR",
    wakeWordThreshold: 0.8,
    voiceVolume: 0.8,
    theme: "classic",
  });

  // ========================================
  // GESTION DES LOGS (Déclaré en premier pour être utilisé par les hooks)
  // ========================================

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
  // HOOKS PERSONNALISÉS
  // ========================================

  // create a sound player function locally if needed or mock it
  const playSound = useCallback((type: "activation" | "success" | "error") => {
    // Placeholder for sound playing capability
    // Could use Audio API here
    console.log(`Playing sound: ${type}`);
  }, []);

  // ========================================
  // SYNTHÈSE VOCALE avec callback onEnd
  // ========================================
  const { speak } = useVoiceSynthesis({
    enabled: true,
    onEnd: () => {
      // 🎤 MODE CONVERSATION CONTINUE
      // Avec recognition.continuous = true, le micro reste actif automatiquement
      // Plus besoin de redémarrer manuellement !
      console.log(
        `🔍 onEnd déclenché - conversationMode: ${conversationModeRef.current}, status: ${statusRef.current}`,
      );
    },
  });

  const { status, setStatus } = useSystemStatus();
  const { memory: appMemory, updateMemory } = useAppMemory();

  // useAutonomy
  useAutonomy({
    enabled: status === SystemStatus.IDLE,
    onAction: (msg) => addLog(msg, "OMNI", "info"),
  });

  // ========================================
  // RECONNAISSANCE VOCALE (déclaré en premier pour callback useVoiceSynthesis)
  // ========================================
  // Ref pour handleCommand (déclaré plus tard) - résout dépendance circulaire
  const handleCommandRef = useRef<((text: string) => Promise<void>) | null>(
    null,
  );

  // 🔧 Refs pour le mode conversation (résout problème closure dans onEnd)
  const conversationModeRef = useRef(conversationMode);
  const statusRef = useRef(status);

  // Sync refs avec state
  useEffect(() => {
    conversationModeRef.current = conversationMode;
  }, [conversationMode]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const { isListening, toggleListening } = useVoiceRecognition(
    (text) => {
      // Appeler handleCommand via ref (défini plus tard)
      if (text && handleCommandRef.current) {
        handleCommandRef.current(text);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    () => {
      // onStatusChange - Optional sync
    },
  );

  // ========================================
  // WAKE WORD
  // ========================================
  const handleWakeWordDetected = useCallback(() => {
    if (status === SystemStatus.IDLE) {
      playSound("activation");
      setStatus(SystemStatus.LISTENING);
      addLog("Wake word detected", "VOICE", "info");
    }
  }, [status, setStatus, playSound, addLog]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useWakeWord(handleWakeWordDetected);

  // ========================================
  // EXÉCUTION DES OUTILS (ROUTER)
  // ========================================

  const executeTool = async (toolName: string, toolArgs: any) => {
    // Contexte commun passé à tous les handlers
    const ctx: HandlerContext = { addLog, setStatus };

    // Dépendances additionnelles pour certains handlers
    const additionalDeps = {
      setActiveOverlay,
      appMemory,
      updateMemory,
    };

    // Router modulaire - Délégation vers handlers spécialisés
    try {
      switch (toolName) {
        // === SYSTEM HANDLERS ===
        case "search_and_launch_app":
          return await handlers.handleSearchAndLaunchApp(
            toolArgs,
            ctx,
            additionalDeps,
          );

        case "manage_window":
          return await handlers.handleManageWindow(toolArgs, ctx);

        case "keyboard_automation":
          return await handlers.handleKeyboardAutomation(toolArgs, ctx);

        // === SESSION HANDLERS ===
        case "lock_session":
          return await handlers.handleLockSession({}, ctx);

        case "shutdown_system":
          return await handlers.handleShutdownSystem({}, ctx);

        case "restart_system":
          return await handlers.handleRestartSystem({}, ctx);

        case "sleep_system":
          return await handlers.handleSleepSystem({}, ctx);

        // === SYSTEM OPTIMIZATION HANDLERS ===
        case "system_optimization":
          addLog("Optimisation système simulée...", "SYSTEM", "success");
          return { status: "success", message: "Optimisation terminée" };

        // === MEDIA HANDLERS ===
        case "adjust_volume":
          return await handlers.handleAdjustVolume(toolArgs, ctx);

        case "control_media":
          return await handlers.handleControlMedia(toolArgs, ctx);

        case "take_screenshot":
          return await handlers.handleTakeScreenshot({}, ctx);

        // === FILE HANDLERS ===
        case "create_file":
          return await handlers.handleCreateFile(toolArgs, ctx);

        case "delete_file":
          return await handlers.handleDeleteFile(toolArgs, ctx);

        case "move_file":
          return await handlers.handleMoveFile(toolArgs, ctx);

        case "copy_file":
          return await handlers.handleCopyFile(toolArgs, ctx);

        case "search_files":
          return await handlers.handleSearchFiles(toolArgs, ctx);

        case "organize_files":
          return await handlers.handleOrganizeFiles(toolArgs, ctx);

        // === WEB HANDLERS ===
        case "search_web":
          return await handlers.handleSearchWeb(toolArgs, ctx);

        case "open_url":
          return await handlers.handleOpenUrl(toolArgs, ctx);

        case "manage_bookmarks":
          return await handlers.handleManageBookmarks(toolArgs, ctx);

        // === PRODUCTIVITY HANDLERS ===
        case "set_timer":
          return await handlers.handleSetTimer(toolArgs, ctx);

        case "manage_notes":
          return await handlers.handleManageNotes(toolArgs, ctx);

        case "manage_todos":
          return await handlers.handleManageTodos(toolArgs, ctx);

        case "set_reminder":
          return await handlers.handleSetReminder(toolArgs, ctx);

        default:
          addLog(`⚠ Unknown tool: "${toolName}"`, "SYSTEM", "error");
          setStatus(SystemStatus.ERROR);
          setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
      }
    } catch (error) {
      addLog(
        `Tool execution failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "SYSTEM",
        "error",
      );
      setStatus(SystemStatus.ERROR);
      setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
    }
  };

  // ========================================
  // TRAITEMENT DES COMMANDES (GEMINI)
  // ========================================

  const handleCommand = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // ========================================
      // 🎤 MODE CONVERSATION : Détection mots de fin
      // ========================================
      const CONVERSATION_END_KEYWORDS = [
        "au revoir",
        "à bientôt",
        "stop",
        "merci c'est tout",
        "ça suffit",
        "arrête",
        "termine",
        "fini",
      ];

      const normalizedText = text.toLowerCase();
      if (CONVERSATION_END_KEYWORDS.some((kw) => normalizedText.includes(kw))) {
        setConversationMode(false);
        speak("À bientôt !");
        addLog("👋 Mode conversation désactivé", "SYSTEM", "info");
        return;
      }

      // 🚀 ACTIVATION AUTO : Au premier message, activer le mode conversation
      if (!conversationMode) {
        setConversationMode(true);
        addLog("🎤 Mode conversation activé", "SYSTEM", "info");
      }

      const newCommand: CommandInfo = {
        text,
        timestamp: Date.now(),
        status: "pending",
      };

      setCommandHistory((prev) => [newCommand, ...prev]);
      // setCurrentCommand(newCommand); // State removed as unused
      setStatus(SystemStatus.PROCESSING);
      addLog(`Analyzing: "${text}"`, "USER", "info");

      try {
        // 1. Analyse Gemini
        // Correction ici: passer appMemory au lieu de l'historique
        const result = await parseCommand(text, appMemory);

        if (
          result.type === "TOOL_CALL" &&
          result.toolCalls &&
          result.toolCalls.length > 0
        ) {
          const toolCall = result.toolCalls[0]; // On gère le premier pour l'instant
          addLog(`Intent detected: Run Tool ${toolCall.name}`, "OMNI", "info");

          trackCommand(text);

          addLog(
            `Executing: ${toolCall.name} (${JSON.stringify(toolCall.args)})`,
            "KERNEL",
            "warning",
          );

          await executeTool(toolCall.name, toolCall.args);

          setSuccessTrigger(Date.now());
          setCommandHistory((prev) =>
            prev.map((c) =>
              c.timestamp === newCommand.timestamp
                ? { ...c, status: "success", result: "Executed" }
                : c,
            ),
          );
          // playSound("success");
          speak("Commande exécutée avec succès.");
        } else if (result.type === "TEXT_RESPONSE" && result.text) {
          addLog(`Intent: Conversation`, "OMNI", "info");
          speak(result.text);
          addLog(result.text, "OMNI", "success");

          setCommandHistory((prev) =>
            prev.map((c) =>
              c.timestamp === newCommand.timestamp
                ? { ...c, status: "success", result: result.text }
                : c,
            ),
          );

          // ✅ FIX: Réinitialiser status pour débloquer l'interface
          setStatus(SystemStatus.IDLE);
        } else {
          // Cas erreur ou indéterminé
          setStatus(SystemStatus.IDLE);
          speak("Je n'ai pas compris.");
        }
      } catch (error) {
        console.error("Command Error:", error);
        setStatus(SystemStatus.ERROR);
        addLog("Erreur traitement commande", "SYSTEM", "error");
        speak("Désolé, une erreur est survenue.");

        setCommandHistory((prev) =>
          prev.map((c) =>
            c.timestamp === newCommand.timestamp
              ? { ...c, status: "error" }
              : c,
          ),
        );

        setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      status,
      addLog,
      speak,
      playSound,
      appMemory,
      conversationMode,
      setConversationMode,
    ],
  );

  // ✅ Assigner handleCommand à la ref pour useVoiceRecognition
  handleCommandRef.current = handleCommand;

  // Mode écoute continue si demandé par status
  useEffect(() => {
    if (status === SystemStatus.LISTENING && !isListening) {
      toggleListening();
    } else if (status !== SystemStatus.LISTENING && isListening) {
      // toggleListening(); // Let it stop naturally or force stop
    }
  }, [status, isListening, toggleListening]);

  // ========================================
  // RENDER (PREMIUM LAYOUT)
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
        commandCount={commandHistory.length}
        cpuUsage={Math.floor(20 + Math.random() * 15)} // Simulation
        memoryUsage="4.2 GB"
        onCommand={handleCommand}
        onMicrophoneClick={toggleListening}
        isListening={isListening}
        logs={logs.map((log) => ({
          source: log.source,
          message: log.message,
          type: log.type as "info" | "success" | "error" | "warning",
        }))}
        isProcessing={status === SystemStatus.PROCESSING}
        processingMessage={activeOverlay || "🤖 JARVIS analyse..."}
        successTrigger={successTrigger}
        suggestions={[
          { label: "Ouvrir Chrome", command: "ouvre chrome", icon: "🌐" },
          { label: "Rechercher React", command: "recherche react", icon: "🔍" },
          { label: "Créer note", command: "crée une note", icon: "📝" },
        ]}
      />

      <Toaster {...toasterConfig} />
    </>
  );
};

export default App;
