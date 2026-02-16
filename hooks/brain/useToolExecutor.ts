import { useCallback } from "react";
import * as handlers from "../../handlers";
import { HandlerContext } from "../../types/app.types";
import { SystemStatus, AppMemory, LogEntry } from "../../types";
import { AppPath } from "../useAppPaths";

interface ToolExecutorProps {
  appMemory: AppMemory[];
  updateMemory: (appName: string, path: string) => void;
  findApp: (query: string) => AppPath | null;
  addLog: (
    message: string,
    source?: LogEntry["source"],
    type?: LogEntry["type"],
  ) => void;
  setStatus: (status: SystemStatus) => void;
  speak: (text: string, queue?: boolean) => void;
  setActiveOverlay: (overlay: string | null) => void;
  setVisualMode?: (query: string | null, isVisible: boolean) => void;
  stopConversation?: () => void;
  setStatusOverlay?: (data: any) => void;
}

/**
 * Hook spécialisé dans le routage et l'exécution des outils de J.A.R.V.I.S.
 * Extrait du useJarvisBrain original pour réduire le couplage.
 */
export function useToolExecutor({
  appMemory,
  updateMemory,
  findApp,
  addLog,
  setStatus,
  speak,
  setActiveOverlay,
  setVisualMode,
  stopConversation,
  setStatusOverlay,
}: ToolExecutorProps) {
  const executeTool = useCallback(
    async (toolName: string, toolArgs: any) => {
      // Contexte commun
      const ctx: HandlerContext & {
        speak?: (text: string) => void;
        setStatusOverlay?: (data: any) => void;
      } = {
        addLog,
        setStatus,
        setVisualMode,
        speak,
        stopConversation,
        setStatusOverlay,
      };

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

          // === MEDIA & VOLUME ===
          case "adjust_volume":
            return await handlers.handleAdjustVolume(toolArgs, ctx);
          case "take_screenshot":
            return await handlers.handleTakeScreenshot({}, ctx);

          // === SESSION ===
          case "control_session":
            const { action: sessionAction } = toolArgs;
            if (sessionAction === "lock")
              return await handlers.handleLockSession({}, ctx);
            if (sessionAction === "shutdown")
              return await handlers.handleShutdownSystem(toolArgs, ctx);
            if (sessionAction === "restart")
              return await handlers.handleRestartSystem(toolArgs, ctx);
            if (sessionAction === "sleep")
              return await handlers.handleSleepSystem({}, ctx);
            return null;

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
          case "read_file_content":
            return await handlers.handleReadFile(toolArgs, ctx);
          case "write_file_content":
            return await handlers.handleWriteFile(toolArgs, ctx);

          // === WEB ===
          case "search_web":
            return await handlers.handleSearchWeb(toolArgs, ctx);
          case "open_url":
            return await handlers.handleOpenUrl(toolArgs, ctx);
          case "read_web_page":
            return await handlers.handleReadWebPage(toolArgs, ctx);
          case "manage_bookmarks":
            return await handlers.handleManageBookmarks(toolArgs, ctx);
          case "show_images":
            return await handlers.handleShowImages(toolArgs, ctx);
          case "generate_image":
            return await handlers.handleGenerateImage(toolArgs, ctx);

          // === PRODUCTIVITY ===
          case "set_timer":
            return await handlers.handleSetTimer(toolArgs, ctx);
          case "manage_notes":
            return await handlers.handleManageNotes(toolArgs, ctx);
          case "manage_todos":
            return await handlers.handleManageTodos(toolArgs, ctx);
          case "set_reminder":
            return await handlers.handleSetReminder(toolArgs, ctx);

          // === VISION ===
          case "analyze_screen":
            return await handlers.handleAnalyzeScreen(toolArgs, ctx);

          // === GOOGLE SERVICES ===
          case "gmail_read":
            return await handlers.handleGmailRead(toolArgs, ctx);
          case "gmail_send":
            return await handlers.handleGmailSend(toolArgs, ctx);
          case "calendar_list":
            return await handlers.handleCalendarList(toolArgs, ctx);
          case "calendar_create":
            return await handlers.handleCalendarCreate(toolArgs, ctx);
          case "calendar_delete":
            return await handlers.handleCalendarDelete(toolArgs, ctx);

          // === HOME ASSISTANT ===
          case "control_home_automation":
            const { handleControlHomeAutomation } =
              await import("../../handlers/haHandlers");
            return await handleControlHomeAutomation(toolArgs, ctx);

          case "show_status_overlay":
            console.log("🛠️ EXECUTOR: show_status_overlay started...");
            const { handleShowStatusOverlay } =
              await import("../../handlers/haHandlers");
            const result = await handleShowStatusOverlay(toolArgs, ctx);
            console.log(
              "🛠️ EXECUTOR: handleShowStatusOverlay result:",
              result.status,
            );

            if (result.status === "success" && ctx.setStatusOverlay) {
              console.log(
                "🛠️ EXECUTOR: Calling actual setStatusOverlay with data...",
              );
              ctx.setStatusOverlay(result.data);
            } else {
              console.error(
                "🛠️ EXECUTOR: FAILED to call setStatusOverlay. Status:",
                result.status,
                "Setter exists:",
                !!ctx.setStatusOverlay,
              );
            }
            return result;

          // === WEATHER ===
          case "get_weather":
            return await handlers.handleGetWeather(toolArgs, ctx);

          // === INNOVATION ===
          case "get_neural_briefing":
            const { getNeuralBriefing } =
              await import("../../services/geminiService");
            const briefing = await getNeuralBriefing({
              task: toolArgs.task || "Monsieur travaille",
              logs: toolArgs.logs || [],
            });
            speak(briefing);
            return { status: "success", briefing };

          // === CONVERSATION CONTROL ===
          case "stop_listening":
            if (ctx.stopConversation) {
              ctx.stopConversation();
              addLog("Conversation terminée par l'IA", "SYSTEM", "info");
              return { status: "success", message: "Conversation stoppée." };
            }
            return { status: "warning", message: "Impossible d'arrêter." };

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
    },
    [
      addLog,
      setStatus,
      setVisualMode,
      speak,
      stopConversation,
      setActiveOverlay,
      appMemory,
      updateMemory,
      findApp,
      setStatusOverlay,
    ],
  );

  return { executeTool };
}
