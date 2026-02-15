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
import { LogEntry, SystemStatus, AppMemory, OmniDecision } from "../types";
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
  speak: (text: string, queue?: boolean) => void;
  setActiveOverlay: (overlay: string | null) => void;
  // NOUVEAU : Props pour la mémoire conversationnelle
  addConversationMessage?: (role: "user" | "model", text: string) => void;
  getConversationContext?: () => string;
  // NOUVEAU : Mode Visuel
  // NOUVEAU : Mode Visuel
  setVisualMode?: (query: string | null, isVisible: boolean) => void;
  stopConversation?: () => void;
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
  stopConversation,
}: UseJarvisBrainProps) {
  const [commandHistory, setCommandHistory] = useState<CommandInfo[]>([]);
  const [successTrigger, setSuccessTrigger] = useState(0);
  const [lastTokenUsage, setLastTokenUsage] =
    useState<OmniDecision["tokenUsage"]>();

  // ========================================
  // EXÉCUTION DES OUTILS
  // ========================================
  const executeTool = async (toolName: string, toolArgs: any) => {
    // Contexte commun (avec speak pour Vision et stopConversation)
    const ctx: HandlerContext & { speak?: (text: string) => void } = {
      addLog,
      setStatus,
      setVisualMode,
      speak,
      stopConversation,
    };

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
        case "read_web_page": // NOUVEAU
          return await handlers.handleReadWebPage(toolArgs, ctx);
        case "manage_bookmarks":
          return await handlers.handleManageBookmarks(toolArgs, ctx);
        case "show_images": // NOUVEAU
          return await handlers.handleShowImages(toolArgs, ctx);
        case "generate_image": // NOUVEAU
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

        // === VISION (Gemini Vision - GRATUIT) ===
        case "analyze_screen":
          return await handlers.handleAnalyzeScreen(toolArgs, ctx);

        // === GOOGLE SERVICES (NOUVEAU) ===
        case "gmail_read":
          return await handlers.handleGmailRead(toolArgs, ctx);
        case "gmail_send":
          return await handlers.handleGmailSend(toolArgs, ctx);
        case "calendar_list":
          return await handlers.handleCalendarList(toolArgs, ctx);

        // === HOME ASSISTANT (NOUVEAU) ===
        case "control_home_automation":
          // Import dynamique pour éviter les cycles ou chargement immédiat
          const { handleControlHomeAutomation } = await import("../handlers");
          return await handleControlHomeAutomation(toolArgs, ctx);

        // === MEMORY (RAG) ===
        case "consult_memory":
          return await handlers.handleConsultMemory(toolArgs, ctx);

        // === CONVERSATION CONTROL ===
        case "stop_listening":
          if (ctx.stopConversation) {
            ctx.stopConversation();
            addLog("Conversation terminée par l'IA", "SYSTEM", "info");
            return { status: "success", message: "Conversation stoppée." };
          }
          return {
            status: "warning",
            message: "Impossible d'arrêter (fonction manquante).",
          };

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
    async (text: string, manualContext?: string) => {
      if (!text.trim()) return;

      // 1. Sauvegarder message utilisateur (si ce n'est pas un prompt système interne)
      const isInternalPrompt = text.includes(
        "L'action précédente est terminée",
      );
      if (addConversationMessage && !isInternalPrompt) {
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
        const conversationContext =
          manualContext ||
          (getConversationContext ? getConversationContext() : "");

        // 3. Envoyer à Gemini
        const result = await parseCommand(text, appMemory, conversationContext);

        if (result.tokenUsage) {
          setLastTokenUsage(result.tokenUsage);
        }

        // CAS 1 : APPEL D'OUTIL (Un ou plusieurs outils)
        if (
          result.type === "TOOL_CALL" &&
          result.toolCalls &&
          result.toolCalls.length > 0
        ) {
          const toolCount = result.toolCalls.length;
          console.log(
            `🧠 [BRAIN] Intent: ${toolCount} tool${toolCount > 1 ? "s" : ""} to execute`,
            result.toolCalls,
          );
          addLog(
            `Intent: ${toolCount} tool${toolCount > 1 ? "s" : ""} to execute`,
            "OMNI",
            "info",
          );
          trackCommand(text);

          // Exécution séquentielle de tous les outils
          let hasSpokenSummary = false;

          for (let i = 0; i < result.toolCalls.length; i++) {
            const toolCall = result.toolCalls[i];
            console.log(
              `⚙️ [KERNEL] [${i + 1}/${toolCount}] Executing: ${toolCall.name}`,
              toolCall.args,
            );
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
              console.log(
                `✅ [KERNEL] Tool ${toolCall.name} completed:`,
                toolResult,
              );

              // --- NOUVEAU : GESTION DE LA CHAÎNE AUTONOME (RECHERCHE -> ACTION) ---
              const isChainableTool = [
                "read_web_page",
                "analyze_screen",
                "gmail_read",
              ].includes(toolCall.name);

              if (
                toolResult &&
                (toolResult as any).status === "success" &&
                isChainableTool
              ) {
                const dataStr = (toolResult as any).data
                  ? typeof (toolResult as any).data === "string"
                    ? (toolResult as any).data
                    : JSON.stringify((toolResult as any).data)
                  : "";

                // 1. Ajouter le résultat à la mémoire locale pour le prochain tour
                const toolResultMsg = `[RÉSULTAT ${toolCall.name.toUpperCase()}] : ${dataStr.substring(0, 5000)}...`;
                if (addConversationMessage) {
                  addConversationMessage("model", toolResultMsg);
                }

                // 2. Relancer l'analyse avec les nouvelles données
                if (i === result.toolCalls.length - 1) {
                  addLog(
                    "💡 Analyse des données en cours pour la suite...",
                    "OMNI",
                    "info",
                  );

                  // On attend un petit peu pour laisser l'UI respirer
                  await new Promise((r) => setTimeout(r, 1000));

                  // RELANCE AUTONOME : On injecte manuellement le résultat dans le contexte car l'état React n'est pas encore mis à jour
                  const updatedContext = `${conversationContext}\nJARVIS: ${toolResultMsg}`;

                  return processCommand(
                    "IMPORTANT : L'action de lecture/recherche est TERMINÉE. Voici les données. Maintenant, vous DEVEZ compléter l'objectif final de Monsieur (ex: écrire le rapport dans le fichier demandé). N'attendez pas de nouvelle commande, agissez immédiatement en utilisant vos outils (write_file_content, etc.). Si tout est fini, confirmez.",
                    updatedContext,
                  );
                }
              }

              // NOUVEAU : Synthèse intelligente pour les outils riches si pas chaînés
              const isRichTool =
                toolCall.name.startsWith("gmail") ||
                toolCall.name.startsWith("calendar");
              if (
                toolResult &&
                typeof toolResult === "object" &&
                "data" in (toolResult as any) &&
                isRichTool &&
                !hasSpokenSummary
              ) {
                console.log(
                  `🤖 [BRAIN] Generating summary for ${toolCall.name}...`,
                );
                const { summarizeToolResults } =
                  await import("../services/geminiService");
                const summary = await summarizeToolResults(
                  toolCall.name,
                  (toolResult as any).data,
                );
                speak(summary, hasSpokenSummary);
                hasSpokenSummary = true;
                if (addConversationMessage)
                  addConversationMessage("model", summary);
              }
            } catch (toolError) {
              // ... logs existants ...
            }
          }

          setSuccessTrigger(Date.now());
          setCommandHistory((prev) =>
            prev.map((c) =>
              c.timestamp === newCommand.timestamp
                ? {
                    ...c,
                    status: "success",
                    result: `${toolCount} action${toolCount > 1 ? "s" : ""} exécutée${toolCount > 1 ? "s" : ""}`,
                  }
                : c,
            ),
          );

          // Si on n'a pas de résumé intelligent, on dit le message de succès classique
          if (!hasSpokenSummary) {
            const successMsg =
              toolCount > 1
                ? `${toolCount} commandes exécutées avec succès.`
                : "Commande exécutée avec succès.";
            speak(successMsg);
            if (addConversationMessage)
              addConversationMessage("model", successMsg);
          }
        }
        // CAS 2 : RÉPONSE MIXTE (Texte + Outils) - NOUVEAU
        else if (
          result.type === "MIXED_RESPONSE" &&
          result.text &&
          result.toolCalls
        ) {
          console.log(`💬 [BRAIN] Intent: Mixed (Talk + Action)`, {
            text: result.text,
            tools: result.toolCalls,
          });
          // Log détaillé des outils
          result.toolCalls.forEach((tool, idx) => {
            console.log(`  [${idx + 1}] Tool: ${tool.name}`, tool.args);
          });
          addLog(`Intent: Mixed (Talk + Action)`, "OMNI", "info");

          // 1. Parler
          speak(result.text);
          if (addConversationMessage)
            addConversationMessage("model", result.text);

          // 2. Exécuter les outils (ex: show_images)
          for (let i = 0; i < result.toolCalls.length; i++) {
            const toolCall = result.toolCalls[i];
            console.log(
              `⚙️ [KERNEL] [Mixed ${i + 1}/${result.toolCalls.length}] Executing: ${toolCall.name}`,
              toolCall.args,
            );
            addLog(`Exec: ${toolCall.name}`, "KERNEL", "warning");

            try {
              const toolResult = await executeTool(
                toolCall.name,
                toolCall.args,
              );
              console.log(
                `✅ [KERNEL] Tool ${toolCall.name} completed:`,
                toolResult,
              );

              // NOUVEAU : Synthèse intelligente pour les réponses mixtes aussi
              const isRichTool =
                toolCall.name.startsWith("gmail") ||
                toolCall.name.startsWith("calendar");
              if (
                toolResult &&
                typeof toolResult === "object" &&
                "data" in toolResult &&
                isRichTool
              ) {
                console.log(
                  `🤖 [BRAIN] Generating intelligent summary for ${toolCall.name} (Mixed mode)...`,
                );
                const { summarizeToolResults } =
                  await import("../services/geminiService");
                const summary = await summarizeToolResults(
                  toolCall.name,
                  (toolResult as any).data,
                );
                console.log(`🗣️ [BRAIN] Summary generated:`, summary);
                speak(summary, true); // 🔀 Utilise la file d'attente pour ne pas couper le préambule
                if (addConversationMessage)
                  addConversationMessage("model", summary);
              }
            } catch (toolError) {
              console.error(
                `❌ [KERNEL] Tool ${toolCall.name} failed:`,
                toolError,
              );
              addLog(
                `Tool ${toolCall.name} failed: ${toolError instanceof Error ? toolError.message : String(toolError)}`,
                "KERNEL",
                "error",
              );
            }
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
          console.log(`🗨️ [BRAIN] Intent: Conversation -`, result.text);
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
    lastTokenUsage,
  };
}
