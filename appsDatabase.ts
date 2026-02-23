/**
 * Base de données des applications - OMNI / J.A.R.V.I.S.
 *
 * Structure enrichie avec métadonnées pour recherche sémantique intelligente.
 * Chaque app contient : chemin, catégorie, mots-clés, description.
 *
 * @module appsDatabase
 */

/**
 * Structure d'une application dans la base de données
 */
export interface AppEntry {
  /** Chemin complet vers l'exécutable */
  path: string;
  /** Catégorie principale (browser, ide, media, etc.) */
  category: string;
  /** Mots-clés pour recherche sémantique */
  keywords: string[];
  /** Description courte de l'application */
  description: string;
  /** Alias alternatifs pour le nom */
  aliases?: string[];
}

/**
 * Base de données des applications disponibles
 *
 * Utilisée par Gemini pour :
 * - Comprendre quelles apps sont installées
 * - Faire de la recherche sémantique ("éditeur de code" → VSCode/Cursor/Windsurf)
 * - Proposer des alternatives intelligentes
 */
export const APPS_DATABASE: Record<string, AppEntry> = {
  // ============================================================================
  // NAVIGATEURS WEB
  // ============================================================================
  chrome: {
    // Note: Vérifiez le bon chemin selon votre installation
    // Options possibles:
    // - C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe (64-bit)
    // - C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe (32-bit)
    // - C:\\Users\\USERNAME\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe (installation utilisateur)
    // ⚠️ IMPORTANT: Remplacez "faber" par VOTRE nom d'utilisateur Windows !
    path: "C:\\Users\\faber\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
    category: "browser",
    keywords: ["web", "internet", "navigation", "google", "browser"],
    description: "Google Chrome web browser",
  },
  opera: {
    // ⚠️ IMPORTANT: Remplacez "faber" par VOTRE nom d'utilisateur Windows !
    path: "C:\\Users\\faber\\AppData\\Local\\Programs\\Opera\\opera.exe",
    category: "browser",
    keywords: ["web", "internet", "navigation", "browser"],
    description: "Opera web browser",
  },
  "opera gx": {
    // ⚠️ IMPORTANT: Remplacez "faber" par VOTRE nom d'utilisateur Windows !
    path: "C:\\Users\\faber\\AppData\\Local\\Programs\\Opera GX\\launcher.exe",
    category: "browser",
    keywords: ["web", "internet", "navigation", "gaming", "browser"],
    description: "Opera GX gaming browser",
    aliases: ["operagx", "gx"],
  },
  firefox: {
    path: "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
    category: "browser",
    keywords: ["web", "internet", "navigation", "mozilla", "browser"],
    description: "Mozilla Firefox web browser",
  },
  edge: {
    path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    category: "browser",
    keywords: ["web", "internet", "navigation", "microsoft", "browser"],
    description: "Microsoft Edge web browser",
  },

  // ============================================================================
  // IDEs & DÉVELOPPEMENT
  // ============================================================================
  vscode: {
    // ⚠️ IMPORTANT: Remplacez "faber" par VOTRE nom d'utilisateur Windows !
    path: "C:\\Users\\faber\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
    category: "ide",
    keywords: [
      "code",
      "programming",
      "development",
      "editor",
      "coding",
      "ide",
      "microsoft",
    ],
    description: "Visual Studio Code - code editor",
    aliases: ["vs code", "visual studio code", "code"],
  },
  windsurf: {
    // ⚠️ Vérifiez ce chemin selon votre installation
    path: "A:\\Logiciels\\Windsurf\\Windsurf.exe",
    category: "ide",
    keywords: [
      "code",
      "programming",
      "development",
      "editor",
      "coding",
      "ide",
      "ai",
    ],
    description: "Windsurf AI code editor",
  },
  cursor: {
    path: "C:\\Users\\Admin\\AppData\\Local\\Programs\\Cursor\\Cursor.exe",
    category: "ide",
    keywords: [
      "code",
      "programming",
      "development",
      "editor",
      "coding",
      "ide",
      "ai",
    ],
    description: "Cursor AI code editor",
  },
  powershell: {
    path: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
    category: "terminal",
    keywords: ["terminal", "console", "command", "shell", "cli", "script"],
    description: "Windows PowerShell terminal",
  },
  terminal: {
    path: "C:\\Windows\\System32\\cmd.exe",
    category: "terminal",
    keywords: ["terminal", "console", "command", "shell", "cli", "cmd"],
    description: "Windows Command Prompt",
    aliases: ["cmd", "command prompt"],
  },
  git: {
    path: "C:\\Program Files\\Git\\git-bash.exe",
    category: "terminal",
    keywords: ["terminal", "console", "git", "version control", "bash"],
    description: "Git Bash terminal",
    aliases: ["git bash", "bash"],
  },
  docker: {
    path: "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe",
    category: "dev-tools",
    keywords: ["development", "container", "virtualization", "devops"],
    description: "Docker Desktop - container platform",
  },

  // ============================================================================
  // CRÉATION & 3D
  // ============================================================================
  bambu: {
    // ⚠️ Vérifiez ce chemin selon votre installation
    path: "A:\\Logiciels\\Bambu Studio\\bambu-studio.exe",
    category: "3d-printing",
    keywords: ["3d", "printing", "printer", "slicer", "3d printing", "bambu"],
    description: "Bambu Studio - 3D printing slicer",
    aliases: ["bambu studio", "bambu slicer", "bambou", "bambou studio"],
  },
  "bambu studio": {
    path: "A:\\Logiciels\\Bambu Studio\\bambu-studio.exe",
    category: "3d-printing",
    keywords: ["3d", "printing", "printer", "slicer", "3d printing", "bambu"],
    description: "Bambu Studio - 3D printing slicer",
    aliases: ["bambu", "bambou", "bambou studio"],
  },
  photoshop: {
    path: "C:\\Program Files\\Adobe\\Adobe Photoshop 2024\\Photoshop.exe",
    category: "creative",
    keywords: ["photo", "image", "editing", "design", "graphics", "adobe"],
    description: "Adobe Photoshop - image editor",
    aliases: ["ps", "adobe photoshop"],
  },
  blender: {
    path: "C:\\Program Files\\Blender Foundation\\Blender 4.0\\blender.exe",
    category: "3d-modeling",
    keywords: ["3d", "modeling", "animation", "rendering", "design"],
    description: "Blender - 3D creation suite",
  },
  obs: {
    path: "C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe",
    category: "streaming",
    keywords: ["streaming", "recording", "video", "broadcast", "capture"],
    description: "OBS Studio - streaming and recording",
    aliases: ["obs studio"],
  },

  // ============================================================================
  // MÉDIAS & SOCIAL
  // ============================================================================
  spotify: {
    path: "C:\\Users\\Admin\\AppData\\Roaming\\Spotify\\Spotify.exe",
    category: "media",
    keywords: ["music", "audio", "streaming", "player", "spotify"],
    description: "Spotify - music streaming",
  },
  discord: {
    path: "C:\\Users\\Admin\\AppData\\Local\\Discord\\app-1.0.9000\\Discord.exe",
    category: "communication",
    keywords: ["chat", "voice", "communication", "messaging", "social"],
    description: "Discord - voice and text chat",
  },
  vlc: {
    path: "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
    category: "media",
    keywords: ["video", "player", "media", "audio", "movie"],
    description: "VLC Media Player - video player",
    aliases: ["vlc player", "video player"],
  },
  steam: {
    path: "C:\\Program Files (x86)\\Steam\\steam.exe",
    category: "gaming",
    keywords: ["games", "gaming", "game launcher", "steam", "valve"],
    description: "Steam - game platform",
  },

  // ============================================================================
  // APPLICATIONS SYSTÈME WINDOWS
  // ============================================================================
  calculette: {
    path: "calc",
    category: "system",
    keywords: ["calcul", "math", "calculator", "calculatrice", "addition"],
    description: "Calculatrice Windows",
    aliases: ["calc", "calculator", "calculatrice"],
  },
  notepad: {
    path: "notepad",
    category: "system",
    keywords: ["texte", "text", "editor", "éditeur", "note"],
    description: "Bloc-notes Windows",
    aliases: ["bloc-notes", "note", "notes"],
  },
  explorer: {
    path: "explorer",
    category: "system",
    keywords: ["files", "fichiers", "explorateur", "folder", "dossier"],
    description: "Explorateur de fichiers Windows",
    aliases: ["explorateur", "fichiers", "files"],
  },
  paint: {
    path: "mspaint",
    category: "system",
    keywords: ["dessin", "draw", "image", "paint", "painting"],
    description: "Paint Windows",
  },
  "task manager": {
    path: "taskmgr",
    category: "system",
    keywords: ["tasks", "processes", "system", "performance", "gestionnaire"],
    description: "Gestionnaire des tâches Windows",
    aliases: ["taskmgr", "gestionnaire", "gestionnaire de tâches"],
  },
  settings: {
    path: "ms-settings:",
    category: "system",
    keywords: ["settings", "paramètres", "configuration", "system"],
    description: "Paramètres Windows",
    aliases: ["paramètres", "config", "configuration"],
  },
};

/**
 * Recherche fuzzy d'applications par nom ou mots-clés
 *
 * Algorithme:
 * 1. Recherche directe par nom/alias
 * 2. Recherche par mots-clés contenus
 * 3. Recherche par catégorie
 * 4. Score de pertinence basé sur correspondances
 *
 * @param query - Requête utilisateur (ex: "éditeur de code", "bambu", "navigateur")
 * @param maxResults - Nombre maximum de résultats (défaut: 5)
 * @returns Liste d'apps triées par pertinence
 */
export const searchApps = (query: string, maxResults: number = 5): string[] => {
  const queryLower = query.toLowerCase();
  const results: Array<{ name: string; score: number }> = [];

  Object.entries(APPS_DATABASE).forEach(([appName, appData]) => {
    let score = 0;

    // Score 100 : Correspondance exacte du nom
    if (appName.toLowerCase() === queryLower) {
      score = 100;
    }
    // Score 90 : Correspondance d'alias
    else if (
      appData.aliases?.some((alias) => alias.toLowerCase() === queryLower)
    ) {
      score = 90;
    }
    // Score 80 : Nom contient la requête
    else if (appName.toLowerCase().includes(queryLower)) {
      score = 80;
    }
    // Score 70 : Alias contient la requête
    else if (
      appData.aliases?.some((alias) => alias.toLowerCase().includes(queryLower))
    ) {
      score = 70;
    }
    // Score 60 : Requête contient le nom (ex: "lance vscode maintenant" → vscode)
    else if (queryLower.includes(appName.toLowerCase())) {
      score = 60;
    }
    // Score 50 : Mots-clés correspondent
    else if (
      appData.keywords.some(
        (keyword) =>
          queryLower.includes(keyword) || keyword.includes(queryLower),
      )
    ) {
      score = 50;
    }
    // Score 40 : Catégorie correspond
    else if (
      queryLower.includes(appData.category) ||
      appData.category.includes(queryLower)
    ) {
      score = 40;
    }
    // Score 30 : Description correspond
    else if (appData.description.toLowerCase().includes(queryLower)) {
      score = 30;
    }

    if (score > 0) {
      results.push({ name: appName, score });
    }
  });

  // Tri par score décroissant, puis par nom alphabétique
  return results
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, maxResults)
    .map((r) => r.name);
};

/**
 * Récupère toutes les apps d'une catégorie
 *
 * @param category - Catégorie recherchée (browser, ide, media, etc.)
 * @returns Liste des noms d'apps dans cette catégorie
 */
export const getAppsByCategory = (category: string): string[] => {
  return Object.entries(APPS_DATABASE)
    .filter(([_, appData]) => appData.category === category)
    .map(([appName, _]) => appName);
};

/**
 * Génère la liste formatée des apps disponibles pour le system prompt Gemini
 *
 * @returns String formaté pour inclusion dans le prompt
 */
export const generateAppsListForPrompt = (): string => {
  const categories: Record<string, string[]> = {};

  // Grouper par catégorie
  Object.entries(APPS_DATABASE).forEach(([appName, appData]) => {
    if (!categories[appData.category]) {
      categories[appData.category] = [];
    }
    categories[appData.category].push(appName);
  });

  // Formater pour le prompt
  return Object.entries(categories)
    .map(([category, apps]) => `- ${category}: ${apps.join(", ")}`)
    .join("\n");
};

/**
 * Convertit APPS_DATABASE vers l'ancien format MOCK_FILE_SYSTEM (rétro-compatibilité)
 *
 * @returns Record<string, string> mappage nom → chemin
 */
export const getMockFileSystem = (): Record<string, string> => {
  const result: Record<string, string> = {};
  Object.entries(APPS_DATABASE).forEach(([appName, appData]) => {
    result[appName] = appData.path;
  });
  return result;
};
