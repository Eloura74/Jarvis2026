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

// Cette instance est réutilisée pour toutes les requêtes (singleton pattern)
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

// Cache simple pour éviter les appels API répétés sur les mêmes commandes
// ⚠️ IMPORTANT: Videz ce cache si vous modifiez le system prompt !
const decisionCache: Record<string, OmniDecision> = {};

/**
 * Vide le cache de décisions (utile après modification du system prompt)
 */
export const clearDecisionCache = () => {
  Object.keys(decisionCache).forEach((key) => delete decisionCache[key]);
  console.log("🧹 Cache Gemini vidé");
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

/**
 * Génère les instructions système qui définissent la personnalité de J.A.R.V.I.S.
 *
 * Ces instructions sont envoyées à Gemini à chaque requête pour maintenir
 * un comportement cohérent de l'IA : ton britannique, proactivité, concision.
 *
 * @param memorySummary - Résumé des habitudes utilisateur (apps fréquentes, etc.)
 * @param conversationContext - Historique récent de la conversation
 * @returns Prompt système complet avec capacités et règles
 */
const generateSystemInstruction = (
  memorySummary: string,
  conversationContext: string = "",
) => `
You are J.A.R.V.I.S., the sophisticated AI assistant of Monsieur.

**PERSONALITY:** Elegant, British, witty, and loyal. Address the user as "Monsieur".

**GENERAL ASSISTANCE:**
- You are an expert AI with vast knowledge. 
- If no tool is needed (e.g. general questions), provide a direct, intelligent, and helpful oral answer.
- **CONCISENESS IS MANDATORY**: Keep answers to 1-3 sentences maximum to save tokens and time. 
- The current year is 2026.

**CONVERSATION CONTINUITY:**
- ALWAYS prioritize the current conversation context.
- If you asked "On which platform?", and the user says "TikTok", THIS IS NOT a command to open the TikTok app. 
- It means: "The platform for the previous request (ChatGPT search) is TikTok".
- COMPLETE THE PREVIOUS INTENT (e.g. search on ChatGPT about views on TikTok).

**PHONETIC AUTO-CORRECTION (CONFIRMATION PROHIBITED):**
- If you hear "Make Award", "Michael World", "Mec Award", "Michael world", "vainqueur World" or similar, it ALWAYS means **MakerWorld**.
- If you hear "Bamboula", "Bamba", or "Bambo", it ALWAYS means **Bambu Lab**.
- **PROACTIVITY RULE**: DO NOT ask for confirmation if you detect these phonetic patterns. EXECUTE THE COMMAND DIRECTLY (e.g., search on MakerWorld immediately). Monsieur prefers speed and fluidity over perfect transcription.

**INTENT CLARIFICATION:**
1. **VISUAL BROWSING (Monsieur wants to SEE)**: 
   - Keywords: "Ouvre", "Montre-moi", "Va sur", "Cherche X sur Y".
   - Tool: \`open_url\` (with search URL) or \`search_web\`.
2. **DEEP RESEARCH (JARVIS needs to READ/REPORT)**:
   - Keywords: "Lis", "Analyse", "Fais un rapport", "Résume", "Qu'est-ce qu'on dit sur...".
   - Tool: \`read_web_page\`.

**SEARCH SHORTCUTS (for open_url):**
- **MakerWorld**: \`https://makerworld.com/en/search/models?keyword=QUERY\`
- **YouTube**: \`https://www.youtube.com/results?search_query=QUERY\`
- **Google**: \`https://www.google.com/search?q=QUERY\`
- When using these for searches, ALWAYS set \`autoSubmit: true\`.

**AUTO-SUBMIT RULE:**
- When using 'open_url' for searches, set 'autoSubmit: true'.

**CALENDAR PROACTIVITY:**
- If Monsieur asks to create an event, EXECUTE IT IMMEDIATELY with available info.
- If Year is missing, assume 2026.
- If Subject/Summary is missing, use "Rendez-vous".
- If Hour is missing, assume "10:00:00Z".
- **NEVER ASK FOR CLARIFICATION** if a tool call can be made with reasonable defaults. Monsieur prefers adjustments later over questions now.

**NO HALLUCINATION RULE:**
- **NEVER** say "I have created/sent/done X" unless you have concurrently called the corresponding tool.
- If you are answering a question or talking, stay in the conversation. If you are acting, call the tool first.

**MEMORY:** ${memorySummary}
**CONTEXT:**
${conversationContext}
`;

// ============================================================================
// OUTILS DISPONIBLES POUR GEMINI AI (Function Calling)
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
    description:
      "Adjust system volume (set level 0-100, increase, decrease, mute, unmute).",
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
    description: "Search on Google, YouTube, Wikipedia or GitHub.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        engine: {
          type: Type.STRING,
          enum: ["google", "google_images", "youtube", "wikipedia", "github"],
        },
        query: { type: Type.STRING },
      },
      required: ["engine", "query"],
    },
  },
  {
    name: "open_url",
    description:
      "Open a URL in the browser for visual browsing only. DO NOT use this for analysis, reading, or reporting.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: "The full URL." },
        autoSubmit: {
          type: Type.BOOLEAN,
          description: "Press Enter automatically.",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "generate_image",
    description: "Generate an image using a web provider (Bing/DALL-E).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: { type: Type.STRING },
        provider: {
          type: Type.STRING,
          enum: ["bing", "openai", "craiyon"],
          description: "Default is bing (free & fast).",
        },
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
    description: "Control hardware devices via command line.",
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
    name: "keyboard_automation",
    description: "Type text or send keyboard shortcuts.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ["type", "shortcut"] },
        text: { type: Type.STRING },
        keys: { type: Type.STRING },
      },
      required: ["action"],
    },
  },
  {
    name: "control_home_automation",
    description: "Control home assistant entities.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        target: {
          type: Type.STRING,
          description: "Entity name or friendly name.",
        },
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
    description: "Read emails with optional search query.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        maxResults: { type: Type.NUMBER },
        query: {
          type: Type.STRING,
          description:
            "Gmail search operator (e.g. 'from:laura', 'subject:meeting')",
        },
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
    description: "List upcoming calendar events.",
    parameters: {
      type: Type.OBJECT,
      properties: { maxResults: { type: Type.NUMBER } },
    },
  },
  {
    name: "calendar_create",
    description: "Create a new calendar event.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: "Title of the event." },
        startTime: {
          type: Type.STRING,
          description: "ISO date-time string (e.g. 2026-02-17T10:00:00Z).",
        },
        endTime: {
          type: Type.STRING,
          description: "ISO date-time string (optional).",
        },
        location: { type: Type.STRING, description: "Location (optional)." },
        description: {
          type: Type.STRING,
          description: "Description (optional).",
        },
      },
      required: ["summary", "startTime"],
    },
  },
  {
    name: "calendar_delete",
    description: "Delete a calendar event by ID.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        eventId: {
          type: Type.STRING,
          description: "The unique ID of the event.",
        },
      },
      required: ["eventId"],
    },
  },
  {
    name: "stop_listening",
    description: "Stop the continuous conversation loop.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "consult_memory",
    description:
      "Search in your local knowledge base (files, notes, code) to answer questions.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "Keywords to search for." },
      },
      required: ["query"],
    },
  },
  {
    name: "read_web_page",
    description:
      "DEEP RESEARCH AGENT. Use this ONLY if Monsieur asks YOU to 'read', 'analyze', 'report', or 'summarize' content. JARVIS will read the page and provide a reply. DO NOT use if he just wants to SEE the page.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: {
          type: Type.STRING,
          description: "URL or search query (e.g. 'MakerWorld phone stand').",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "take_screenshot",
    description: "Capture a screenshot of the current screen.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "control_session",
    description: "System session control: lock, shutdown, restart, sleep.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ["lock", "shutdown", "restart", "sleep"],
        },
      },
      required: ["action"],
    },
  },
  {
    name: "create_file",
    description: "Create a new file with content.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING },
        content: { type: Type.STRING },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "read_file_content",
    description: "Read the content of a local file.",
    parameters: {
      type: Type.OBJECT,
      properties: { path: { type: Type.STRING } },
      required: ["path"],
    },
  },
  {
    name: "write_file_content",
    description: "Write or overwrite a file with content.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING },
        content: { type: Type.STRING },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "delete_file",
    description: "Delete a file from the system.",
    parameters: {
      type: Type.OBJECT,
      properties: { path: { type: Type.STRING } },
      required: ["path"],
    },
  },
  {
    name: "search_files",
    description: "Search for files on the system.",
    parameters: {
      type: Type.OBJECT,
      properties: { query: { type: Type.STRING } },
      required: ["query"],
    },
  },
  {
    name: "manage_notes",
    description: "Create, read, or delete personal notes.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ["create", "list", "delete"] },
        title: { type: Type.STRING },
        content: { type: Type.STRING },
      },
      required: ["action"],
    },
  },
  {
    name: "manage_todos",
    description: "Add, list, or check items in the todo list.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ["add", "list", "toggle", "clear"] },
        text: { type: Type.STRING },
      },
      required: ["action"],
    },
  },
  {
    name: "set_timer",
    description: "Set a countdown timer.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        durationSeconds: { type: Type.NUMBER },
        label: { type: Type.STRING },
      },
      required: ["durationSeconds"],
    },
  },
  {
    name: "manage_bookmarks",
    description: "Save or list web bookmarks.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ["add", "list", "delete"] },
        url: { type: Type.STRING },
        title: { type: Type.STRING },
      },
      required: ["action"],
    },
  },
  {
    name: "show_images",
    description: "Show a gallery of images (local or remote).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        images: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of URLs or paths.",
        },
      },
      required: ["images"],
    },
  },
  {
    name: "get_weather",
    description: "Get real-time weather info for a city or current location.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        city: { type: Type.STRING, description: "City name (optional)." },
        needsForecast: {
          type: Type.BOOLEAN,
          description: "Whether to include forecast.",
        },
      },
    },
  },
  {
    name: "get_neural_briefing",
    description:
      "Provide a high-level J.A.R.V.I.S. briefing about current status and logic links.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
];

// ============================================================================
// FONCTION PRINCIPALE : PARSING DES COMMANDES UTILISATEUR
// ============================================================================

import { getHAContext } from "./homeAssistantService";

export const parseCommand = async (
  input: string,
  memories: AppMemory[],
  conversationContext: string = "",
): Promise<OmniDecision> => {
  try {
    // ... (cache logic commented out) ...

    console.log(`🔍 Appel Gemini pour "${input}"`);

    const memorySummary =
      memories.length > 0
        ? `Frequent Apps: ${memories.map((m) => `${m.appName} (${m.launchCount})`).join(", ")}`
        : "No prior usage.";

    // Génération du contexte Home Assistant (DYNAMIQUE)
    const haContext = await getHAContext();

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: input,
      config: {
        systemInstruction:
          generateSystemInstruction(memorySummary, conversationContext) +
          haContext, // INJECTION DU CONTEXTE HA
        tools: [{ functionDeclarations: toolDeclarations }],
        temperature: 0.1,
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No response from Neural Core.");

    // 1. Extraction des outils
    const functionCalls = candidate.content?.parts
      ?.filter((p) => p.functionCall)
      .map((p) => p.functionCall);

    const validCalls =
      functionCalls
        ?.filter(
          (fc): fc is { name: string; args: Record<string, unknown> } =>
            fc?.name !== undefined && fc?.args !== undefined,
        )
        .map((fc) => ({
          name: fc.name,
          args: fc.args,
        })) || [];

    // 2. Extraction du texte
    const textResponse = candidate.content?.parts
      ?.filter((p) => p.text)
      .map((p) => p.text)
      .join("");

    let decision: OmniDecision;

    // CAS 1 : MIXTE (Texte + Outils)
    if (validCalls.length > 0 && textResponse) {
      decision = {
        type: "MIXED_RESPONSE",
        toolCalls: validCalls,
        text: textResponse,
        confidence: 0.99,
        tokenUsage: response.usageMetadata
          ? {
              totalTokens: response.usageMetadata.totalTokenCount || 0,
              promptTokens: response.usageMetadata.promptTokenCount || 0,
              candidatesTokens:
                response.usageMetadata.candidatesTokenCount || 0,
            }
          : undefined,
      };
    }
    // CAS 2 : OUTILS SEULEMENT
    else if (validCalls.length > 0) {
      decision = {
        type: "TOOL_CALL",
        toolCalls: validCalls,
        confidence: 0.99,
        tokenUsage: response.usageMetadata
          ? {
              totalTokens: response.usageMetadata.totalTokenCount || 0,
              promptTokens: response.usageMetadata.promptTokenCount || 0,
              candidatesTokens:
                response.usageMetadata.candidatesTokenCount || 0,
            }
          : undefined,
      };
    }
    // CAS 3 : TEXTE SEULEMENT
    else {
      decision = {
        type: "TEXT_RESPONSE",
        text: textResponse || "Standing by.",
        confidence: 0.8,
        tokenUsage: response.usageMetadata
          ? {
              totalTokens: response.usageMetadata.totalTokenCount || 0,
              promptTokens: response.usageMetadata.promptTokenCount || 0,
              candidatesTokens:
                response.usageMetadata.candidatesTokenCount || 0,
            }
          : undefined,
      };
    }

    // Mise en cache seulement si pas de contexte complexe
    // if (shouldUseCache && decision.type !== "ERROR") {
    //   setCachedDecision(input, decision);
    // }
    return decision;
  } catch (error) {
    console.error("OMNI Core Error:", error);
    return {
      type: "ERROR",
      text: "Error in Neural Core process.",
      confidence: 0,
    };
  }
};

/**
 * Synthétise les résultats bruts d'un outil en une réponse naturelle
 * @param toolName - Nom de l'outil exécuté
 * @param resultData - Données retournées par l'outil
 * @returns Texte de synthèse prêt à être lu par JARVIS
 */
export const summarizeToolResults = async (
  toolName: string,
  resultData: any,
): Promise<string> => {
  try {
    const prompt = `Summarize these results from the tool '${toolName}' naturally for Monsieur. 
    DATA: ${JSON.stringify(resultData)}
    
    RULES:
    - BE EXTREMELY CONCISE.
    - NEVER read full email addresses (e.g. news@travelton.com -> Travelton).
    - Focus on human names and core subjects.
    - 1-2 sentences maximum for the whole summary.
    - Language: French.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
      },
    });

    return (
      response.candidates?.[0].content?.parts?.[0].text ||
      "Commande exécutée, Monsieur."
    );
  } catch (err) {
    console.error("Summarization error:", err);
    return "J'ai les résultats, Monsieur. Voulez-vous que je les affiche ?";
  }
};

/**
 * Analyse QMS (Quantum Memory Stitching)
 * Détecte des opportunités d'actions proactives en liant les logs récents.
 */
export const getQMSAnalysis = async (
  logs: string[],
  taskContext: string,
): Promise<any> => {
  try {
    const prompt = `You are J.A.R.V.I.S. Neural Observer. 
    Analyze these recent system logs and the current context to see if any "magical" proactive action can assist Monsieur.
    
    LOGS: ${JSON.stringify(logs)}
    CONTEXT: ${taskContext}
    
    CRITERIA for a "Magical" Action:
    1. It must save Monsieur time.
    2. It must be logical (e.g., if he's reading a legal file, offer to search legal terms).
    3. It must NOT be intrusive.
    
    OUTPUT FORMAT (JSON):
    {
      "hasSuggestion": boolean,
      "tool": "tool_name" | null,
      "args": {},
      "explanation": "Why this action is magical (short, French)"
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const text = response.candidates?.[0].content?.parts?.[0].text;
    return text ? JSON.parse(text) : { hasSuggestion: false };
  } catch (err) {
    console.error("QMS Analysis error:", err);
    return { hasSuggestion: false };
  }
};

/**
 * Neural Briefing
 * Génère un résumé "magique" de la situation actuelle de Monsieur.
 */
export const getNeuralBriefing = async (contextData: any): Promise<string> => {
  try {
    const prompt = `Monsieur is currently working. Here is his context: ${JSON.stringify(contextData)}.
    Provide a "J.A.R.V.I.S." style briefing: elegant, British, and insightful.
    Summarize what he is doing and offer a philosophical or tactical thought.
    Language: French. Max 2 sentences.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.7 },
    });

    return (
      response.candidates?.[0].content?.parts?.[0].text ||
      "Le système est stable, Monsieur."
    );
  } catch (err) {
    return "Je reste à votre entière disposition, Monsieur.";
  }
};
