// ============================================================================
// GEMINI SERVICE  Point d'entrée principal
// ============================================================================
// Ce fichier orchestre les appels Gemini en streaming.
// Les responsabilités sont déléguées aux sous-modules :
//   - geminiSystemPrompt.ts  : construction du system prompt JARVIS
//   - geminiTools.ts         : déclarations des outils (function calling)
//   - geminiRateLimiter.ts   : circuit breaker 429 + throttle
//   - geminiSummarize.ts     : synthèse vocale des résultats d'outils
//   - geminiCache.ts         : cache LRU des décisions OmniDecision

import { AppMemory } from "../types";
import { OmniDecision } from "../types/app.types";
import {
  generateContentStreamProxy,
  GeminiHistoryEntry,
} from "./geminiProxyClient";
import { generateSystemInstruction } from "./geminiSystemPrompt";
import { toolDeclarations } from "./geminiTools";
import { waitIfNecessary } from "./geminiRateLimiter";
// import { getHAContext } from "./homeAssistantService"; // DÉSACTIVÉ - HA inaccessible
import { selectThinkingBudget } from "./geminiThinkingConfig";

// Réexports pour compatibilité des imports existants
export { clearCache as clearDecisionCache } from "./geminiCache";
export { getCachedDecision, setCachedDecision } from "./geminiCache";
export { resetNeuralShield, checkNeuralStatus } from "./geminiRateLimiter";
export {
  summarizeToolResults,
  getQMSAnalysis,
  getNeuralBriefing,
} from "./geminiSummarize";

// ============================================================================
// DÉTECTION DE COMPLEXITÉ  maxOutputTokens adaptatif (A7)
// ============================================================================

/**
 * Estime le nombre de tokens de sortie approprié selon la nature de la requête.
 * - Requête simple (question directe, météo, heure)  300 tokens (~3-4 phrases)
 * - Requête complexe (analyse, rapport, liste, résumé)  600 tokens (~6-8 phrases)
 * - Requête avec tool call probable  undefined (pas de limite, Gemini gère)
 */
const estimateMaxOutputTokens = (input: string): number | undefined => {
  const t = input.toLowerCase();
  const complexKeywords = [
    "rapport",
    "résumé",
    "liste",
    "détail",
    "explique",
    "compare",
    "historique",
    "bilan",
    "synthèse",
    "décris",
    "raconte",
    "quels sont",
    "donne-moi tous",
    "tout ce que",
  ];
  if (complexKeywords.some((k) => t.includes(k))) return 600;
  const toolKeywords = [
    "ouvre",
    "lance",
    "allume",
    "éteins",
    "envoie",
    "réponds",
    "crée",
    "ajoute",
    "supprime",
    "ferme",
    "minimise",
    "maximise",
    "cherche",
    "navigue",
    "va sur",
    "montre",
    "affiche",
    "capture",
    "timer",
    "minuteur",
    "volume",
    "mute",
    "veille",
    "briefing",
    "météo",
    "agenda",
    "calendrier",
    "mail",
    "gmail",
    "whatsapp",
    "spotify",
    "écran",
    "code",
    "regarde",
    "lis",
    "analyse",
  ];
  if (toolKeywords.some((k) => t.includes(k))) return undefined;
  return 300;
};

// ============================================================================
// FLUX DE STREAMING PRINCIPAL
// ============================================================================

export interface StreamCallbacks {
  onTextChunk?: (text: string) => void;
  onToolCall?: (tool: {
    name: string;
    args: Record<string, unknown>;
  }) => void | Promise<void>;
  onComplete?: (finalDecision: OmniDecision) => void;
  onError?: (error: string) => void;
}

export const streamCommand = async (
  input: string,
  memories: AppMemory[],
  conversationContext: string = "",
  callbacks: StreamCallbacks,
  /**
   * Historique de conversation au format natif Gemini Content[].
   * Quand fourni, Gemini reçoit les tours précédents comme contexte multi-tours
   * natif (bien supérieur à l'injection texte dans le system prompt).
   * Le message courant (input) est ajouté en dernier par le backend.
   */
  history: GeminiHistoryEntry[] = [],
) => {
  await waitIfNecessary();

  try {
    console.log(
      `Appel Gemini STREAM pour "${input}" (historique: ${history.length} tours)`,
    );

    let memSum = "No prior usage.";
    if (memories.length > 0) {
      memSum =
        "Frequent Apps: " +
        memories.map((m) => m.appName + " (" + m.launchCount + ")").join(", ");
    }

    // DÉSACTIVÉ temporairement - Home Assistant inaccessible après déménagement
    // const haContext = await getHAContext();
    const haContext = "";

    // Adapter maxOutputTokens selon la complexité de la requête (A7)
    // undefined = pas de limite (tool calls), 300 = simple, 600 = complexe
    const maxOutputTokens = estimateMaxOutputTokens(input);

    // Budget de réflexion adaptatif (Gemini 2.5 Flash thinking budget)
    // - 0    désactivé (commandes simples, latence minimale)
    // - -1   automatique (Gemini décide selon la difficulté)
    // - 8192  réflexion approfondie (analyses, rapports complexes)
    const thinkingBudget = selectThinkingBudget(input);

    // Détecter si on doit forcer l'usage d'un outil visuel
    const t = input.toLowerCase();
    const isToolExplicit = [
      "écran",
      "code",
      "regarde",
      "lis",
      "analyse",
      "capture",
    ].some((k) => t.includes(k));

    // Détecter les commandes d'action (ouvre, lance, ferme, etc.)
    const isActionCommand = [
      "ouvre",
      "lance",
      "démarre",
      "ferme",
      "arrête",
      "open",
      "launch",
      "start",
      "close",
      "stop",
    ].some((k) => t.includes(k));

    // Détecter les commandes de recherche web
    const isSearchCommand = [
      "recherche",
      "cherche",
      "trouve",
      "montre",
      "affiche",
      "search",
      "find",
      "show",
    ].some((k) => t.includes(k));

    // FORÇAGE TECHNIQUE : On désactive la réflexion longue si une requête visuelle, action ou recherche est demandée
    // car le "Thinking Mode" désactive ou occulte très souvent l'appel aux outils (Function Calling) chez Gemini.
    const finalThinkingBudget =
      isToolExplicit || isActionCommand || isSearchCommand ? 0 : thinkingBudget;

    let systemInstruction =
      generateSystemInstruction(memSum, conversationContext) + haContext;

    // FORÇAGE SÉMANTIQUE : Si l'utilisateur demande à voir/lire qqchose,
    // on injecte un ordre ABSOLU en tête du prompt système.
    if (isToolExplicit) {
      systemInstruction =
        "CRITICAL DIRECTIVE: The user is asking you to look at their screen or code. YOU MUST IMMEDIATELY CALL THE 'analyze_screen' TOOL. DO NOT ANSWER BY TEXT FIRST. CALL THE TOOL NOW.\n\n" +
        systemInstruction;
    }

    // FORÇAGE SÉMANTIQUE : Si l'utilisateur demande une action (ouvrir, lancer, fermer),
    // on force l'appel du tool approprié
    if (isActionCommand) {
      systemInstruction =
        "CRITICAL DIRECTIVE: The user is requesting an ACTION (open, launch, close, etc.). YOU MUST IMMEDIATELY CALL THE APPROPRIATE TOOL. DO NOT ANSWER BY TEXT. AVAILABLE ACTION TOOLS: search_and_launch_app, manage_window, adjust_volume, control_home_automation. CALL THE TOOL NOW.\n\n" +
        systemInstruction;
    }

    // FORÇAGE SÉMANTIQUE : Si l'utilisateur demande une recherche web
    if (isSearchCommand) {
      systemInstruction =
        "CRITICAL DIRECTIVE: The user is requesting a WEB SEARCH. YOU MUST CALL THE APPROPRIATE SEARCH TOOL:\n" +
        "- If user says 'recherche sur Google/YouTube/GitHub' → CALL search_web\n" +
        "- If user says 'montre-moi', 'trouve', 'affiche' + object/file → CALL show_search_results\n" +
        "DO NOT ANSWER BY TEXT. CALL THE TOOL NOW.\n\n" +
        systemInstruction;
    }

    // S1 : Appel via proxy backend (clé API sécurisée côté serveur)
    // Le proxy gère le fallback 2.5-flash  1.5-flash automatiquement
    // On passe l'historique natif Gemini pour un contexte multi-tours réel
    // thinkingBudget est transmis au backend pour activer la réflexion Gemini 2.5 Flash
    // FORÇAGE ABSOLU : pour les commandes d'action/visuelles, on active le
    // mode ANY (tool call obligatoire) restreint à une liste courte de tools.
    // ANY avec les 57 tools provoque une erreur 400 "too much branching".
    let allowedFunctionNames: string[] | undefined;
    if (isActionCommand) {
      allowedFunctionNames = [
        "search_and_launch_app",
        "manage_window",
        "adjust_volume",
        "control_home_automation",
        "spotify_control",
        "kill_process",
      ];
    } else if (isToolExplicit) {
      allowedFunctionNames = ["analyze_screen", "take_screenshot"];
    } else if (isSearchCommand) {
      allowedFunctionNames = ["search_web", "show_search_results", "open_url"];
    }

    const responseStream = generateContentStreamProxy(input, {
      systemInstruction,
      tools: toolDeclarations,
      temperature: 0.1,
      maxOutputTokens: maxOutputTokens as number | undefined,
      history: history.length > 0 ? history : undefined,
      thinkingBudget: finalThinkingBudget,
      allowedFunctionNames,
    });

    let fullText = "";
    let accumulatedTextChunk = "";
    const allToolCalls: Array<{ name: string; args: Record<string, unknown> }> =
      [];

    // Consommer les chunks du proxy SSE
    for await (const chunk of responseStream) {
      if (chunk.type === "error") {
        throw new Error(chunk.message || "Erreur proxy Gemini");
      }

      if (chunk.type === "tool" && chunk.name && chunk.args) {
        const validCall = { name: chunk.name, args: chunk.args };
        allToolCalls.push(validCall);
        if (callbacks.onToolCall) await callbacks.onToolCall(validCall);
      }

      if (chunk.type === "text" && chunk.text) {
        const textPart = chunk.text;
        fullText += textPart;
        accumulatedTextChunk += textPart;

        // Découper la phrase sur ponctuation forte/moyenne, en ignorant :
        // - Les points dans les nombres (3.5, 192.168.1.1, v2.0)
        // - Les abréviations courantes (M., Dr., etc.)
        // - Les URLs (http://..., www.)
        const SMART_SPLIT_REGEX =
          /(?<![0-9])(?<!(?:^|\s)[A-Z])(?<!www)(?<!Dr)(?<!Mr)(?<!Mme?)(?<!etc)[.!?;:]\s+/;
        const match = accumulatedTextChunk.match(SMART_SPLIT_REGEX);
        if (match && match.index !== undefined) {
          const splitPos = match.index + match[0].length;
          const chunkToSpeak = accumulatedTextChunk
            .substring(0, splitPos)
            .trim();
          if (chunkToSpeak && callbacks.onTextChunk) {
            callbacks.onTextChunk(chunkToSpeak);
          }
          accumulatedTextChunk = accumulatedTextChunk.substring(splitPos);
        }
      }
    }

    // Flush de ce qui reste s'il n'y a pas de ponctuation à la fin
    if (accumulatedTextChunk.trim() && callbacks.onTextChunk) {
      callbacks.onTextChunk(accumulatedTextChunk.trim());
    }

    let decision: OmniDecision;
    if (allToolCalls.length > 0 && fullText.trim()) {
      decision = {
        type: "MIXED_RESPONSE",
        toolCalls: allToolCalls,
        text: fullText,
        confidence: 0.99,
      };
    } else if (allToolCalls.length > 0) {
      decision = {
        type: "TOOL_CALL",
        toolCalls: allToolCalls,
        confidence: 0.99,
      };
    } else {
      decision = {
        type: "TEXT_RESPONSE",
        text: fullText || "Standing by.",
        confidence: 0.8,
      };
    }

    console.log(
      "STREAM DECISION:",
      decision.type,
      allToolCalls.length > 0 ? allToolCalls[0].name : "",
    );
    if (callbacks.onComplete) callbacks.onComplete(decision);
  } catch (error: any) {
    console.error("OMNI Core STREAM Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    if (callbacks.onError)
      callbacks.onError(
        `⚠️ ALERTE SYSTÈME : ${errorMessage}. (Code: ERR_CORE_FAIL)`,
      );
  }
};
