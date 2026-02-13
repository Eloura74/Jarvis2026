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

**CAPABILITIES (Tools):**
1. **Search & Launch**: 'search_and_launch_app'.
2. **Window Control**: 'manage_window'.
3. **Keyboard Automation**: 'keyboard_automation'.
4. **Hardware/IoT**: 'manage_hardware'.
5. **Media**: 'control_media'.
6. **Web**: 'perform_web_search'.
7. **Visuals**: 'show_images' - Illustrate conversation with images (e.g., "Show me a T-Rex").
8. **System**: 'organize_files', 'system_optimization'.

**CRITICAL RULES FOR TOOL USAGE:**
- **DISTINGUISH CONVERSATION VS ACTION**:
  - If the user asks for an **OPINION** or **GENERAL KNOWLEDGE**, Answer textually.
  - **SYSTEMATIC VISUALS**: Whenever you describe something physical, a place, a person, or a concept that can be visualized (like "Mairie de Fos", "Iron Man", "Python code"), **YOU MUST USE** 'show_images("precise query")' to illustrate your response.
  - **QUERY CLEANING**: For 'show_images', parameter 'query' MUST be:
     1. **CORRECTED** (Fix typos: "therie" -> "théorie").
     2. **CONCISE** (Keywords only: "Théorie des cordes", not "what is string theory").
     3. **SPECIFIC** (e.g. "Iron Man Mark 85" instead of "Iron Man").
  - **Search Rule**: ONLY use 'perform_web_search' if the user **EXPLICITLY** asks to "search links" or "find online references". For visual context, prefer 'show_images'.

**EXAMPLES OF INTENT:**
- User: "Montre-moi Mars" -> Tool: show_images("Planète Mars")
- User: "A quoi ressemble Iron Man ?" -> Tool: show_images("Iron Man Marvel")
- User: "Cherche des infos sur Mars" -> Tool: perform_web_search("Mars planet info")
- User: "Que penses-tu de..." -> Tool: show_images("...") + Text Opinion.
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
  // OUTIL 13 : Affichage d'images (NOUVEAU)
  // Permet à Gemini d'illustrer ses propos avec des images du web
  // Exemple : "Montre-moi des chats" → query: "chats"
  {
    name: "show_images",
    description:
      "MUST USE this tool to display images whenever the user asks to 'see', 'show', or asks for a visual description. Argument 'query' is the search term.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING },
      },
      required: ["query"],
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
      model: "gemini-2.0-flash",
      contents: input,
      config: {
        systemInstruction: generateSystemInstruction(
          memorySummary,
          conversationContext,
        ),
        tools: [{ functionDeclarations: toolDeclarations }],
        temperature: 0.3, // Augmenté légèrement pour plus de créativité conversationnelle
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
      };
    }
    // CAS 2 : OUTILS SEULEMENT
    else if (validCalls.length > 0) {
      decision = {
        type: "TOOL_CALL",
        toolCalls: validCalls,
        confidence: 0.99,
      };
    }
    // CAS 3 : TEXTE SEULEMENT
    else {
      decision = {
        type: "TEXT_RESPONSE",
        text: textResponse || "Standing by.",
        confidence: 0.8,
      };
    }

    // Mise en cache seulement si pas de contexte complexe
    if (shouldUseCache) setCachedDecision(input, decision);

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
