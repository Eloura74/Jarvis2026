/**
 * useJarvisBrain - Le Cerveau de J.A.R.V.I.S. (MODULARISÉ)
 */

import React, { useState, useCallback } from "react";
import { parseCommand } from "../services/geminiService";
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
        const result = await parseCommand(text, appMemory, conversationContext);

        if (result.tokenUsage) setLastTokenUsage(result.tokenUsage);

        // CASE 1 & 2: TOOL CALLS (Direct or Mixed)
        if (result.toolCalls && result.toolCalls.length > 0) {
          const toolCount = result.toolCalls.length;
          addLog(`Intent: ${toolCount} tool(s) to execute`, "OMNI", "info");
          if (result.type === "MIXED_RESPONSE" && result.text) {
            speak(result.text);
            if (addConversationMessage)
              addConversationMessage("model", result.text);
          }
          trackCommand(text);

          let hasSpokenSummary = false;

          for (let i = 0; i < result.toolCalls.length; i++) {
            const toolCall = result.toolCalls[i];
            addLog(
              `[${i + 1}/${toolCount}] Executing: ${toolCall.name}`,
              "KERNEL",
              "warning",
            );

            // 🟣 SPHERE: Trigger visual mode based on tool
            const toolMode = modeFromTool(toolCall.name);
            if (toolMode) setSphereMode(toolMode);

            try {
              const toolResult = await executeTool(
                toolCall.name,
                toolCall.args,
              );

              const tResult = toolResult as ToolResult;

              if (toolCall.name === "show_status_overlay") {
                console.log(
                  "🌌 BRAIN: toolResult for show_status_overlay:",
                  tResult,
                );
              }

              // Chainable tools (autonomous loop)
              if (
                tResult &&
                tResult.status === "success" &&
                isChainableTool(toolCall.name)
              ) {
                const dataStr = JSON.stringify(tResult.data || "");
                const toolResultMsg = `[RÉSULTAT ${toolCall.name.toUpperCase()}] : ${dataStr.substring(0, 5000)}...`;
                if (addConversationMessage)
                  addConversationMessage("model", toolResultMsg);

                if (i === result.toolCalls!.length - 1) {
                  await new Promise((r) => setTimeout(r, 1000));
                  return processCommand(
                    "IMPORTANT : L'action est TERMINÉE. Utilisez ces données pour compléter l'objectif de Monsieur. Agissez immédiatement.",
                    `${conversationContext}\nJARVIS: ${toolResultMsg}`,
                  );
                }
              }

              // Rich tools (intelligent summary)
              if (
                tResult &&
                tResult.data &&
                isRichTool(toolCall.name) &&
                !hasSpokenSummary
              ) {
                let summary: string;
                if (toolCall.name === "show_status_overlay") {
                  const data = tResult.data as { title?: string };
                  summary = `Affichage du rapport pour ${data.title || "le dispositif"}, Monsieur.`;
                  console.log("🌌 BRAIN: Using static summary for overlay.");
                } else {
                  const { summarizeToolResults } =
                    await import("../services/geminiService");
                  summary = await summarizeToolResults(
                    toolCall.name,
                    tResult.data,
                  );
                }
                speak(summary, result.type === "MIXED_RESPONSE");
                hasSpokenSummary = true;
                if (addConversationMessage)
                  addConversationMessage("model", summary);
              }
            } catch {
              /* handled in executor */
            }
          }

          setSuccessTrigger(Date.now());
          setCommandHistory((prev) =>
            prev.map((c) =>
              c.timestamp === newCommand.timestamp
                ? { ...c, status: "success" }
                : c,
            ),
          );
          if (!hasSpokenSummary && result.type !== "MIXED_RESPONSE") {
            const msg =
              toolCount > 1 ? `${toolCount} actions exécutées.` : "Exécuté.";
            speak(msg);
            if (addConversationMessage) addConversationMessage("model", msg);
          }
          setStatus(SystemStatus.IDLE);
        }
        // CASE 3: TEXT ONLY
        else if (result.type === "TEXT_RESPONSE" && result.text) {
          addLog(`Intent: Conversation`, "OMNI", "info");
          speak(result.text);
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
          speak("Entendu.");
        }

        // Reset Sphere to IDLE after a short delay (unless it's a long task?)
        // For now, let it stay in mode or reset?
        // Better to reset to standard animation after interaction is done.
        setTimeout(() => setSphereMode("IDLE"), 5000);
      } catch {
        setStatus(SystemStatus.ERROR);
        addLog("Erreur traitement", "SYSTEM", "error");
        speak("Désolé, une erreur est survenue.");
        setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
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
