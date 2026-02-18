import { useCallback } from "react";
import * as handlers from "../../handlers";
import { HandlerContext, StatusOverlayData } from "../../types/app.types";
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
  setStatusOverlay?: (data: StatusOverlayData | null) => void;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (toolName: string, toolArgs: any) => {
      // Contexte commun
      const ctx: HandlerContext & {
        speak?: (text: string) => void;
        setStatusOverlay?: (data: StatusOverlayData | null) => void;
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
          case "control_session": {
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
          }

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
          case "control_home_automation": {
            const { handleControlHomeAutomation } =
              await import("../../handlers/haHandlers");
            return await handleControlHomeAutomation(toolArgs, ctx);
          }

          case "show_status_overlay": {
            console.log("🛠️ EXECUTOR: show_status_overlay started...");
            const { handleShowStatusOverlay } =
              await import("../../handlers/haHandlers");
            const result = await handleShowStatusOverlay(toolArgs, ctx);
            console.log(
              "🛠️ EXECUTOR: handleShowStatusOverlay result:",
              result.status,
            );

            if (
              result.status === "success" &&
              ctx.setStatusOverlay &&
              result.data
            ) {
              console.log(
                "🛠️ EXECUTOR: Calling actual setStatusOverlay with data...",
              );
              ctx.setStatusOverlay(result.data as StatusOverlayData);
            } else {
              console.error(
                "🛠️ EXECUTOR: FAILED to call setStatusOverlay. Status:",
                result.status,
                "Setter exists:",
                !!ctx.setStatusOverlay,
              );
            }
            return result;
          }

          // === WEATHER ===
          case "get_weather":
            return await handlers.handleGetWeather(toolArgs, ctx);

          // === NAVIGATION ===
          case "get_travel_time": {
            console.log(
              "📍 ToolExecutor: get_travel_time called with",
              toolArgs,
            );
            const { getTravelTime } =
              await import("../../services/navigationService");

            try {
              const route = await getTravelTime(
                toolArgs.destination,
                toolArgs.departure_time,
                toolArgs.arrival_time, // Passage du nouveau paramètre
              );

              if (!route) {
                console.error("📍 ToolExecutor: No route returned");
                const errMessage =
                  "Désolé, je ne parviens pas à calculer le trajet pour le moment. Vérifiez la configuration.";
                speak(errMessage, true);
                return { status: "error", message: errMessage };
              }

              console.log("📍 ToolExecutor: Route received", route);

              // Message différent si recommandation de départ
              let message = "";
              let trafficStatus = "";
              if ((route as { diffToLeave?: string }).diffToLeave) {
                message = `${(route as { diffToLeave?: string; duration?: string }).diffToLeave} pour arriver à l'heure. Le trajet est estimé à ${route.duration}.`;
              } else {
                if (route.durationInTraffic) {
                  trafficStatus =
                    route.durationInTraffic !== route.duration
                      ? `, comptez ${route.durationInTraffic} avec le trafic`
                      : ". Le trafic est fluide";
                }
                message = `Le trajet vers ${route.endAddress.split(",")[0]} est de ${route.duration}${trafficStatus}.`;
              }

              // Formatage pour l'overlay
              const overlayData: StatusOverlayData = {
                id: `traffic-${Date.now()}`,
                title: "TRAFIC TEMPS RÉEL",
                type: "traffic",
                lastUpdate: new Date().toLocaleTimeString(),
                stats: [
                  {
                    label: "DISTANCE",
                    value: route.distance,
                    status: "normal",
                  },
                  {
                    label: "DURÉE",
                    value: route.duration,
                    status:
                      route.durationInTraffic &&
                      parseInt(route.durationInTraffic) >
                        parseInt(route.duration)
                        ? "warning"
                        : "normal",
                  },
                ],
                origin: route.startAddress,
                destination: route.endAddress,
                distance: route.distance,
                duration: route.duration,
                durationInTraffic: route.durationInTraffic,
              };

              // Déclencher l'affichage visuel
              if (additionalDeps.setActiveOverlay && ctx.setStatusOverlay) {
                console.log("📍 ToolExecutor: Setting visual overlay");
                ctx.setStatusOverlay(overlayData);
                additionalDeps.setActiveOverlay("traffic");
              } else {
                console.error(
                  "📍 ToolExecutor: dependencies missing for overlay",
                );
              }

              // Délai de sécurité pour laisser le temps à l'UI de se mettre à jour
              // sans interrompre le thread vocal immédiatement
              setTimeout(() => {
                console.log(
                  "📍 ToolExecutor: Speaking message (delayed):",
                  message,
                );
                speak(message, true); // Force queue
              }, 500);

              return {
                status: "success",
                message: message,
                visualData: overlayData,
              };
            } catch (err) {
              console.error(
                "📍 ToolExecutor: Error in get_travel_time execution",
                err,
              );
              speak(
                "Une erreur critique est survenue lors du calcul de l'itinéraire.",
                true,
              );
              return { status: "error", message: String(err) };
            }
          }

          // === INNOVATION ===
          case "get_neural_briefing": {
            const { getNeuralBriefing } =
              await import("../../services/geminiService");
            const briefing = await getNeuralBriefing({
              task: toolArgs.task || "Monsieur travaille",
              logs: toolArgs.logs || [],
            });
            speak(briefing);
            return { status: "success", briefing };
          }

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
