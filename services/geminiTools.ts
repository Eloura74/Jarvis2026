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
    description:
      "🚀 MANDATORY TOOL FOR ALL APPLICATION LAUNCH COMMANDS. " +
      "ALWAYS USE THIS when user says: 'ouvre X', 'lance X', 'démarre X', 'open X', 'launch X', 'start X'. " +
      "Examples: 'ouvre Chrome' → appName='Chrome', 'lance Spotify' → appName='Spotify', 'démarre Word' → appName='Word'. " +
      "For browsers with URL: 'ouvre Chrome sur YouTube' → appName='Chrome', url='https://youtube.com'. " +
      "DO NOT respond with text, CALL THIS TOOL IMMEDIATELY for any launch/open command.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        appName: {
          type: Type.STRING,
          description:
            "REQUIRED: The application name to launch. Examples: 'Chrome', 'Firefox', 'Spotify', 'Word', 'Excel', 'Code', 'Discord', etc.",
        },
        url: {
          type: Type.STRING,
          description:
            "OPTIONAL: URL to open in the browser. Only for browsers like Chrome, Firefox, Edge, Opera.",
        },
      },
      required: ["appName"],
    },
  },
  {
    name: "manage_window",
    description:
      "Control application windows (close, minimize, maximize, focus). " +
      "CRITICAL: appName is MANDATORY and must be the application name. " +
      "Examples: 'Chrome', 'Opera', 'Firefox', 'Code', 'Spotify'. " +
      "For 'ferme Opera' → appName='Opera', action='close'. " +
      "For 'minimise Chrome' → appName='Chrome', action='minimize'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        appName: {
          type: Type.STRING,
          description:
            "REQUIRED: The application name to control. Examples: 'Opera', 'Chrome', 'Firefox', 'Code', 'Spotify'. This is the name of the application window to close/minimize/maximize.",
        },
        action: {
          type: Type.STRING,
          enum: ["focus", "close", "minimize", "maximize"],
          description: "The action to perform on the window.",
        },
      },
      required: ["appName", "action"],
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
      "ALWAYS USE THIS when user explicitly says 'recherche sur Google', 'recherche sur YouTube', 'cherche sur Google', 'ouvre Google et cherche', 'fais une recherche Google'. " +
      "Opens a search in the browser (Google, YouTube, GitHub) in a NEW TAB. " +
      "MANDATORY for: 'recherche sur Google X', 'recherche web X', 'cherche sur Google X', 'ouvre YouTube et cherche X', 'recherche GitHub X'. " +
      "DO NOT use this for 'montre-moi X', 'trouve-moi X', 'affiche X' — use search_results_visual instead for those.",
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
    name: "show_search_results",
    description:
      "CRITICAL MANDATORY TOOL: Use THIS tool when user says 'montre-moi', 'affiche', 'trouve' + any object/file (STL, 3D, images, etc). " +
      "Shows 5 visual search results in holographic overlay. NEVER open browser for these requests. " +
      "Examples: 'montre-moi fichiers STL support téléphone' → call show_search_results with query='support téléphone STL'. " +
      "'affiche images de chat' → call show_search_results with query='chat'. " +
      "DO NOT respond with text - ALWAYS call this tool for 'montre-moi' requests.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description:
            "Search query with keywords like 'STL', 'fichier 3D', etc.",
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
    description:
      "MANDATORY TOOL: Use THIS tool when the user asks you to 'look at', 'read', 'check', 'analyze' something on their screen, or asks 'what is wrong with my code', 'what's on my screen', 'read this'. This tool captures a screenshot of their actual Windows desktop/code/software and analyzes it using Gemini Vision. Do NOT try to answer blindly if they refer to their screen/code.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ["general", "ocr", "code", "ui", "error"],
        },
        prompt: {
          type: Type.STRING,
          description:
            "Optional custom prompt to guide the vision analysis. e.g: 'Trouve l'erreur de syntaxe dans le composant React'",
        },
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
  {
    name: "outdoor_temperature",
    description:
      "Get current outdoor temperature and weather conditions via OpenWeatherMap. Use when user says 'quelle température fait-il', 'météo extérieure', 'il fait combien dehors', 'température à [ville]'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        city: {
          type: Type.STRING,
          description:
            "City name for weather query. Default: 'Istres,FR'. Format: 'CityName,CountryCode'.",
        },
      },
    },
  },
  {
    name: "pool_temperature",
    description:
      "Get swimming pool temperature from Tuya sensor. Use when user says 'température piscine', 'quelle est la température de la piscine', 'est-ce que l'eau est bonne'.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "system_temperatures",
    description:
      "Get PC and NAS system temperatures (CPU, GPU, disks). Use when user says 'température PC', 'température NAS', 'température système', 'monitoring températures', 'est-ce que le PC chauffe'.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "get_directions",
    description:
      "Calculate travel time between two addresses with real-time traffic using Google Maps. Use when user says 'combien de temps pour aller à [destination]', 'temps de trajet vers [lieu]', 'il y a du trafic pour aller à [destination]', 'durée trajet [origine] vers [destination]'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        origin: {
          type: Type.STRING,
          description:
            "Starting address (e.g. 'Istres, France', 'home', 'current location'). If user says 'pour aller à X' without origin, use 'Istres, France' as default.",
        },
        destination: {
          type: Type.STRING,
          description:
            "Destination address (e.g. 'Marseille, France', 'work', 'airport').",
        },
        mode: {
          type: Type.STRING,
          description:
            "Travel mode: 'driving' (default), 'walking', 'bicycling', 'transit'.",
        },
      },
      required: ["destination"],
    },
  },
  {
    name: "printer_camera",
    description:
      "Display live camera feed from a 3D printer. Use when user says 'montre-moi la caméra de [imprimante]', 'affiche la webcam [imprimante]', 'que fait [imprimante] en ce moment', 'caméra A1/VZ330/P1S'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        printer_name: {
          type: Type.STRING,
          description: "Printer name: 'VZ330', 'P1S', or 'A1'.",
        },
        webcam_url: {
          type: Type.STRING,
          description:
            "Optional webcam URL. If not provided, will use default URL for printer.",
        },
      },
      required: ["printer_name"],
    },
  },
  {
    name: "printer_status",
    description:
      "Get status of 3D printers (printing, idle, progress, time remaining). Use when user says 'statut imprimantes', 'est-ce que [imprimante] imprime', 'où en est l'impression', 'combien de temps reste-t-il'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        printer_name: {
          type: Type.STRING,
          description:
            "Optional specific printer name ('VZ330', 'P1S', 'A1'). If not provided, returns status of all printers.",
        },
      },
    },
  },
  {
    name: "analyze_gcode",
    description:
      "Analyze G-code file to estimate print time, filament weight, and cost. Use when user says 'analyse ce G-code', 'combien de temps pour imprimer [fichier]', 'combien ça coûte d'imprimer [fichier]'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        file_path: {
          type: Type.STRING,
          description:
            "Full path to G-code file (e.g. 'C:/Users/faber/Downloads/model.gcode').",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "send_phone_notification",
    description:
      "Send a push notification to Android smartphone via KDE Connect. Use when user says 'envoie une notification sur mon téléphone', 'notifie-moi sur mon portable', 'rappelle-moi sur mon téléphone [message]'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "Notification title (e.g. 'Jarvis Reminder', 'Alert').",
        },
        message: {
          type: Type.STRING,
          description: "Notification message content.",
        },
      },
      required: ["title", "message"],
    },
  },
  {
    name: "make_phone_call",
    description:
      "Make a phone call from Android smartphone via KDE Connect. Use when user says 'appelle [nom/numéro]', 'téléphone à [contact]', 'passe-moi [nom] au téléphone'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        phone_number: {
          type: Type.STRING,
          description:
            "Phone number to call (e.g. '0612345678', '+33612345678').",
        },
        contact_name: {
          type: Type.STRING,
          description:
            "Optional contact name for voice feedback (e.g. 'Maman', 'Pierre').",
        },
      },
      required: ["phone_number"],
    },
  },
  {
    name: "send_sms",
    description:
      "Send SMS from Android smartphone via KDE Connect. Use when user says 'envoie un SMS à [contact]', 'envoie un message à [nom] : [texte]', 'SMS [numéro] : [message]'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        phone_number: {
          type: Type.STRING,
          description: "Phone number to send SMS to (e.g. '0612345678').",
        },
        message: {
          type: Type.STRING,
          description: "SMS message content.",
        },
        contact_name: {
          type: Type.STRING,
          description: "Optional contact name for voice feedback.",
        },
      },
      required: ["phone_number", "message"],
    },
  },
  {
    name: "phone_battery",
    description:
      "Get Android smartphone battery level via KDE Connect. Use when user says 'batterie téléphone', 'niveau batterie portable', 'combien de batterie sur mon téléphone'.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "storage_status",
    description:
      "Get TrueNAS storage pools status (space used, available, health). Use when user says 'statut stockage', 'espace disque NAS', 'combien de place sur le NAS', 'état pools TrueNAS'.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "disk_health",
    description:
      "Get TrueNAS disks health (SMART status, temperatures). Use when user says 'santé disques NAS', 'température disques', 'état SMART', 'disques TrueNAS'.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "truenas_services",
    description:
      "Get TrueNAS services status (SMB, NFS, etc.). Use when user says 'services TrueNAS', 'services NAS actifs', 'état services stockage'.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "calendar_move",
    description:
      "Move/reschedule a calendar event to a new time. Use when user says 'déplace mon RDV de 14h à 16h', 'change l'heure de mon rendez-vous', 'repousse ma réunion à demain'. Checks for scheduling conflicts automatically.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        eventId: {
          type: Type.STRING,
          description:
            "Event ID to move. Get this from calendar_next or calendar_list first.",
        },
        newStartTime: {
          type: Type.STRING,
          description:
            "New start time in ISO 8601 format (e.g. '2026-02-24T16:00:00').",
        },
        newEndTime: {
          type: Type.STRING,
          description:
            "Optional new end time. If not provided, keeps same duration as original event.",
        },
      },
      required: ["eventId", "newStartTime"],
    },
  },
  {
    name: "move_window_to_screen",
    description:
      "Move a window to a specific screen in multi-monitor setup. Use when user says 'déplace Chrome sur écran 2', 'mets Firefox sur mon deuxième écran', 'envoie cette fenêtre sur l'écran de gauche'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        appName: {
          type: Type.STRING,
          description:
            "Name of the application window to move (e.g. 'Chrome', 'Firefox', 'VSCode').",
        },
        screenNumber: {
          type: Type.NUMBER,
          description: "Screen number (1 = primary, 2 = secondary, etc.).",
        },
      },
      required: ["appName", "screenNumber"],
    },
  },
  {
    name: "list_processes",
    description:
      "List active processes with CPU/RAM usage (task manager). Use when user says 'quels processus consomment le plus', 'gestionnaire de tâches', 'montre-moi les processus gourmands', 'utilisation CPU'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sortBy: {
          type: Type.STRING,
          description: "Sort by 'cpu' or 'memory'. Default: 'cpu'.",
        },
        limit: {
          type: Type.NUMBER,
          description: "Number of processes to return. Default: 10.",
        },
      },
    },
  },
  {
    name: "kill_process",
    description:
      "Terminate a process by name. Use when user says 'ferme le processus Chrome', 'tue le processus bloqué', 'arrête Firefox en force'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        processName: {
          type: Type.STRING,
          description: "Process name to terminate (without .exe extension).",
        },
        force: {
          type: Type.BOOLEAN,
          description: "Force kill if process doesn't respond. Default: false.",
        },
      },
      required: ["processName"],
    },
  },
  {
    name: "volume_control",
    description:
      "Control system volume (set level, mute, unmute). Use when user says 'mets le volume à 50', 'coupe le son', 'rétablis l'audio', 'volume à 80%'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          description:
            "Action: 'set' (change level), 'mute' (mute audio), 'unmute' (restore audio).",
        },
        level: {
          type: Type.NUMBER,
          description: "Volume level 0-100. Required only for action 'set'.",
        },
      },
      required: ["action"],
    },
  },
  {
    name: "get_volume",
    description:
      "Get current system volume level and mute status. Use when user says 'quel est le volume', 'volume actuel', 'le son est coupé ?'.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "security_status",
    description:
      "Get security system status (doors, windows, motion sensors, alarm state). Use when user says 'état sécurité', 'vérifie les portes et fenêtres', 'y a-t-il du mouvement', 'alarme activée ?'.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "alarm_control",
    description:
      "Arm or disarm the alarm system. Use when user says 'active l'alarme', 'désactive l'alarme', 'arme la maison', 'mode absence'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          description: "Action: 'arm' (activate) or 'disarm' (deactivate).",
        },
        mode: {
          type: Type.STRING,
          description:
            "Alarm mode: 'home' (présence) or 'away' (absence). Default: 'away'.",
        },
      },
      required: ["action"],
    },
  },
  {
    name: "security_camera_snapshot",
    description:
      "Capture a snapshot from a security camera. Use when user says 'montre-moi la caméra entrée', 'snapshot caméra garage', 'photo caméra jardin'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        cameraName: {
          type: Type.STRING,
          description:
            "Name of the camera (e.g. 'entrée', 'garage', 'jardin').",
        },
      },
      required: ["cameraName"],
    },
  },
  {
    name: "list_cameras",
    description:
      "List all available security cameras. Use when user says 'quelles caméras sont disponibles', 'liste des caméras', 'montre-moi les caméras'.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "motion_history",
    description:
      "Get motion detection history. Use when user says 'historique mouvement', 'détections récentes', 'y a-t-il eu du mouvement aujourd'hui'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        hours: {
          type: Type.NUMBER,
          description: "Number of hours to look back. Default: 24.",
        },
      },
    },
  },
  {
    name: "play_youtube",
    description:
      "Search and play a YouTube video. Use when user says 'lance sur YouTube [titre]', 'mets la vidéo [nom]', 'regarde [vidéo] sur YouTube'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description:
            "Search query for the YouTube video (e.g. 'Iron Man trailer', 'tutoriel Python').",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "spotify_control",
    description:
      "Control Spotify playback (play, pause, next, previous). Use when user says 'lance [musique] sur Spotify', 'pause Spotify', 'piste suivante', 'musique précédente'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          description: "Action: 'play', 'pause', 'next', 'previous'.",
        },
        track: {
          type: Type.STRING,
          description: "Track name to play (only for action 'play'). Optional.",
        },
      },
      required: ["action"],
    },
  },
  {
    name: "play_plex",
    description:
      "Play a movie or TV show on Plex media server. Use when user says 'lance [film] sur Plex', 'regarde [série]', 'mets [titre] sur le serveur'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "Title of the movie or TV show to play.",
        },
        type: {
          type: Type.STRING,
          description: "Media type: 'movie' or 'show'. Default: 'movie'.",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "webcam_vision",
    description:
      "Capture webcam image and analyze with Gemini Vision. Use when user says 'que vois-tu', 'regarde-moi', 'analyse ce que tu vois', 'capture webcam'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: {
          type: Type.STRING,
          description:
            "Optional custom prompt for the analysis. Default: describe what you see.",
        },
      },
    },
  },
  {
    name: "detect_objects",
    description:
      "Detect objects or people in webcam image. Use when user says 'détecte [objet]', 'vois-tu [personne]', 'y a-t-il [chose]', 'trouve [objet]'.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        target: {
          type: Type.STRING,
          description:
            "Optional target object or person to detect (e.g. 'une personne', 'un chat', 'un téléphone').",
        },
      },
    },
  },
];
