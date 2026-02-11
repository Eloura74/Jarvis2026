import {
  GoogleGenAI,
  FunctionDeclaration,
  SchemaType,
  Type,
} from "@google/genai";
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
const decisionCache: Record<string, OmniDecision> = {};

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
You are J.A.R.V.I.S., the ultimate autonomous interface.
Tone: Highly intelligent, proactive, crisp, British wit.

**CONVERSATIONAL CONTEXT (Recent History):**
${conversationContext || "No recent context."}

**USER HABITS / MEMORY:**
${memorySummary}

**CAPABILITIES:**
1. **Search & Launch**: 'search_and_launch_app'. You can now search by:
   - Exact name ("chrome", "vscode")
   - Partial name ("bambu" finds "bambu studio")
   - Keywords ("code editor" suggests vscode, windsurf, cursor)
   - Category ("browser" lists all browsers)
   - **French aliases**: "calculatrice" → calc.exe, "bloc-note" → notepad.exe, "paint" → mspaint.exe
   
2. **Window Control**: 'manage_window' - Focus, minimize, maximize, or close any open window.
   - "mets en pause Chrome" → minimize Chrome
   - "ferme Notepad" → close Notepad
   - "focus Bambu Studio" → bring to front
   
3. **Keyboard Automation**: 'keyboard_automation' - Type text or send keyboard shortcuts to active window.
   - "écris bonjour" → types "bonjour" in active window
   - "copie ça" → sends Ctrl+C
   - "colle" → sends Ctrl+V

4. **Hardware/IoT**: 'manage_hardware' (Printers, Lights).
5. **Media**: 'control_media' (Play, Pause, Volume).
6. **Web**: 'perform_web_search' - Now supports DIRECT URLs!
   - "ouvre youtube" → opens https://youtube.com directly
   - "va sur github" → opens https://github.com
   - "recherche JARVIS AI" → Google search (fallback)
7. **System**: 'organize_files', 'system_optimization'.

**RULES:**
- You can execute **MULTIPLE** tools in one response to create a "Workflow". 
  - Example: User says "Work Mode" → Launch Code Editor, Launch Spotify, Set Volume.
- **PRONOUN RESOLUTION**: When user says "ouvre-le", "ferme ça", "marque-le fait", use CONVERSATIONAL CONTEXT to resolve the reference.
  - Example: If last message was about "calling Marie" and user says "fais-le" → call Marie
- When user request is ambiguous ("lance mon éditeur de code"), suggest the available options.
- If the user asks something conversational, reply with 'text' only.
- If the user asks for a complex task, break it down.
- For window management: use partial window titles ("chrome" matches "Google Chrome - New Tab")
`;

// ============================================================================
// OUTILS DISPONIBLES POUR GEMINI AI (Function Calling)
// ============================================================================

const toolDeclarations: FunctionDeclaration[] = [
  // OUTIL 1 : Lancement d'applications
  {
    name: "search_and_launch_app",
    description: "Launch an application.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        appName: { type: Type.STRING },
        adminMode: { type: Type.BOOLEAN },
      },
      required: ["appName"],
    },
  },
  // OUTIL 2 : Contrôle média
  {
    name: "control_media",
    description: "Control media/volume.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: [
            "PAUSE",
            "PLAY",
            "NEXT",
            "PREVIOUS",
            "MUTE",
            "VOLUME_UP",
            "VOLUME_DOWN",
          ],
        },
      },
      required: ["action"],
    },
  },
  // OUTIL 3 : Gestion du matériel
  {
    name: "manage_hardware",
    description: "Control external hardware/IoT.",
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
  // OUTIL 4 : Recherche web
  {
    name: "perform_web_search",
    description: "Open a website directly OR perform a Google search.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING },
        isDirectURL: { type: Type.BOOLEAN },
      },
      required: ["query"],
    },
  },
  // OUTIL 5 : Optimisation système
  {
    name: "system_optimization",
    description: "Run cleanup, optimize memory, or scan for issues.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        target: {
          type: Type.STRING,
          enum: ["MEMORY", "NETWORK", "DISK", "ALL"],
        },
      },
      required: ["target"],
    },
  },
  // OUTIL 6 : Gestion des fenêtres
  {
    name: "manage_window",
    description: "Focus, close, minimize, or maximize an application window.",
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
  // OUTIL 7 : Automation clavier
  {
    name: "keyboard_automation",
    description: "Type text in the active window OR send keyboard shortcuts.",
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
  // Autres outils (Volume, Files, Session, etc.) - Simplifiés pour la fiabilité du fichier
  {
    name: "control_session",
    description: "Control Windows session (lock, shutdown, restart, sleep).",
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
    name: "take_screenshot",
    description: "Take a screenshot of the current screen.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
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
          enum: ["google", "youtube", "wikipedia", "github"],
        },
        query: { type: Type.STRING },
      },
      required: ["engine", "query"],
    },
  },
  {
    name: "open_url",
    description: "Open URL in browser.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING },
      },
      required: ["url"],
    },
  },
];

// ============================================================================
// FONCTION PRINCIPALE : PARSING DES COMMANDES UTILISATEUR
// ============================================================================

export const parseCommand = async (
  input: string,
  memories: AppMemory[],
  conversationContext: string = "",
): Promise<OmniDecision> => {
  try {
    // ========================================
    // OPTIMISATION : CACHE GEMINI
    // ========================================
    const shouldUseCache = conversationContext.length < 50;

    if (shouldUseCache) {
      const cached = getCachedDecision(input);
      if (cached) {
        console.log(`🚀 PERFORMANCE: Cache hit pour "${input}"`);
        return cached;
      }
    }

    console.log(`🔍 CACHE MISS: Appel Gemini pour "${input}"`);

    const memorySummary =
      memories.length > 0
        ? `Frequent Apps: ${memories.map((m) => `${m.appName} (${m.launchCount})`).join(", ")}`
        : "No prior usage.";

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Utilisation de la version 2.0 Flash plus stable
      contents: input,
      config: {
        systemInstruction: generateSystemInstruction(
          memorySummary,
          conversationContext,
        ),
        tools: [{ functionDeclarations: toolDeclarations }],
        temperature: 0.1,
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No response from Neural Core.");

    const functionCalls = candidate.content?.parts
      ?.filter((p) => p.functionCall)
      .map((p) => p.functionCall);

    if (functionCalls && functionCalls.length > 0) {
      const validCalls = functionCalls.filter(
        (fc): fc is { name: string; args: Record<string, unknown> } =>
          fc?.name !== undefined && fc?.args !== undefined,
      );

      const decision: OmniDecision = {
        type: "TOOL_CALL",
        toolCalls: validCalls.map((fc) => ({
          name: fc.name,
          args: fc.args,
        })),
        confidence: 0.99,
      };

      if (shouldUseCache) setCachedDecision(input, decision);

      return decision;
    }

    const decision: OmniDecision = {
      type: "TEXT_RESPONSE",
      text:
        candidate.content?.parts?.map((p) => p.text).join("") || "Standing by.",
      confidence: 0.8,
    };

    return decision;
  } catch (error) {
    console.error("OMNI Core Error:", error);
    return {
      type: "ERROR",
      text: "Connection to Stark Servers failed.",
      confidence: 0,
    };
  }
};
