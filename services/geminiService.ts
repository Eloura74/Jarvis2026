import { FunctionDeclaration, Type } from "@google/genai";
import { AppMemory } from "../types";
import { OmniDecision } from "../types/app.types";
import {
  generateContentStreamProxy,
  generateSummarizeProxy,
  generateQMSProxy,
  GeminiHistoryEntry,
} from "./geminiProxyClient"; // S1 : Proxy backend — clé API hors bundle JS

// ============================================================================
// CONFIGURATION GEMINI
// ============================================================================
// S1 : La clé API n'est plus utilisée côté client.
// Tous les appels Gemini passent par le backend via /api/gemini/*
// La variable VITE_GEMINI_API_KEY peut être retirée du .env.local frontend.

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
4. **GMAIL**: Keywords: "mails", "emails", "messages", "qui m'a écrit", "boîte mail". Tool: \`gmail_read\`. Always use query="is:unread" by default. After reading, summarize each email: sender + subject.
5. **CALENDRIER**: Keywords: "rendez-vous", "agenda", "calendrier", "planifie", "ajoute", "réunion". Tool: \`calendar_create\` or \`calendar_list\`. For creation, ALWAYS convert the spoken date to ISO 8601 (YYYY-MM-DDTHH:MM:SS). Example: "le 23 février à 9h" → "2026-02-23T09:00:00". For "quel est mon prochain RDV" or "qu'est-ce que j'ai prévu", use \`calendar_next\`.
6. **WHATSAPP**: Keywords: "réponds à", "envoie un message à", "dis à [nom] que", "WhatsApp à". Tool: \`whatsapp_reply\`. If the user provides a message text, include it in the 'message' field. If the user only says who to send to (no message content), call the tool with ONLY the 'to' field and leave 'message' empty — the system will ask for the message content interactively.

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
    description:
      "Read Gmail emails. Use for: lis mes mails, mes derniers emails, qui ma ecrit, mails non lus, analyse mes mails. Default: 5 unread emails. Pass query=is:unread for unread, query empty for all recent.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        maxResults: {
          type: Type.NUMBER,
          description: "Number of emails to fetch (default 5)",
        },
        query: {
          type: Type.STRING,
          description:
            "Gmail search query. Use 'is:unread' for unread emails, '' for all recent. Default: 'is:unread'",
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
    description:
      "List upcoming Google Calendar events. Use for: mes prochains rendez-vous, agenda, evenements prevus, mon planning.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        maxResults: {
          type: Type.NUMBER,
          description: "Number of events to list (default 5)",
        },
      },
    },
  },
  {
    name: "get_weather",
    description:
      "Obtenir la météo (actuelle ou prévisions) pour une localisation donnée.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        city: {
          type: Type.STRING,
          description: "Nom de la ville (ex: 'Paris', 'Marseille'). Optionnel.",
        },
        dateTime: {
          type: Type.STRING,
          description: "Date/heure pour les prévisions. Optionnel.",
        },
        needsForecast: {
          type: Type.BOOLEAN,
          description: "Vrai si l'utilisateur demande des prévisions.",
        },
      },
      required: [],
    },
  },
  {
    name: "calendar_create",
    description:
      "Create a Google Calendar event. Use for: 'ajoute un rendez-vous', 'crée un événement', 'mets dans mon agenda', 'planifie'. IMPORTANT: startTime MUST be a full ISO 8601 datetime string (e.g. '2026-02-23T09:00:00'). The current year is 2026. If only a date is given (e.g. '23 février'), infer the time as 09:00 if not specified. endTime defaults to startTime + 1 hour if not provided.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description: "Event title/name (e.g. 'Rendez-vous médiathèque')",
        },
        startTime: {
          type: Type.STRING,
          description:
            "Start datetime in ISO 8601 format: YYYY-MM-DDTHH:MM:SS (e.g. '2026-02-23T09:00:00')",
        },
        endTime: {
          type: Type.STRING,
          description:
            "End datetime in ISO 8601 format. Optional, defaults to startTime + 1 hour.",
        },
        location: {
          type: Type.STRING,
          description: "Location of the event. Optional.",
        },
        description: {
          type: Type.STRING,
          description: "Additional notes. Optional.",
        },
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
          description:
            "Device name (e.g. 'VZ330'). To show all 3D printers at once, use 'fleet'.",
        },
      },
      required: ["target"],
    },
  },
  {
    name: "close_current_overlay",
    description:
      "FORCE CLOSE any active holographic overlay, popup, fleet view, grid, or modal. MUST be called when user says 'Ferme', 'Close', 'Masque', 'Quitte', 'Enlève'. Works for ALL overlay types (printer, traffic, fleet, etc).",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "activate_ghost_mode",
    description:
      "Activate/Open 'Ghost Mode' (Visual Analysis Protocol). Use when user says 'Active le mode Ghost', 'Ghost Mode', 'Analyse cet objet', 'Regarde ça'.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "whatsapp_reply",
    description:
      "Send a WhatsApp message to a contact. Use when user says 'réponds à [nom]', 'envoie un WhatsApp à [nom]', 'dis à [nom] que...'. The 'to' field must be the contact name as spoken by the user.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        to: {
          type: Type.STRING,
          description:
            "Contact name or phone number (e.g. 'Laura', 'Maman', '33612345678@c.us'). Use the name as spoken by the user.",
        },
        message: {
          type: Type.STRING,
          description: "The message text to send.",
        },
      },
      required: ["to"],
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
  {
    name: "sleep_mode",
    description:
      "Activate or deactivate intelligent sleep mode (Do Not Disturb). Use when user says 'bonne nuit', 'active la veille', 'mode nuit', 'ne pas déranger', 'réveille-moi à [heure]', 'désactive la veille', 'bonjour'. Action 'activate' suspends non-critical notifications and reduces TTS volume. Action 'deactivate' resumes normal operation.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          description:
            "'activate' to enable sleep mode, 'deactivate' to disable it.",
        },
        wake_up_time: {
          type: Type.STRING,
          description:
            "Optional wake-up time in ISO 8601 format (e.g. '2026-02-23T07:00:00'). If not provided, defaults to 8 hours.",
        },
      },
      required: ["action"],
    },
  },
  {
    name: "morning_briefing",
    description:
      "Generate and speak a complete morning briefing: weather, calendar events, unread emails. Use when user says 'briefing du matin', 'résumé de la journée', 'quoi de neuf ce matin', 'donne-moi mon briefing', 'qu'est-ce que j'ai aujourd'hui'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        city: {
          type: Type.STRING,
          description: "City for weather forecast. Default: 'Annecy'.",
        },
      },
    },
  },
  {
    name: "camera_snapshot",
    description:
      "Capture and display a live snapshot from a 3D printer webcam. Use when user says 'montre-moi la caméra de [imprimante]', 'capture la webcam', 'que fait l'imprimante en ce moment visuellement'. The webcam_url must be a local network address.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        webcam_url: {
          type: Type.STRING,
          description:
            "Full webcam URL (e.g. 'http://192.168.1.130/webcam/?action=stream'). Use HA_ENTITIES.PRINTERS webcamUrl values.",
        },
        printer_name: {
          type: Type.STRING,
          description:
            "Human-readable printer name for the overlay title (e.g. 'VZ330').",
        },
      },
      required: ["webcam_url"],
    },
  },
];

// ============================================================================
// DÉTECTION DE COMPLEXITÉ — maxOutputTokens adaptatif (A7)
// ============================================================================

/**
 * Estime le nombre de tokens de sortie approprié selon la nature de la requête.
 * - Requête simple (question directe, météo, heure) → 300 tokens (~3-4 phrases)
 * - Requête complexe (analyse, rapport, liste, résumé) → 600 tokens (~6-8 phrases)
 * - Requête avec tool call probable → undefined (pas de limite, Gemini gère)
 *
 * L'objectif est de réduire les réponses verbales sans jamais tronquer une réponse
 * en cours de construction (le token limit est une limite haute, pas une cible).
 */
const estimateMaxOutputTokens = (input: string): number | undefined => {
  const t = input.toLowerCase();

  // Mots-clés indiquant une réponse potentiellement longue → 600 tokens
  const complexKeywords = [
    "analyse",
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

  // Mots-clés indiquant un tool call probable → pas de limite (Gemini doit construire l'appel)
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
  ];
  if (toolKeywords.some((k) => t.includes(k))) return undefined;

  // Requête simple par défaut → 300 tokens (réponse concise)
  return 300;
};

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

export const summarizeToolResults = async (
  toolName: string,
  resultData: unknown,
): Promise<string> => {
  await waitIfNecessary();

  try {
    // Prompts spécialisés par outil pour une synthèse vocale naturelle
    if (toolName === "gmail_read") {
      const emails = resultData as Array<{
        from: string;
        subject: string;
        date: string;
      }>;
      if (!emails || emails.length === 0) {
        return "Aucun mail non lu, Monsieur.";
      }
      // Construire un résumé direct sans passer par Gemini pour éviter le fallback
      const lines = emails.map((e, i) => {
        // Extraire juste le nom de l'expéditeur (avant le <email>)
        const senderName = e.from
          ? e.from
              .replace(/<[^>]+>/g, "")
              .replace(/"/g, "")
              .trim()
          : "Expéditeur inconnu";
        return `${i + 1}. De ${senderName} : ${e.subject || "sans objet"}`;
      });
      return `Monsieur a ${emails.length} mail${emails.length > 1 ? "s" : ""} non lu${emails.length > 1 ? "s" : ""}. ${lines.join(". ")}.`;
    }

    if (toolName === "calendar_list") {
      const events = resultData as Array<{ summary: string; start: string }>;
      if (!events || events.length === 0) {
        return "Aucun événement à venir dans votre agenda, Monsieur.";
      }
      const lines = events.slice(0, 3).map((e) => {
        const date = new Date(e.start).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        });
        return `${e.summary} le ${date}`;
      });
      return `Voici vos prochains rendez-vous, Monsieur : ${lines.join(", ")}.`;
    }

    if (toolName === "calendar_create") {
      const event = resultData as {
        summary?: string;
        start?: { dateTime?: string };
      };
      const title = event?.summary || "l'événement";
      return `Rendez-vous "${title}" ajouté à votre agenda, Monsieur.`;
    }

    if (toolName === "calendar_next") {
      const result = resultData as {
        summary?: string;
        timeLabel?: string;
        location?: string;
      } | null;
      if (!result || !result.summary) {
        return "Aucun rendez-vous à venir dans votre agenda, Monsieur.";
      }
      const loc = result.location ? `, à ${result.location}` : "";
      return `Votre prochain rendez-vous est "${result.summary}", ${result.timeLabel}${loc}, Monsieur.`;
    }

    if (toolName === "whatsapp_reply") {
      const result = resultData as { message?: string } | null;
      return result?.message || "Message WhatsApp envoyé, Monsieur.";
    }

    if (toolName === "get_weather") {
      const w = resultData as {
        temperature?: number;
        condition?: string;
        city?: string;
        windSpeed?: number;
        humidity?: number;
        precipitation?: number;
      } | null;

      if (!w || w.condition === "Offline") {
        return "Je n'ai pas pu récupérer la météo, Monsieur. Vérifiez votre connexion.";
      }

      const city = w.city || "votre position";
      const temp =
        w.temperature !== undefined
          ? `${w.temperature}°C`
          : "température inconnue";
      const cond = w.condition || "conditions inconnues";
      const wind =
        w.windSpeed !== undefined ? `vent à ${w.windSpeed} km/h` : null;
      const humidity =
        w.humidity !== undefined ? `humidité à ${w.humidity}%` : null;

      // Construire une phrase naturelle et complète
      let response = `Monsieur, à ${city}, il fait actuellement ${temp}, ${cond}.`;
      if (wind && humidity) {
        response += ` ${wind}, ${humidity}.`;
      } else if (wind) {
        response += ` ${wind}.`;
      }
      if (w.precipitation && w.precipitation > 0) {
        response += ` Probabilité de précipitations : ${w.precipitation}%.`;
      }
      return response;
    }

    if (toolName === "get_travel_time") {
      const t = resultData as {
        duration?: string;
        distance?: string;
        destination?: string;
        trafficInfo?: string;
      } | null;
      if (!t) return "Impossible de calculer le trajet, Monsieur.";
      const dest = t.destination ? ` vers ${t.destination}` : "";
      const dur = t.duration || "durée inconnue";
      const dist = t.distance ? `, soit ${t.distance}` : "";
      const traffic = t.trafficInfo ? ` ${t.trafficInfo}.` : ".";
      return `Monsieur, le trajet${dest} prend environ ${dur}${dist}${traffic}`;
    }

    // Prompt générique pour les autres outils — via proxy backend (S1)
    const prompt =
      "Synthétise ces résultats de l'outil '" +
      toolName +
      "' pour Monsieur en 1-2 phrases en français, de façon naturelle et concise.\n" +
      "DONNÉES: " +
      JSON.stringify(resultData).substring(0, 2000) +
      "\nRÈGLES: répondre en français, s'adresser comme 'Monsieur', ne pas lire les emails complets.";

    return await generateSummarizeProxy(prompt);
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

    // Via proxy backend (S1)
    return await generateQMSProxy(prompt);
  } catch {
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

    // Via proxy backend (S1)
    return await generateSummarizeProxy(prompt);
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message?.includes("429")) record429();
    return "Briefing indisponible momentanément, Monsieur.";
  }
};

// ============================================================================
// NO NOUVEAU FLUX DE STREAMING (ASYNC & PARALLEL)
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

    const haContext = await getHAContext();

    // Adapter maxOutputTokens selon la complexité de la requête (A7)
    // undefined = pas de limite (tool calls), 300 = simple, 600 = complexe
    const maxOutputTokens = estimateMaxOutputTokens(input);

    const config = {
      systemInstruction:
        generateSystemInstruction(memSum, conversationContext) + haContext,
      tools: [{ functionDeclarations: toolDeclarations }],
      temperature: 0.1,
      ...(maxOutputTokens !== undefined && { maxOutputTokens }),
    };

    // S1 : Appel via proxy backend (clé API sécurisée côté serveur)
    // Le proxy gère le fallback 2.5-flash → 1.5-flash automatiquement
    // On passe l'historique natif Gemini pour un contexte multi-tours réel
    const responseStream = generateContentStreamProxy(input, {
      systemInstruction: config.systemInstruction as string,
      tools: toolDeclarations,
      temperature: config.temperature as number,
      maxOutputTokens: config.maxOutputTokens as number | undefined,
      history: history.length > 0 ? history : undefined,
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
      "🎯 STREAM DECISION:",
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
