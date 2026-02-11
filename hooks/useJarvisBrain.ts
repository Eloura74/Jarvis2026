/**
 * useJarvisBrain - Le Cerveau de J.A.R.V.I.S.
 *
 * Encapsule la logique de :
 * 1. Analyse des commandes (Gemini)
 * 2. Exécution des outils (Routing)
 * 3. Gestion de l'historique des commandes
 */

import { useState, useCallback } from "react";
import { parseCommand } from "../services/geminiService";
import { trackCommand } from "../services/predictionEngine";
import * as handlers from "../handlers";
import { CommandInfo, HandlerContext } from "../types/app.types";
import { LogEntry, SystemStatus } from "../types";

interface UseJarvisBrainProps {
  appMemory: any;
  updateMemory: (key: string, value: any) => void;
  findApp: (query: string) => any;
  addLog: (
    message: string,
    source?: LogEntry["source"],
    type?: LogEntry["type"],
  ) => void;
  setStatus: (status: SystemStatus) => void;
  speak: (text: string) => void;
  setActiveOverlay: (overlay: string | null) => void;
}

export function useJarvisBrain({
  appMemory,
  updateMemory,
  findApp,
  addLog,
  setStatus,
  speak,
  setActiveOverlay,
}: UseJarvisBrainProps) {
  const [commandHistory, setCommandHistory] = useState<CommandInfo[]>([]);
  const [successTrigger, setSuccessTrigger] = useState(0);

  // ========================================
  // EXÉCUTION DES OUTILS
  // ========================================
  const executeTool = async (toolName: string, toolArgs: any) => {
    // Contexte commun
    const ctx: HandlerContext = { addLog, setStatus };

    // Dépendances additionnelles
    const additionalDeps = {
      setActiveOverlay,
      appMemory,
      updateMemory,
      findAppPath: (query: string) => findApp(query),
    };

    try {
      switch (toolName) {
        // === SYSTEM ===
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

        // === SESSION ===
        case "lock_session":
          return await handlers.handleLockSession({}, ctx);
        case "shutdown_system":
          return await handlers.handleShutdownSystem({}, ctx);
        case "restart_system":
          return await handlers.handleRestartSystem({}, ctx);
        case "sleep_system":
          return await handlers.handleSleepSystem({}, ctx);

        // === OPTIMIZATION ===
        case "system_optimization":
          addLog("Optimisation système simulée...", "SYSTEM", "success");
          return { status: "success", message: "Optimisation terminée" };

        // === MEDIA ===
        case "adjust_volume":
          return await handlers.handleAdjustVolume(toolArgs, ctx);
        case "control_media":
          return await handlers.handleControlMedia(toolArgs, ctx);
        case "take_screenshot":
          return await handlers.handleTakeScreenshot({}, ctx);

        // === FILES ===
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

        // === WEB ===
        case "search_web":
          return await handlers.handleSearchWeb(toolArgs, ctx);
        case "open_url":
          return await handlers.handleOpenUrl(toolArgs, ctx);
        case "manage_bookmarks":
          return await handlers.handleManageBookmarks(toolArgs, ctx);

        // === PRODUCTIVITY ===
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
          return null;
      }
    } catch (error) {
      addLog(
        `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
        "SYSTEM",
        "error",
      );
      setStatus(SystemStatus.ERROR);
      setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
      throw error;
    }
  };

  // ========================================
  // TRAITEMENT INTELLIGENT (GEMINI)
  // ========================================
  const processCommand = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const newCommand: CommandInfo = {
        text,
        timestamp: Date.now(),
        status: "pending",
      };

      setCommandHistory((prev) => [newCommand, ...prev]);
      setStatus(SystemStatus.PROCESSING);
      addLog(`Analyzing: "${text}"`, "USER", "info");

      try {
        const result = await parseCommand(text, appMemory);

        if (
          result.type === "TOOL_CALL" &&
          result.toolCalls &&
          result.toolCalls.length > 0
        ) {
          const toolCall = result.toolCalls[0];
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
          setStatus(SystemStatus.IDLE);
        } else {
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
    [
      addLog,
      appMemory,
      setStatus,
      speak,
      updateMemory,
      findApp,
      setActiveOverlay,
    ],
  );

  return {
    commandHistory,
    successTrigger,
    processCommand,
  };
}
