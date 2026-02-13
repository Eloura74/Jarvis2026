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
import { LogEntry, SystemStatus, AppMemory } from "../types";
import { AppPath } from "./useAppPaths";

interface UseJarvisBrainProps {
  appMemory: AppMemory[];
  updateMemory: (appName: string, path: string) => void;
  findApp: (query: string) => AppPath | null;
  addLog: (
    message: string,
    source?: LogEntry["source"],
    type?: LogEntry["type"],
  ) => void;
  setStatus: (status: SystemStatus) => void;
  speak: (text: string) => void;
  setActiveOverlay: (overlay: string | null) => void;
  // NOUVEAU : Props pour la mémoire conversationnelle
  addConversationMessage?: (role: "user" | "model", text: string) => void;
  getConversationContext?: () => string;
  // NOUVEAU : Mode Visuel
  setVisualMode?: (query: string | null, isVisible: boolean) => void;
}

export function useJarvisBrain({
  appMemory,
  updateMemory,
  findApp,
  addLog,
  setStatus,
  speak,
  setActiveOverlay,
  addConversationMessage,
  getConversationContext,
  setVisualMode,
}: UseJarvisBrainProps) {
  const [commandHistory, setCommandHistory] = useState<CommandInfo[]>([]);
  const [successTrigger, setSuccessTrigger] = useState(0);

  // ========================================
  // EXÉCUTION DES OUTILS
  // ========================================
  const executeTool = async (toolName: string, toolArgs: any) => {
    // Contexte commun
    const ctx: HandlerContext = { addLog, setStatus, setVisualMode };

    // Dépendances additionnelles
    // NOTE: on passe findApp tel quel, les handlers devront gérer AppPath | null
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
        case "show_images": // NOUVEAU
          return await handlers.handleShowImages(toolArgs, ctx);

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

      // 1. Sauvegarder message utilisateur
      if (addConversationMessage) {
        addConversationMessage("user", text);
      }

      const newCommand: CommandInfo = {
        text,
        timestamp: Date.now(),
        status: "pending",
      };

      setCommandHistory((prev) => [newCommand, ...prev]);
      setStatus(SystemStatus.PROCESSING);
      addLog(`Analyzing: "${text}"`, "USER", "info");

      try {
        // 2. Récupérer contexte
        const conversationContext = getConversationContext
          ? getConversationContext()
          : "";

        // 3. Envoyer à Gemini
        const result = await parseCommand(text, appMemory, conversationContext);

        // CAS 1 : APPEL D'OUTIL (Outil seul)
        if (
          result.type === "TOOL_CALL" &&
          result.toolCalls &&
          result.toolCalls.length > 0
        ) {
          const toolCall = result.toolCalls[0];
          addLog(`Intent: Tool ${toolCall.name}`, "OMNI", "info");
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
          const successMsg = "Commande exécutée avec succès.";
          speak(successMsg);
          if (addConversationMessage)
            addConversationMessage("model", successMsg);
        }
        // CAS 2 : RÉPONSE MIXTE (Texte + Outils) - NOUVEAU
        else if (
          result.type === "MIXED_RESPONSE" &&
          result.text &&
          result.toolCalls
        ) {
          addLog(`Intent: Mixed (Talk + Action)`, "OMNI", "info");

          // 1. Parler
          speak(result.text);
          if (addConversationMessage)
            addConversationMessage("model", result.text);

          // 2. Exécuter les outils (ex: show_images)
          for (const toolCall of result.toolCalls) {
            addLog(`Exec: ${toolCall.name}`, "KERNEL", "warning");
            await executeTool(toolCall.name, toolCall.args);
          }

          setCommandHistory((prev) =>
            prev.map((c) =>
              c.timestamp === newCommand.timestamp
                ? { ...c, status: "success", result: result.text }
                : c,
            ),
          );
          setStatus(SystemStatus.IDLE);
        }
        // CAS 3 : CONVERSATION (Texte seul)
        else if (result.type === "TEXT_RESPONSE" && result.text) {
          addLog(`Intent: Conversation`, "OMNI", "info");
          speak(result.text);
          addLog(result.text, "OMNI", "success");

          if (addConversationMessage)
            addConversationMessage("model", result.text);

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
          const errorMsg = "Je n'ai pas compris.";
          speak(errorMsg);
          if (addConversationMessage) addConversationMessage("model", errorMsg);
        }
      } catch (error) {
        console.error("Command Error:", error);
        setStatus(SystemStatus.ERROR);
        addLog("Erreur traitement commande", "SYSTEM", "error");

        const errorMsg = "Désolé, une erreur est survenue.";
        speak(errorMsg);
        if (addConversationMessage) addConversationMessage("model", errorMsg);

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
      addConversationMessage,
      getConversationContext,
    ],
  );

  return {
    commandHistory,
    successTrigger,
    processCommand,
  };
}
