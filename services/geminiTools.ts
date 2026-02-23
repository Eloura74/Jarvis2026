// ============================================================================
// DÉCLARATIONS DES OUTILS GEMINI (Function Calling)
// ============================================================================
// Ce module centralise toutes les FunctionDeclaration exposées à Gemini.
// Chaque outil correspond à une action que J.A.R.V.I.S. peut déclencher.

import { FunctionDeclaration, Type } from "@google/genai";

/**
 * Liste complète des outils disponibles pour Gemini (function calling).
 * Gemini choisit l'outil approprié selon l'intention de l'utilisateur.
 */
export const toolDeclarations: FunctionDeclaration[] = [
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
    description:
      "Open a search in the browser (Google, YouTube, GitHub). " +
      "Use ONLY when the user explicitly says 'recherche', 'cherche sur Google', 'ouvre YouTube', etc. " +
      "Do NOT use this for 'trouve-moi X', 'montre-moi X', 'X en STL', 'image de X' — use search_results_visual instead.",
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
    name: "search_results_visual",
    description:
      "Show 5 search results visually (title, URL, description, image) in a holographic overlay WITHOUT opening the browser. " +
      "Use this when the user asks to FIND or SEE something without explicitly saying 'recherche': " +
      "'support de téléphone S5 en STL', 'image de X', 'trouve-moi X', 'montre-moi des X', 'fichiers STL de X'. " +
      "Also use for 3D model searches (STL, Thingiverse, Printables) and image lookups.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description:
            "The search query. Be specific, include relevant keywords like 'STL', 'fichier 3D', etc.",
        },
      },
      required: ["query"],
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
    description:
      "Show a holographic status overlay for ANY device, sensor group, or home automation category. " +
      "Use this for: 3D printers (e.g. 'VZ330', 'fleet'), door/security sensors (e.g. 'Portes', 'sécurité', 'capteurs porte'), " +
      "temperature/climate sensors (e.g. 'température', 'climat'), or any specific HA entity. " +
      "ALWAYS call this tool when the user asks about the state, status, or condition of any physical device or sensor.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        target: {
          type: Type.STRING,
          description:
            "What to display. Examples: 'VZ330' (printer), 'fleet' (all printers), " +
            "'Portes' (door sensors), 'sécurité' (security perimeter), " +
            "'température' (climate sensors). Use the most relevant keyword from the user's request.",
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
