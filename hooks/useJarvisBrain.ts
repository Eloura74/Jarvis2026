/**
 * useJarvisBrain - Le Cerveau de J.A.R.V.I.S. (MODULARISÉ)
 */

import React, { useState, useCallback } from "react";
import { streamCommand } from "../services/geminiService";
import { trackCommand } from "../services/predictionEngine";
import {
  CommandInfo,
  StatusOverlayData,
  ToolResult,
  TechNotification,
} from "../types/app.types";
import { LogEntry, SystemStatus, AppMemory, OmniDecision } from "../types";
import { AppPath } from "./useAppPaths";

// HOOKS & UTILS MODULAIRES
import { useToolExecutor } from "./brain/useToolExecutor";
import { isRichTool, isChainableTool } from "./brain/useBrainUtils";
import { useQuantumObserver } from "./brain/useQuantumObserver";

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
  speak: (text: string, queue?: boolean) => void;
  setActiveOverlay: (overlay: string | null) => void;
  addConversationMessage?: (role: "user" | "model", text: string) => void;
  getConversationContext?: () => string;
  setVisualMode?: (query: string | null, isVisible: boolean) => void;
  stopConversation?: () => void;
  setStatusOverlay?: (data: StatusOverlayData | null) => void;
}

export function useJarvisBrain(props: UseJarvisBrainProps) {
  const {
    addLog,
    setStatus,
    speak,
    addConversationMessage,
    getConversationContext,
    appMemory,
  } = props;

  const [commandHistory, setCommandHistory] = useState<CommandInfo[]>([]);
  const [successTrigger, setSuccessTrigger] = useState(0);
  const [lastTokenUsage, setLastTokenUsage] =
    useState<OmniDecision["tokenUsage"]>();

  // Utilisation du routeur d'outils extrait
  const { executeTool } = useToolExecutor(props);
  const [hudNotifications, setHudNotifications] = useState<TechNotification[]>(
    [],
  );
  // 🔔 NOTIFICATIONS PROACTIVES (SSE)
  React.useEffect(() => {
    const sseUrl = "http://localhost:3001/api/events";
    console.log("[JARVIS BRAIN] Connexion aux évènements proactifs (SSE)...");
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "CONNECTED") {
          console.log("[JARVIS BRAIN] SSE Connecté :", data.message);
          return;
        }

        console.log("🔔 [JARVIS PUSH NOTIFICATION]", data);

        // Si le backend a fourni une phrase précise à prononcer (ex: "Impression terminée")
        if (data.messageToSpeak) {
          speak(data.messageToSpeak, false); // On force la parole (queue=false)
          addLog(`Proactive: ${data.messageToSpeak}`, "SYSTEM", "warning");

          if (addConversationMessage) {
            addConversationMessage(
              "model",
              `(Notification Proactive) ${data.messageToSpeak}`,
            );
          }
        }

        // Ajouter au HUD
        const newNotif: TechNotification = {
          id: `push-${Date.now()}`,
          title: `Alerte ${data.type}`,
          message: data.messageToSpeak || "Nouvel évènement reçu.",
          type: "info",
          timestamp: new Date(),
        };
        setHudNotifications((prev) => [...prev, newNotif]);
      } catch (err) {
        console.error("Erreur parsing SSE:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn(
        "[JARVIS BRAIN] Erreur connexion SSE, tentative de reconnexion...",
        err,
      );
    };

    return () => {
      eventSource.close();
      console.log("[JARVIS BRAIN] SSE Déconnecté.");
    };
  }, [speak, addLog, addConversationMessage]);
  // 🌌 QUANTUM OBSERVER (Analyse proactive + Ghost Mode)
  // On ne passe que les commandes réelles de l'utilisateur (pas les prompts internes de bouclage)
  const realUserCommands = React.useMemo(() => {
    return commandHistory
      .filter(
        (c) =>
          !c.text.includes("L'action est TERMINÉE") &&
          !c.text.includes("L'action précédente est terminée"),
      )
      .map((c) => c.text);
  }, [commandHistory]);

  const { resetInactivity } = useQuantumObserver({
    logs: realUserCommands,
    currentTask: realUserCommands[0] || "Idle",
    isEnabled: true,
    executeTool,
    onSuggestion: (result) => {
      if (result.suggestedAction) {
        // Ajouter au HUD
        const newNotif: TechNotification = {
          id: `quantum-${Date.now()}`,
          title: "Neural Suggestion",
          message: (result.reason as string) || "Suggestion disponible",
          type: "quantum",
          timestamp: new Date(),
        };
        setHudNotifications((prev) => [...prev, newNotif]);

        addLog(`🌌 Magical Suggestion: ${result.reason}`, "OMNI", "warning");
        speak(`Monsieur, j'ai une suggestion : ${result.reason}.`);
      }
    },
  });

  /**
   * Traitement d'une commande utilisateur
   */
  const processCommand = useCallback(
    async (text: string, manualContext?: string) => {
      if (!text.trim()) return;

      const isInternalPrompt = text.includes(
        "L'action précédente est terminée",
      );
      if (addConversationMessage && !isInternalPrompt) {
        addConversationMessage("user", text);
        resetInactivity(); // Monsieur est actif !
      }

      const newCommand: CommandInfo = {
        text,
        timestamp: Date.now(),
        status: "pending",
      };
      setCommandHistory((prev) => [newCommand, ...prev]);
      setStatus(SystemStatus.PROCESSING);
      addLog(`Analyzing: "${text}"`, "USER", "info");

      // 🟣 SPHERE VISUAL CONTEXT
      const visualMode = detectVisualMode(text);
      if (visualMode) {
        setSphereMode(visualMode);
      }
      try {
        const conversationContext =
          manualContext ||
          (getConversationContext ? getConversationContext() : "");

        let hasSpokenSummary = false;
        let toolCount = 0;

        await streamCommand(text, appMemory, conversationContext, {
          onTextChunk: (chunk) => {
            speak(chunk, true); // true = append to queue for seamless playback
            if (addConversationMessage) addConversationMessage("model", chunk);
            setStatus(SystemStatus.PROCESSING);
          },
          onToolCall: async (toolCall) => {
            toolCount++;
            addLog(`[Tool] Executing: ${toolCall.name}`, "KERNEL", "warning");

            // 🟣 SPHERE: Trigger visual mode based on tool
            const toolMode = modeFromTool(toolCall.name);
            if (toolMode) setSphereMode(toolMode);

            try {
              const toolResult = (await executeTool(
                toolCall.name,
                toolCall.args,
              )) as ToolResult;

              // Chainable tools (autonomous loop)
              if (
                toolResult &&
                toolResult.status === "success" &&
                isChainableTool(toolCall.name)
              ) {
                const dataStr = JSON.stringify(toolResult.data || "");
                const toolResultMsg = `[RÉSULTAT ${toolCall.name.toUpperCase()}] : ${dataStr.substring(0, 5000)}...`;
                if (addConversationMessage)
                  addConversationMessage(
                    "model",
                    `(Internal context) ${toolResultMsg}`,
                  );

                setTimeout(() => {
                  processCommand(
                    "IMPORTANT : L'action est TERMINÉE. Utilisez ces données pour compléter l'objectif de Monsieur. Agissez immédiatement.",
                    `${conversationContext}\nJARVIS: ${toolResultMsg}`,
                  );
                }, 1000);
              }

              // Rich tools (intelligent summary)
              if (
                toolResult &&
                toolResult.data &&
                isRichTool(toolCall.name) &&
                !hasSpokenSummary
              ) {
                let summary: string;
                if (toolCall.name === "show_status_overlay") {
                  const data = toolResult.data as { title?: string };
                  summary = `Affichage du rapport pour ${data.title || "le dispositif"}, Monsieur.`;
                  console.log("🌌 BRAIN: Using static summary for overlay.");
                } else {
                  const { summarizeToolResults } =
                    await import("../services/geminiService");
                  summary = await summarizeToolResults(
                    toolCall.name,
                    toolResult.data,
                  );
                }
                speak(summary, true);
                hasSpokenSummary = true;
                if (addConversationMessage)
                  addConversationMessage("model", summary);
              }
            } catch (e) {
              console.error("Executor error:", e);
            }
          },
          onComplete: (decision) => {
            if (decision.toolCalls && decision.toolCalls.length > 0)
              trackCommand(text);
            if (decision.tokenUsage) setLastTokenUsage(decision.tokenUsage);
            setSuccessTrigger(Date.now());
            setCommandHistory((prev) =>
              prev.map((c) =>
                c.timestamp === newCommand.timestamp
                  ? { ...c, status: "success", result: decision.text }
                  : c,
              ),
            );

            if (!hasSpokenSummary && decision.type !== "MIXED_RESPONSE") {
              const msg =
                toolCount > 1 ? `${toolCount} actions exécutées.` : "Exécuté.";
              if (toolCount > 0) {
                speak(msg, true);
                if (addConversationMessage)
                  addConversationMessage("model", msg);
              }
            }

            setStatus(SystemStatus.IDLE);
          },
          onError: (errorMsg) => {
            setStatus(SystemStatus.ERROR);
            addLog(errorMsg, "SYSTEM", "error");
            speak("Désolé, une erreur technique est survenue.");
            setSphereMode("ERROR");
            setTimeout(() => setSphereMode("IDLE"), 4000);
          },
        });
      } catch (e) {
        console.error("Brain outer error:", e);
        setStatus(SystemStatus.ERROR);
        addLog("Erreur traitement global", "SYSTEM", "error");
        speak("Désolé, le noyau neuronal est indisponible.");
        setSphereMode("ERROR");
        setTimeout(() => setSphereMode("IDLE"), 4000);
      }
    },
    [
      executeTool,
      addConversationMessage,
      addLog,
      appMemory,
      getConversationContext,
      resetInactivity,
      setStatus,
      speak,
    ],
  );

  return {
    processCommand,
    commandHistory,
    successTrigger,
    lastTokenUsage,
    hudNotifications,
  };
}

// 🟣 HELPER SPHERE
function setSphereMode(mode: string) {
  fetch("http://localhost:3001/api/sphere/mode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  }).catch((err) => console.warn("Sphere API Error:", err));
}

function detectVisualMode(text: string): string | null {
  const t = text.toLowerCase();

  // High priority specific keywords
  if (t.match(/timer|minuteur|compte à rebours|chrono/)) return "TIMER";
  if (t.match(/impression|imprimante|bambu|filament|buse/)) return "PRINT";
  if (t.match(/musique|spotify|volume|son|joue|play|pause/)) return "MEDIA";
  if (t.match(/succès|réussi|terminé|bravo/)) return "SUCCESS";
  if (t.match(/notif|message|alerte/)) return "NOTIFICATION";

  if (t.match(/météo|weather|temps|pleuvoir|soleil/)) return "WEATHER";
  if (t.match(/maison|home|lumière|salon|cuisine|étage|garage|domotique/))
    return "HOME";
  if (t.match(/système|system|cpu|ram|stockage|pc|ordinateur|performance/))
    return "SYSTEM";
  if (t.match(/matrice|matrix|code|hack|terminal|débug|debug/)) return "MATRIX";
  if (t.match(/cherche|search|trouve|google|internet|web/)) return "SEARCH";
  return null;
}

function modeFromTool(toolName: string): string | null {
  if (toolName.includes("timer") || toolName.includes("alarm")) return "TIMER";
  if (toolName.includes("bambu") || toolName.includes("print")) return "PRINT";
  if (
    toolName.includes("music") ||
    toolName.includes("media") ||
    toolName.includes("volume")
  )
    return "MEDIA";
  if (
    toolName.includes("home") ||
    toolName.includes("light") ||
    toolName.includes("switch")
  )
    return "HOME";
  if (toolName.includes("search") || toolName.includes("browser"))
    return "SEARCH";
  if (toolName.includes("weather")) return "WEATHER";
  return null;
}
