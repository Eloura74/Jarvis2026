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
  /** Callback pour démarrer le flow WhatsApp 2 étapes */
  startWhatsAppFlow?: (recipient: string, recipientRaw: string) => void;
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
  startWhatsAppFlow,
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
          case "show_search_results":
            return await handlers.handleSearchResultsVisual(toolArgs, ctx);
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

          // === UI CONTROL ===
          case "close_current_overlay":
            if (ctx.setStatusOverlay) {
              ctx.setStatusOverlay(null);
              // Si c'est un panel overlay (GHOST, HOME, etc)
              if (additionalDeps.setActiveOverlay) {
                additionalDeps.setActiveOverlay(null);
              }
              speak("Affichage fermé.");
              return { status: "success", message: "Overlay closed" };
            }
            return { status: "error", message: "No overlay controller" };

          case "activate_ghost_mode":
            if (additionalDeps.setActiveOverlay) {
              additionalDeps.setActiveOverlay("GHOST");
              speak("Mode Ghost activé. Analyse visuelle prête.");
              return { status: "success", message: "Ghost Mode activated" };
            }
            return {
              status: "error",
              message:
                "Impossible d'activer le mode Ghost (dépendance manquante)",
            };

          // === WHATSAPP ===
          case "whatsapp_reply": {
            // Si Gemini a fourni un message, envoi direct (commande complète)
            // Si pas de message, démarrer le flow 2 étapes
            if (toolArgs.message && toolArgs.message.trim()) {
              const { handleWhatsAppReply } =
                await import("../../handlers/whatsappHandlers");
              const result = await handleWhatsAppReply(toolArgs, ctx);
              if (result.status === "success") {
                speak(`Message envoyé à ${toolArgs.to}, Monsieur.`);
              } else {
                speak(
                  `Désolé, je n'ai pas pu envoyer le message. ${result.message}`,
                );
              }
              return result;
            } else {
              // Pas de message : démarrer le flow 2 étapes
              if (startWhatsAppFlow) {
                startWhatsAppFlow(toolArgs.to, toolArgs.to);
              } else {
                speak(
                  `Quel message souhaitez-vous envoyer à ${toolArgs.to}, Monsieur ?`,
                );
              }
              return { status: "success", message: "Dialog flow démarré" };
            }
          }

          case "outdoor_temperature": {
            const { handleOutdoorTemperature } =
              await import("../../handlers/temperatureHandlers");
            return await handleOutdoorTemperature(toolArgs, ctx);
          }

          case "pool_temperature": {
            const { handlePoolTemperature } =
              await import("../../handlers/temperatureHandlers");
            return await handlePoolTemperature(toolArgs, ctx);
          }

          case "system_temperatures": {
            const { handleSystemTemperatures } =
              await import("../../handlers/temperatureHandlers");
            return await handleSystemTemperatures(toolArgs, ctx);
          }

          case "get_directions": {
            const { handleGetDirections } =
              await import("../../handlers/mapsHandlers");
            return await handleGetDirections(toolArgs, ctx);
          }

          case "printer_camera": {
            const { handlePrinterCamera } =
              await import("../../handlers/printingHandlers");
            return await handlePrinterCamera(toolArgs, ctx);
          }

          case "printer_status": {
            const { handlePrinterStatus } =
              await import("../../handlers/printingHandlers");
            return await handlePrinterStatus(toolArgs, ctx);
          }

          case "analyze_gcode": {
            const { handleAnalyzeGcode } =
              await import("../../handlers/printingHandlers");
            return await handleAnalyzeGcode(toolArgs, ctx);
          }

          case "send_phone_notification": {
            const { handleSendPhoneNotification } =
              await import("../../handlers/phoneHandlers");
            return await handleSendPhoneNotification(toolArgs, ctx);
          }

          case "make_phone_call": {
            const { handleMakePhoneCall } =
              await import("../../handlers/phoneHandlers");
            return await handleMakePhoneCall(toolArgs, ctx);
          }

          case "send_sms": {
            const { handleSendSMS } =
              await import("../../handlers/phoneHandlers");
            return await handleSendSMS(toolArgs, ctx);
          }

          case "phone_battery": {
            const { handlePhoneBattery } =
              await import("../../handlers/phoneHandlers");
            return await handlePhoneBattery(toolArgs, ctx);
          }

          case "storage_status": {
            const { handleStorageStatus } =
              await import("../../handlers/truenasHandlers");
            return await handleStorageStatus(toolArgs, ctx);
          }

          case "disk_health": {
            const { handleDiskHealth } =
              await import("../../handlers/truenasHandlers");
            return await handleDiskHealth(toolArgs, ctx);
          }

          case "truenas_services": {
            const { handleTrueNASServices } =
              await import("../../handlers/truenasHandlers");
            return await handleTrueNASServices(toolArgs, ctx);
          }

          case "move_window_to_screen": {
            const { handleMoveWindowToScreen } =
              await import("../../handlers/systemAdvancedHandlers");
            return await handleMoveWindowToScreen(toolArgs, ctx);
          }

          case "list_processes": {
            const { handleListProcesses } =
              await import("../../handlers/systemAdvancedHandlers");
            return await handleListProcesses(toolArgs, ctx);
          }

          case "kill_process": {
            const { handleKillProcess } =
              await import("../../handlers/systemAdvancedHandlers");
            return await handleKillProcess(toolArgs, ctx);
          }

          case "volume_control": {
            const { handleVolumeControl } =
              await import("../../handlers/systemAdvancedHandlers");
            return await handleVolumeControl(toolArgs, ctx);
          }

          case "get_volume": {
            const { handleGetVolume } =
              await import("../../handlers/systemAdvancedHandlers");
            return await handleGetVolume(toolArgs, ctx);
          }

          case "security_status": {
            const { handleSecurityStatus } =
              await import("../../handlers/securityHandlers");
            return await handleSecurityStatus(toolArgs, ctx);
          }

          case "alarm_control": {
            const { handleAlarmControl } =
              await import("../../handlers/securityHandlers");
            return await handleAlarmControl(toolArgs, ctx);
          }

          case "camera_snapshot": {
            const { handleCameraSnapshot } =
              await import("../../handlers/securityHandlers");
            return await handleCameraSnapshot(toolArgs, ctx);
          }

          case "list_cameras": {
            const { handleListCameras } =
              await import("../../handlers/securityHandlers");
            return await handleListCameras(toolArgs, ctx);
          }

          case "motion_history": {
            const { handleMotionHistory } =
              await import("../../handlers/securityHandlers");
            return await handleMotionHistory(toolArgs, ctx);
          }

          case "play_youtube": {
            const { handlePlayYouTube } =
              await import("../../handlers/mediaHandlers");
            return await handlePlayYouTube(toolArgs, ctx);
          }

          case "spotify_control": {
            const { handleSpotifyControl } =
              await import("../../handlers/mediaHandlers");
            return await handleSpotifyControl(toolArgs, ctx);
          }

          case "play_plex": {
            const { handlePlayPlex } =
              await import("../../handlers/mediaHandlers");
            return await handlePlayPlex(toolArgs, ctx);
          }

          case "webcam_vision": {
            const { handleWebcamVision } =
              await import("../../handlers/visionHandlers");
            return await handleWebcamVision(toolArgs, ctx);
          }

          case "detect_objects": {
            const { handleDetectObjects } =
              await import("../../handlers/visionHandlers");
            return await handleDetectObjects(toolArgs, ctx);
          }

          // === GOOGLE SERVICES ===
          case "gmail_read":
            return await handlers.handleGmailRead(toolArgs, ctx);
          case "gmail_send":
            return await handlers.handleGmailSend(toolArgs, ctx);
          // ... (rest of the code remains the same)
          case "calendar_next":
            return await handlers.handleCalendarNext(toolArgs, ctx);
          case "calendar_list":
            return await handlers.handleCalendarList(toolArgs, ctx);
          case "calendar_create":
            return await handlers.handleCalendarCreate(toolArgs, ctx);
          case "calendar_delete":
            return await handlers.handleCalendarDelete(toolArgs, ctx);
          case "calendar_move":
            return await handlers.handleCalendarMove(toolArgs, ctx);

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

              // Envoyer l'animation MAP sur la sphère ESP32
              // Format TEXT : "DESTINATION|DISTANCE|ETA" (max 63 chars pour le buffer C++)
              try {
                const destShort = route.endAddress
                  .split(",")[0]
                  .substring(0, 20);
                const distShort = (route.distance || "--").substring(0, 10);
                const etaShort = (
                  route.durationInTraffic ||
                  route.duration ||
                  "--"
                ).substring(0, 10);
                const sphereText =
                  `${destShort}|${distShort}|${etaShort}`.substring(0, 63);
                const BASE = "http://localhost:3001";
                fetch(`${BASE}/api/sphere/state`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ state: "MAP" }),
                }).catch((e) => console.warn("⚠️ Sphere STATE MAP:", e));
                fetch(`${BASE}/api/sphere/text`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ text: sphereText }),
                }).catch((e) => console.warn("⚠️ Sphere TEXT MAP:", e));
                console.log("🗺️ Sphere MAP activé:", sphereText);
              } catch (sphereErr) {
                console.warn("⚠️ Sphere MAP non envoyé:", sphereErr);
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

          // === MODE VEILLE INTELLIGENTE ===
          // Commandes vocales : "Jarvis, active le mode veille" / "Jarvis, bonne nuit"
          case "sleep_mode": {
            const action = toolArgs.action || "activate";
            const wakeUpTime = toolArgs.wake_up_time || null;
            if (action === "activate") {
              const res = await fetch(
                "http://localhost:3001/api/sleep/activate",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ wakeUpTime }),
                },
              );
              const data = await res.json();
              if (!data.success)
                speak(`Impossible d'activer la veille : ${data.message}`);
              return {
                status: data.success ? "success" : "error",
                message: data.message,
              };
            } else {
              const res = await fetch(
                "http://localhost:3001/api/sleep/deactivate",
                { method: "POST" },
              );
              const data = await res.json();
              return {
                status: data.success ? "success" : "error",
                message: data.message,
              };
            }
          }

          // === BRIEFING VOCAL MATINAL ===
          // Commandes vocales : "Jarvis, donne-moi mon briefing" / "Jarvis, résumé du matin"
          case "morning_briefing": {
            const city = toolArgs.city || "Annecy";
            const res = await fetch(
              `http://localhost:3001/api/briefing?city=${encodeURIComponent(city)}`,
            );
            if (!res.ok) {
              speak("Désolé Monsieur, je n'ai pas pu générer votre briefing.");
              return { status: "error", message: `HTTP ${res.status}` };
            }
            const briefingData = await res.json();
            if (briefingData.text) speak(briefingData.text);
            return { status: "success", data: briefingData };
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
      startWhatsAppFlow,
    ],
  );

  return { executeTool };
}
