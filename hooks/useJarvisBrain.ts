/**
 * useJarvisBrain - Le Cerveau de J.A.R.V.I.S. (MODULARISÉ)
 */

import React, { useState, useCallback } from "react";
import { parseCommand } from "../services/geminiService";
import { trackCommand } from "../services/predictionEngine";
import { CommandInfo } from "../types/app.types";
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
  setStatusOverlay?: (data: any) => void;
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
  const [hudNotifications, setHudNotifications] = useState<any[]>([]);

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
        const newNotif = {
          id: `quantum-${Date.now()}`,
          title: "Neural Suggestion",
          message: result.reason,
          type: "quantum",
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

            try {
              const toolResult = await executeTool(
                toolCall.name,
                toolCall.args,
              );

              if (toolCall.name === "show_status_overlay") {
                console.log(
                  "🌌 BRAIN: toolResult for show_status_overlay:",
                  toolResult,
                );
              }

              // Chainable tools (autonomous loop)
              if (
                toolResult &&
                (toolResult as any).status === "success" &&
                isChainableTool(toolCall.name)
              ) {
                const dataStr = JSON.stringify((toolResult as any).data || "");
                const toolResultMsg = `[RÉSULTAT ${toolCall.name.toUpperCase()}] : ${dataStr.substring(0, 5000)}...`;
                if (addConversationMessage)
                  addConversationMessage("model", toolResultMsg);

                if (i === result.toolCalls.length - 1) {
                  await new Promise((r) => setTimeout(r, 1000));
                  return processCommand(
                    "IMPORTANT : L'action est TERMINÉE. Utilisez ces données pour compléter l'objectif de Monsieur. Agissez immédiatement.",
                    `${conversationContext}\nJARVIS: ${toolResultMsg}`,
                  );
                }
              }

              // Rich tools (intelligent summary)
              if (
                toolResult &&
                (toolResult as any).data &&
                isRichTool(toolCall.name) &&
                !hasSpokenSummary
              ) {
                let summary: string;
                if (toolCall.name === "show_status_overlay") {
                  summary = `Affichage du rapport pour ${(toolResult as any).data.title || "le dispositif"}, Monsieur.`;
                  console.log("🌌 BRAIN: Using static summary for overlay.");
                } else {
                  const { summarizeToolResults } =
                    await import("../services/geminiService");
                  summary = await summarizeToolResults(
                    toolCall.name,
                    (toolResult as any).data,
                  );
                }
                speak(summary, result.type === "MIXED_RESPONSE");
                hasSpokenSummary = true;
                if (addConversationMessage)
                  addConversationMessage("model", summary);
              }
            } catch (err) {
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
      } catch (error) {
        setStatus(SystemStatus.ERROR);
        addLog("Erreur traitement", "SYSTEM", "error");
        speak("Désolé, une erreur est survenue.");
        setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
      }
    },
    [props, executeTool],
  );

  return {
    processCommand,
    commandHistory,
    successTrigger,
    lastTokenUsage,
    hudNotifications,
  };
}
