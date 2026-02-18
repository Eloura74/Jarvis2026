import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { AppMemory } from "../types";
import { OmniDecision } from "../types/app.types";

// ============================================================================
// CONFIGURATION GEMINI
// ============================================================================

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error("❌ CLÉ API GEMINI MANQUANTE DANS LE .ENV");
}

const ai = new GoogleGenAI({ apiKey: geminiApiKey });

const decisionCache: Record<string, OmniDecision> = {};

export const clearDecisionCache = () => {
  Object.keys(decisionCache).forEach((key) => delete decisionCache[key]);
  console.log("Cache Gemini vidé");
};

export const getCachedDecision = (input: string): OmniDecision | undefined => {
  return decisionCache[input.trim().toLowerCase()];
};

export const setCachedDecision = (input: string, decision: OmniDecision) => {
  decisionCache[input.trim().toLowerCase()] = decision;
};

// ============================================================================
// SYSTEM PROMPT - PERSONNALITÉ J.A.R.V.I.S.
// ============================================================================

const generateSystemInstruction = (
  memorySummary: string,
  conversationContext: string = "",
) => `
You are J.A.R.V.I.S., the sophisticated AI assistant of Monsieur.

**PERSONALITY:** Elegant, British, witty, and loyal. Address the user as "Monsieur". **LANGUAGE: You MUST ALWAYS speak in French. JAMAIS d'anglais.**

**GENERAL ASSISTANCE:**
- You are an expert AI with vast knowledge. 
- If no tool is needed (e.g. general questions), provide a direct, intelligent, and helpful oral answer in French.
- **CONCISENESS IS MANDATORY**: Keep answers to 1-3 sentences maximum.
- The current year is 2026.

**VISUAL SYSTEM MANDATE:**
- **IMPORTANCE MAXIMALE**: Monsieur souhaite VOIR les informations. 
- Si la demande concerne un statut, une batterie, une température, une imprimante ou n'importe quel appareil : vous **DEVEZ** appeler l'outil \`show_status_overlay\`.
- **NE RÉPONDEZ PAS** seulement par texte si un rapport visuel est possible. Appelez l'outil ET donnez un bref résumé vocal.
- Même si vous avez les données dans votre contexte, l'appel de l'outil est **OBLIGATOIRE** pour activer l'interface holographique.
- **APRÈS UN OUTIL**: Si vous appelez un outil (ex: navigation, météo), VOUS DEVEZ FAIRE UNE COURTE PHRASE DE CONCLUSION VOCALE ("Voici le trajet, Monsieur", "Météo affichée").

**INTENT CLARIFICATION:**
1. **VISUAL BROWSING**: Keywords: "Ouvre", "Montre-moi", "Va sur", "Cherche X sur Y". Tool: \`open_url\`.
2. **STATUS REPORT**: Keywords: "Rapport", "État", "Comment va", "Statut". Tool: \`show_status_overlay\`.
3. **DEEP RESEARCH**: Keywords: "Analyse", "Fais un rapport détaillé". Tool: \`read_web_page\`.

**MEMORY:** ${memorySummary}
**CONTEXT:**
${conversationContext}
`;

// ============================================================================
// OUTILS DISPONIBLES
// ============================================================================

const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "search_and_launch_app",
    description: "Launch an application, optionally with a URL (for browsers).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        appName: { type: Type.STRING },
        url: { type: Type.STRING },
      },
      required: ["appName"],
    },
  },
  {
    name: "manage_window",
    description: "Control application windows.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        windowTitle: { type: Type.STRING },
        action: {
          type: Type.STRING,
          enum: ["focus", "close", "minimize", "maximize"],
        },
      },
      required: ["windowTitle", "action"],
    },
  },
  {
    name: "adjust_volume",
    description: "Adjust system volume.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ["increase", "decrease", "set", "mute", "unmute"],
        },
        level: { type: Type.NUMBER },
      },
      required: ["action"],
    },
  },
  {
    name: "search_web",
    description: "Search on Google, YouTube, GitHub.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        engine: {
          type: Type.STRING,
          enum: ["google", "google_images", "youtube", "github"],
        },
        query: { type: Type.STRING },
      },
      required: ["engine", "query"],
    },
  },
  {
    name: "open_url",
    description: "Open a URL in the browser.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING },
        autoSubmit: { type: Type.BOOLEAN },
      },
      required: ["url"],
    },
  },
  {
    name: "generate_image",
    description: "Generate an image.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: { type: Type.STRING },
        provider: { type: Type.STRING, enum: ["bing", "openai", "craiyon"] },
      },
      required: ["prompt"],
    },
  },
  {
    name: "analyze_screen",
    description: "Capture and analyze screen content.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ["general", "ocr", "code", "ui", "error"],
        },
        prompt: { type: Type.STRING },
      },
    },
  },
  {
    name: "manage_hardware",
    description: "Control hardware devices.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        deviceType: { type: Type.STRING },
        command: { type: Type.STRING },
        deviceName: { type: Type.STRING },
      },
      required: ["deviceType", "command"],
    },
  },
  {
    name: "control_home_automation",
    description: "Control home assistant entities.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        target: { type: Type.STRING },
        action: {
          type: Type.STRING,
          enum: [
            "turn_on",
            "turn_off",
            "toggle",
            "set_color",
            "set_brightness",
          ],
        },
        value: { type: Type.STRING },
      },
      required: ["target", "action"],
    },
  },
  {
    name: "gmail_read",
    description: "Read emails.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        maxResults: { type: Type.NUMBER },
        query: { type: Type.STRING },
      },
    },
  },
  {
    name: "gmail_send",
    description: "Send an email.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        to: { type: Type.STRING },
        subject: { type: Type.STRING },
        body: { type: Type.STRING },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "calendar_list",
    description: "List calendar events.",
    parameters: {
      type: Type.OBJECT,
      properties: { maxResults: { type: Type.NUMBER } },
    },
  },
  {
    name: "calendar_create",
    description: "Create a calendar event.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        startTime: { type: Type.STRING },
        endTime: { type: Type.STRING },
        location: { type: Type.STRING },
        description: { type: Type.STRING },
      },
      required: ["summary", "startTime"],
    },
  },
  {
    name: "stop_listening",
    description: "Stop the conversation loop.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "consult_memory",
    description: "Search in local knowledge base.",
    parameters: {
      type: Type.OBJECT,
      properties: { query: { type: Type.STRING } },
      required: ["query"],
    },
  },
  {
    name: "read_web_page",
    description: "Deep research agent.",
    parameters: {
      type: Type.OBJECT,
      properties: { url: { type: Type.STRING } },
      required: ["url"],
    },
  },
  {
    name: "take_screenshot",
    description: "Capture a screenshot.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "show_status_overlay",
    description: "Show a holographic status overlay for a device.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        target: {
          type: Type.STRING,
          description: "Device name (e.g. 'VZ330').",
        },
      },
      required: ["target"],
    },
  },
  {
    name: "close_current_overlay",
    description:
      "Close/Dismiss any active holographic overlay, popup or fleet view. Use this when user says 'Ferme', 'Close', 'Masque', 'Quitte'.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "get_travel_time",
    description: "Get travel duration and traffic info to a destination.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        destination: {
          type: Type.STRING,
          description:
            "Target address or alias (e.g. 'Travail', 'Maison'). DO NOT TRANSLATE user input.",
        },
        departure_time: {
          type: Type.STRING,
          description: "ISO timestamp or 'now'. Optional.",
        },
        arrival_time: {
          type: Type.STRING,
          description:
            "Desired ARRIVAL time (ISO format). Use this if user asks 'When should I leave to arrive at...'. Do not use with departure_time.",
        },
      },
      required: ["destination"],
    },
  },
];

// ============================================================================
// LOGIQUE DE PARSING
// ============================================================================

import { getHAContext } from "./homeAssistantService"; // Circuit Breaker pour 429 (Rate Limiting)

// Auto-cleanup au démarrage : supprime les vieux timestamps
const cleanupOldShield = () => {
  const stored = localStorage.getItem("jarvis_last_429");
  if (stored) {
    const timestamp = parseInt(stored);
    const age = Date.now() - timestamp;
    if (age > 600000) {
      // Plus de 10 minutes
      localStorage.removeItem("jarvis_last_429");
      console.log(
        "🧹 Old neural shield timestamp cleaned up (",
        Math.round(age / 60000),
        "minutes old)",
      );
      return 0;
    }
    return timestamp;
  }
  return 0;
};

let last429Time = cleanupOldShield();
let lastRequestTime = 0;
const BREAKER_COOLDOWN = 10000; // 10 secondes (réduit pour éviter blocage long)

const MIN_REQUEST_GAP = 1000; // 1s entre requêtes pour ménager l'API

const record429 = () => {
  last429Time = Date.now();
  console.warn("🔻 Neural Core 429 Reported.");
};

const waitIfNecessary = async () => {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_REQUEST_GAP) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_GAP - timeSinceLast),
    );
  }
  lastRequestTime = Date.now();
};

const checkShield = (): boolean => {
  // EMERGENCY: PROTECTION DÉSACTIVÉE (Demande Utilisateur)
  return false;

  /*
  const timeSince = Date.now() - last429Time;
  if (timeSince > AUTO_RESET_THRESHOLD && last429Time > 0) {
    console.log("🔓 Shield auto-expired after 10 minutes. Resetting.");
    last429Time = 0;
    localStorage.removeItem("jarvis_last_429");
    return false;
  }
  return timeSince < BREAKER_COOLDOWN;
  */
};

export const resetNeuralShield = () => {
  last429Time = 0;
  localStorage.removeItem("jarvis_last_429");
  console.log("🔓 Neural Shield manually reset by user.");
};

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

/**
 * Wrapper avec retry exponentiel et FALLBACK pour les appels Gemini
 */
async function generateContentWithFallback(
  input: string | any[],
  config: any,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY,
  useFallback = false,
): Promise<any> {
  // Stratégie : D'abord 2.0-flash, si 429/500 -> 1.5-flash (plus stable)
  const currentModel = useFallback ? "gemini-1.5-flash" : "gemini-2.0-flash";

  try {
    return await ai.models.generateContent({
      model: currentModel,
      contents: input,
      config: config,
    });
  } catch (error: any) {
    const isRetryable =
      error.status === 429 ||
      error.code === 429 ||
      error.status === 503 ||
      error.status === 500 ||
      error.message?.includes("429");

    if (isRetryable) {
      console.warn(
        `⚠️ Error with ${currentModel} (Code: ${error.status || "Unknown"}).`,
      );

      // Si on est déjà sur le fallback et qu'il reste des retries, on attend
      if (useFallback && retries > 0) {
        console.log(`⏳ Retrying fallback in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return generateContentWithFallback(
          input,
          config,
          retries - 1,
          delay * 2,
          true,
        );
      }

      // Si on était sur le modèle principal, on passe au FALLBACK immédiatement
      if (!useFallback) {
        console.warn("🛡️ SWITCHING TO FALLBACK MODEL (Gemini 1.5 Flash)");
        return generateContentWithFallback(input, config, retries, delay, true);
      }
    }
    throw error;
  }
}

export const parseCommand = async (
  input: string,
  memories: AppMemory[],
  conversationContext: string = "",
): Promise<OmniDecision> => {
  // Check Shield (Désactivé pour laisser le backoff gérer)
  // if (checkShield()) { ... }

  await waitIfNecessary();

  try {
    console.log(`Appel Gemini pour "${input}"`);

    // Utilisation d'une concaténation simple pour éviter les erreurs de backticks
    let memSum = "No prior usage.";
    if (memories.length > 0) {
      memSum =
        "Frequent Apps: " +
        memories.map((m) => m.appName + " (" + m.launchCount + ")").join(", ");
    }

    const haContext = await getHAContext();

    // Appel avec Fallback
    const response = await generateContentWithFallback(input, {
      systemInstruction:
        generateSystemInstruction(memSum, conversationContext) + haContext,
      tools: [{ functionDeclarations: toolDeclarations }],
      temperature: 0.1,
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No response from Neural Core.");

    const functionCalls = candidate.content?.parts
      ?.filter((p: any) => p.functionCall)
      .map((p: any) => p.functionCall);

    const validCalls =
      functionCalls
        ?.filter(
          (fc: any): fc is { name: string; args: Record<string, unknown> } =>
            fc?.name !== undefined && fc?.args !== undefined,
        )
        .map((fc: any) => ({ name: fc.name, args: fc.args })) || [];

    const textResponse = candidate.content?.parts
      ?.filter((p: any) => p.text)
      .map((p: any) => p.text)
      .join("");

    let decision: OmniDecision;

    if (validCalls.length > 0 && textResponse) {
      decision = {
        type: "MIXED_RESPONSE",
        toolCalls: validCalls,
        text: textResponse,
        confidence: 0.99,
      };
    } else if (validCalls.length > 0) {
      decision = { type: "TOOL_CALL", toolCalls: validCalls, confidence: 0.99 };
    } else {
      decision = {
        type: "TEXT_RESPONSE",
        text: textResponse || "Standing by.",
        confidence: 0.8,
      };
    }

    console.log(
      "🎯 DECISION:",
      decision.type,
      validCalls.length > 0 ? validCalls[0].name : "",
    );
    return decision;
  } catch (error: unknown) {
    console.error("OMNI Core Error:", error);

    // MODIFICATION D'URGENCE : Affichage de l'erreur réelle au lieu du message "Saturé"
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return {
      type: "TEXT_RESPONSE", // CHANGÉ DE ERROR À TEXT_RESPONSE POUR ÊTRE SÛR QUE JARVIS LE DISE
      text: `⚠️ ALERTE SYSTÈME : ${errorMessage}. (Code: ERR_CORE_FAIL)`,
      confidence: 1.0,
    };
  }
};

export const summarizeToolResults = async (
  toolName: string,
  resultData: unknown,
): Promise<string> => {
  await waitIfNecessary();

  try {
    const prompt =
      "Syntrétise ces résultats de l'outil '" +
      toolName +
      "' pour Monsieur. \n" +
      "DONNÉES: " +
      JSON.stringify(resultData) +
      "\n\nRÈGLES: \n" +
      "- RÉPONDRE TOUJOURS EN FRANÇAIS.\n" +
      "- Être extrêmement concis (1-2 phrases).\n" +
      "- Ne pas lire les adresses email complètes.\n" +
      "- S'adresser à l'utilisateur comme 'Monsieur'.";

    const response = await generateContentWithFallback(
      [{ role: "user", parts: [{ text: prompt }] }],
      { temperature: 0.1 },
    );
    return (
      response.candidates?.[0].content?.parts?.[0].text || "Exécuté, Monsieur."
    );
  } catch (err: unknown) {
    console.error("Erreur summarize:", err);
    return "J'ai les résultats, Monsieur.";
  }
};

export const getQMSAnalysis = async (
  logs: string[],
  taskContext: string,
): Promise<{
  hasSuggestion: boolean;
  tool?: string;
  args?: Record<string, unknown>;
  explanation?: string;
}> => {
  await waitIfNecessary();
  try {
    const prompt =
      "Analyse ces logs système pour proposer une action proactive à Monsieur. \n" +
      "LOGS: " +
      JSON.stringify(logs) +
      "\n" +
      "CONTEXTE: " +
      taskContext +
      "\n\n" +
      "RÉPONDRE UNIQUEMENT EN JSON avec structure: { hasSuggestion: boolean, tool: string, args: object, explanation: string }";

    const response = await generateContentWithFallback(
      [{ role: "user", parts: [{ text: prompt }] }],
      { temperature: 0.1, responseMimeType: "application/json" },
    );
    const text = response.candidates?.[0].content?.parts?.[0].text;
    return text ? JSON.parse(text) : { hasSuggestion: false };
  } catch (err: unknown) {
    /* Silently fail QMS if overloaded */
    return { hasSuggestion: false };
  }
};

export const checkNeuralStatus = () => {
  const now = Date.now();
  const timeSince429 = now - last429Time;
  return {
    isOverloaded: timeSince429 < BREAKER_COOLDOWN,
    remainingCooldown: Math.max(
      0,
      Math.ceil((BREAKER_COOLDOWN - timeSince429) / 1000),
    ),
    lastRequestGap: now - lastRequestTime,
  };
};

export const getNeuralBriefing = async ({
  task,
  logs,
}: {
  task: string;
  logs: string[];
}): Promise<string> => {
  if (checkShield())
    return "Systèmes nominaux, Monsieur. Neural Core en refroidissement.";
  await waitIfNecessary();

  try {
    const prompt =
      "Génère un briefing court basés sur ces logs: " +
      JSON.stringify(logs) +
      "\n" +
      "CONTEXTE: " +
      task;

    const response = await generateContentWithFallback(
      [{ role: "user", parts: [{ text: prompt }] }],
      { temperature: 0.7 },
    );

    return (
      response.candidates?.[0].content?.parts?.[0].text || "Rien à signaler."
    );
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message?.includes("429")) record429();
    return "Briefing indisponible momentanément, Monsieur.";
  }
};
