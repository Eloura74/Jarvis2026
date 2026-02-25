/**
 * Base de données des applications - OMNI / J.A.R.V.I.S.
 *
 * Structure enrichie avec métadonnées pour recherche sémantique intelligente.
 * Chaque app contient : chemin, catégorie, mots-clés, description.
 *
 * @module apps/database
 */

import type { AppEntry } from "./types";

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
    path: "C:\\Users\\faber\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
    category: "browser",
    keywords: ["web", "internet", "navigation", "google", "browser"],
    description: "Google Chrome web browser",
  },
  opera: {
    path: "C:\\Users\\faber\\AppData\\Local\\Programs\\Opera\\opera.exe",
    category: "browser",
    keywords: ["web", "internet", "navigation", "browser"],
    description: "Opera web browser",
  },
  "opera gx": {
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
