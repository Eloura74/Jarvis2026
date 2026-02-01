/**
 * Service de communication avec Google Gemini AI
 *
 * Ce module gère toute l'intelligence artificielle de J.A.R.V.I.S., notamment :
 * - La compréhension du langage naturel de l'utilisateur
 * - L'exécution de fonction calls (lancement d'apps, contrôle média, etc.)
 * - Le support de workflows multi-outils (chaînage de commandes)
 * - La mémorisation des habitudes utilisateur
 *
 * @module geminiService
 */

import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { OmniDecision, AppMemory } from "../types";
import { validateEnv } from "../config/env";
import { generateAppsListForPrompt } from "../appsDatabase";

// ============================================================================
// CONFIGURATION ET INITIALISATION
// ============================================================================

// Validation de la configuration environnement au chargement du module
// Cela génère une erreur claire si VITE_GEMINI_API_KEY est manquante
const { geminiApiKey } = validateEnv();

// Initialisation du client Gemini AI avec la clé API validée
// Cette instance est réutilisée pour toutes les requêtes (singleton pattern)
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

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
 * @returns Prompt système complet avec capacités et règles
 */
const generateSystemInstruction = (memorySummary: string) => `
You are J.A.R.V.I.S., the ultimate autonomous interface.
Tone: Highly intelligent, proactive, crisp, British wit.

**USER HABITS / MEMORY:**
${memorySummary}

**AVAILABLE APPLICATIONS ON THIS SYSTEM:**
${generateAppsListForPrompt()}

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
- When user request is ambiguous ("lance mon éditeur de code"), suggest the available options.
- If the user asks something conversational, reply with 'text' only.
- If the user asks for a complex task, break it down.
- Always use the EXACT app names from the AVAILABLE APPLICATIONS list above.
- For window management: use partial window titles ("chrome" matches "Google Chrome - New Tab")
`;

// ============================================================================
// OUTILS DISPONIBLES POUR GEMINI AI (Function Calling)
// ============================================================================

/**
 * Déclarations des outils que Gemini peut invoquer
 *
 * Ces outils sont exposés à Gemini via l'API Function Calling, lui permettant
 * d'exécuter des actions concrètes en réponse aux commandes utilisateur.
 *
 * Gemini peut décider d'appeler UN ou PLUSIEURS outils pour répondre à une requête,
 * ce qui permet de créer des workflows complexes (ex: "Mode Travail" lance VSCode + Spotify).
 */
const toolDeclarations: FunctionDeclaration[] = [
  // OUTIL 1 : Lancement d'applications
  // Permet à Gemini de lancer n'importe quelle app installée sur le système
  // Exemple d'utilisation : "Lance VS Code" → appName: "vscode"
  {
    name: "search_and_launch_app",
    description: "Launch an application.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        appName: { type: Type.STRING }, // Nom de l'app (ex: "chrome", "vscode")
        adminMode: { type: Type.BOOLEAN }, // Si true, lance en mode admin
      },
      required: ["appName"],
    },
  },
  // OUTIL 2 : Contrôle média et volume
  // Permet à Gemini de contrôler la lecture audio/vidéo et le volume système
  // Exemple : "Pause la musique" → action: "PAUSE"
  {
    name: "control_media",
    description: "Control media/volume.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          // Actions disponibles pour le contrôle multimédia
          enum: [
            "PAUSE", // Mettre en pause
            "PLAY", // Lancer la lecture
            "NEXT", // Piste suivante
            "PREVIOUS", // Piste précédente
            "MUTE", // Couper le son
            "VOLUME_UP", // Augmenter le volume
            "VOLUME_DOWN", // Diminuer le volume
          ],
        },
      },
      required: ["action"],
    },
  },
  // OUTIL 3 : Gestion du matériel / IoT
  // Permet à Gemini de contrôler des périphériques ou objets connectés
  // Exemple : "Allume les lumières" → deviceType: "light", command: "on"
  {
    name: "manage_hardware",
    description: "Control external hardware/IoT.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        deviceType: { type: Type.STRING }, // Type d'appareil (printer, light, etc.)
        command: { type: Type.STRING }, // Commande à exécuter (on, off, print, etc.)
        deviceName: { type: Type.STRING }, // Nom spécifique de l'appareil (optionnel)
      },
      required: ["deviceType", "command"],
    },
  },
  // OUTIL 4 : Recherche web ET ouverture URLs directes
  // Permet à Gemini d'effectuer des recherches OU d'ouvrir des sites directement
  // Exemple recherche : "Cherche la météo à Paris" → query: "météo Paris"
  // Exemple URL directe : "Ouvre YouTube" → query: "youtube.com", isDirectURL: true
  {
    name: "perform_web_search",
    description:
      "Open a website directly (youtube.com, github.com, etc.) OR perform a Google search if not a URL.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING }, // URL ou requête de recherche
        isDirectURL: { type: Type.BOOLEAN }, // True si c'est une URL à ouvrir directement
      },
      required: ["query"],
    },
  },
  // OUTIL 5 : Optimisation système
  // Permet à Gemini de lancer des optimisations ou diagnostics système
  // Exemple : "Nettoie la mémoire" → target: "MEMORY"
  {
    name: "system_optimization",
    description: "Run cleanup, optimize memory, or scan for issues.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        target: {
          type: Type.STRING,
          // Cibles d'optimisation disponibles
          enum: [
            "MEMORY", // Optimisation mémoire RAM
            "NETWORK", // Optimisation réseau
            "DISK", // Nettoyage disque
            "ALL", // Optimisation complète
          ],
        },
      },
      required: ["target"],
    },
  },
  // OUTIL 6 : Gestion des fenêtres Windows (NOUVEAU)
  // Permet à Gemini de contrôler les fenêtres ouvertes
  // Exemple : "Ferme Chrome" → windowTitle: "chrome", action: "close"
  {
    name: "manage_window",
    description:
      "Focus, close, minimize, or maximize an application window by its title.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        windowTitle: { type: Type.STRING }, // Titre de la fenêtre (recherche floue)
        action: {
          type: Type.STRING,
          enum: ["focus", "close", "minimize", "maximize"], // Actions disponibles
        },
      },
      required: ["windowTitle", "action"],
    },
  },
  // OUTIL 7 : Automation clavier (NOUVEAU)
  // Permet à Gemini de typer du texte ou envoyer des raccourcis
  // Exemple : "Écris bonjour" → action: "type", text: "bonjour"
  {
    name: "keyboard_automation",
    description: "Type text in the active window OR send keyboard shortcuts.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ["type", "shortcut"], // Type de l'action
        },
        text: { type: Type.STRING }, // Texte à taper (si action="type")
        keys: { type: Type.STRING }, // Raccourci (si action="shortcut", ex: "ctrl+c")
      },
      required: ["action"],
    },
  },
];

// ============================================================================
// FONCTION PRINCIPALE : PARSING DES COMMANDES UTILISATEUR
// ============================================================================

/**
 * Analyse une commande en langage naturel via Gemini AI
 *
 * Cette fonction est le cœur du système d'intelligence de J.A.R.V.I.S.
 * Elle traduit les demandes utilisateur en actions concrètes :
 * - Appels d'outils (lancement d'apps, contrôle système, etc.)
 * - Réponses textuelles conversationnelles
 * - Workflows complexes (chaînage de plusieurs outils)
 *
 * Processus :
 * 1. Construction du contexte (historique des apps utilisées)
 * 2. Envoi à Gemini avec system instruction + liste d'outils
 * 3. Parsing de la réponse (function calls ou texte)
 * 4. Retour d'une décision structurée (OmniDecision)
 *
 * @param input - Commande vocale ou textuelle de l'utilisateur
 * @param memories - Historique des applications lancées (pour personnalisation)
 * @returns Promise<OmniDecision> - Décision structurée (outil(s) ou texte)
 *
 * @example
 * ```typescript
 * // Commande simple
 * const decision = await parseCommand("Lance Chrome", []);
 * // → { type: "TOOL_CALL", toolCalls: [{ name: "search_and_launch_app", args: { appName: "chrome" } }] }
 *
 * // Workflow multi-outils
 * const decision = await parseCommand("Mode travail", memories);
 * // → { type: "TOOL_CALL", toolCalls: [
 * //     { name: "search_and_launch_app", args: { appName: "vscode" } },
 * //     { name: "search_and_launch_app", args: { appName: "spotify" } }
 * //   ]}
 *
 * // Conversation
 * const decision = await parseCommand("Bonjour J.A.R.V.I.S.", []);
 * // → { type: "TEXT_RESPONSE", text: "Good morning, Sir." }
 * ```
 */
export const parseCommand = async (
  input: string,
  memories: AppMemory[],
): Promise<OmniDecision> => {
  try {
    // ÉTAPE 1 : Construction du contexte mémoire
    // Résumé des apps fréquemment utilisées pour personnaliser les suggestions de Gemini
    const memoryContext =
      memories.length > 0
        ? `Frequent Apps: ${memories.map((m) => `${m.appName} (${m.launchCount})`).join(", ")}`
        : "No prior usage.";

    // ÉTAPE 2 : Appel API Gemini avec function calling
    // Temperature basse (0.1) pour des réponses déterministes et fiables
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: input,
      config: {
        systemInstruction: generateSystemInstruction(memoryContext),
        tools: [{ functionDeclarations: toolDeclarations }],
        temperature: 0.1, // Faible température = réponses plus prévisibles
      },
    });

    // ÉTAPE 3 : Extraction du candidat de réponse
    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No response from Neural Core.");

    // ÉTAPE 4 : Parsing des function calls (si présents)
    // Gemini peut retourner 0, 1 ou PLUSIEURS function calls pour workflows complexes
    const functionCalls = candidate.content?.parts
      ?.filter((p) => p.functionCall)
      .map((p) => p.functionCall);

    // CAS 1 : Gemini a décidé d'appeler un ou plusieurs outils
    // Support des workflows multi-outils (ex: "Mode Travail" lance plusieurs apps)
    if (functionCalls && functionCalls.length > 0) {
      // Filtrer les function calls valides (avec name et args définis)
      const validCalls = functionCalls.filter(
        (fc): fc is { name: string; args: Record<string, unknown> } =>
          fc?.name !== undefined && fc?.args !== undefined,
      );

      return {
        type: "TOOL_CALL",
        toolCalls: validCalls.map((fc) => ({
          name: fc.name,
          args: fc.args,
        })),
        confidence: 0.99, // Haute confiance pour les function calls
      };
    }

    // CAS 2 : Gemini a retourné une réponse textuelle (conversation)
    return {
      type: "TEXT_RESPONSE",
      text:
        candidate.content?.parts?.map((p) => p.text).join("") || "Standing by.",
      confidence: 0.8,
    };
  } catch (error) {
    // GESTION DES ERREURS : réseau, API indisponible, quota dépassé, etc.
    console.error("OMNI Core Error:", error);
    return {
      type: "ERROR",
      text: "Connection to Stark Servers failed.",
      confidence: 0,
    };
  }
};
