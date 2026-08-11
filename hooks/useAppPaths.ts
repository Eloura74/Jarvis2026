/**
 * useAppPaths - Gestion des chemins d'applications configurables
 * Permet de personnaliser les chemins des applications depuis l'interface
 */

import { useState, useEffect, useCallback } from "react";

// Interface pour définir un chemin d'application
export interface AppPath {
  name: string; // Nom de l'application (ex: "Chrome")
  path: string; // Chemin complet (ex: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
  aliases: string[]; // Alias possibles (ex: ["chrome", "google chrome", "navigateur"])
  category: "browser" | "ide" | "media" | "productivity" | "system" | "other";
  icon?: string; // Emoji ou icône
}

// Configuration par défaut (synchronisée avec appsDatabase.ts)
const DEFAULT_APP_PATHS: AppPath[] = [
  // ============================================================================
  // NAVIGATEURS WEB
  // ============================================================================
  {
    name: "Chrome",
    path: "C:\\Users\\faber\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
    aliases: ["chrome", "google chrome", "navigateur", "web", "browser"],
    category: "browser",
    icon: "🌐",
  },
  {
    name: "Opera",
    path: "C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Opera\\opera.exe",
    aliases: ["opera"],
    category: "browser",
    icon: "🅾️",
  },
  {
    name: "Opera GX",
    path: "C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Opera GX\\launcher.exe",
    aliases: ["opera gx", "operagx", "gx"],
    category: "browser",
    icon: "🎮",
  },
  {
    name: "Firefox",
    path: "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
    aliases: ["firefox", "mozilla"],
    category: "browser",
    icon: "🦊",
  },
  {
    name: "Edge",
    path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    aliases: ["edge", "microsoft edge"],
    category: "browser",
    icon: "🌊",
  },

  // ============================================================================
  // IDEs & DÉVELOPPEMENT
  // ============================================================================
  {
    name: "Visual Studio Code",
    path: "C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
    aliases: ["vscode", "vs code", "code", "visual studio code"],
    category: "ide",
    icon: "💻",
  },
  {
    name: "Windsurf",
    path: "A:\\Logiciels\\Windsurf\\Windsurf.exe",
    aliases: ["windsurf"],
    category: "ide",
    icon: "🏄",
  },
  {
    name: "Cursor",
    path: "C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Cursor\\Cursor.exe",
    aliases: ["cursor"],
    category: "ide",
    icon: "🖱️",
  },
  {
    name: "PowerShell",
    path: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
    aliases: ["powershell", "ps"],
    category: "system",
    icon: "💠",
  },
  {
    name: "Invite de commandes",
    path: "C:\\Windows\\System32\\cmd.exe",
    aliases: [
      "cmd",
      "command",
      "terminal",
      "invite de commandes",
      "command prompt",
    ],
    category: "system",
    icon: "⌨️",
  },
  {
    name: "Git Bash",
    path: "C:\\Program Files\\Git\\git-bash.exe",
    aliases: ["git", "git bash", "bash"],
    category: "system",
    icon: "🔧",
  },
  {
    name: "Docker Desktop",
    path: "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe",
    aliases: ["docker"],
    category: "other",
    icon: "🐳",
  },

  // ============================================================================
  // CRÉATION & 3D
  // ============================================================================
  {
    name: "Bambu Studio",
    path: "A:\\Logiciels\\Bambu Studio\\bambu-studio.exe",
    aliases: [
      "bambu",
      "bambu studio",
      "bambu slicer",
      "bambou",
      "bambou studio",
    ],
    category: "other",
    icon: "🖨️",
  },
  {
    name: "Adobe Photoshop",
    path: "C:\\Program Files\\Adobe\\Adobe Photoshop 2024\\Photoshop.exe",
    aliases: ["photoshop", "ps", "adobe photoshop"],
    category: "other",
    icon: "🎨",
  },
  {
    name: "Blender",
    path: "C:\\Program Files\\Blender Foundation\\Blender 4.0\\blender.exe",
    aliases: ["blender"],
    category: "other",
    icon: "🔷",
  },
  {
    name: "OBS Studio",
    path: "C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe",
    aliases: ["obs", "obs studio"],
    category: "media",
    icon: "📹",
  },

  // ============================================================================
  // MÉDIAS & SOCIAL
  // ============================================================================
  {
    name: "Spotify",
    path: "C:\\Users\\%USERNAME%\\AppData\\Roaming\\Spotify\\Spotify.exe",
    aliases: ["spotify", "musique", "music"],
    category: "media",
    icon: "🎵",
  },
  {
    name: "Discord",
    path: "C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-1.0.9000\\Discord.exe",
    aliases: ["discord"],
    category: "other",
    icon: "💬",
  },
  {
    name: "VLC",
    path: "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
    aliases: [
      "vlc",
      "media player",
      "lecteur vidéo",
      "vlc player",
      "video player",
    ],
    category: "media",
    icon: "🎬",
  },
  {
    name: "Steam",
    path: "C:\\Program Files (x86)\\Steam\\steam.exe",
    aliases: ["steam", "jeux", "games"],
    category: "other",
    icon: "🎮",
  },

  // ============================================================================
  // PRODUCTIVITÉ (Microsoft Office)
  // ============================================================================
  {
    name: "Excel",
    path: "C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE",
    aliases: ["excel", "tableur"],
    category: "productivity",
    icon: "📊",
  },
  {
    name: "Word",
    path: "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
    aliases: ["word", "traitement de texte"],
    category: "productivity",
    icon: "📄",
  },
  {
    name: "PowerPoint",
    path: "C:\\Program Files\\Microsoft Office\\root\\Office16\\POWERPNT.EXE",
    aliases: ["powerpoint", "présentation"],
    category: "productivity",
    icon: "📽️",
  },
  {
    name: "Outlook",
    path: "C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE",
    aliases: ["outlook", "mail", "email"],
    category: "productivity",
    icon: "📧",
  },

  // ============================================================================
  // SYSTÈME (Windows)
  // ============================================================================
  {
    name: "Explorateur de fichiers",
    path: "C:\\Windows\\explorer.exe",
    aliases: ["explorateur", "explorer", "fichiers"],
    category: "system",
    icon: "📁",
  },
  {
    name: "Calculatrice",
    path: "calc.exe",
    aliases: ["calculatrice", "calc", "calculette"],
    category: "system",
    icon: "🔢",
  },
  {
    name: "Bloc-notes",
    path: "notepad.exe",
    aliases: ["notepad", "bloc-notes", "bloc notes"],
    category: "system",
    icon: "📋",
  },
];

// Clé localStorage
const STORAGE_KEY = "jarvis_app_paths";
const VERSION_KEY = "jarvis_app_paths_version";
const CURRENT_VERSION = "2"; // Incrémenter pour forcer la mise à jour

export const useAppPaths = () => {
  const [appPaths, setAppPaths] = useState<AppPath[]>(() => {
    // Vérifier la version du cache
    const storedVersion = localStorage.getItem(VERSION_KEY);

    // Charger depuis localStorage ou utiliser défaut
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && storedVersion === CURRENT_VERSION) {
        return JSON.parse(stored);
      } else {
        // Version obsolète ou absente : utiliser les nouveaux défauts
        console.log(
          "🔄 Mise à jour des chemins d'applications (v" +
            CURRENT_VERSION +
            ")",
        );
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        return DEFAULT_APP_PATHS;
      }
    } catch (error) {
      console.error("❌ Erreur chargement app paths:", error);
    }
    return DEFAULT_APP_PATHS;
  });

  // Sauvegarder dans localStorage à chaque modification
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appPaths));
      // console.log('💾 Chemins applications sauvegardés');
    } catch (error) {
      console.error("❌ Erreur sauvegarde app paths:", error);
    }
  }, [appPaths]);

  // Rechercher une application par nom ou alias
  const findApp = useCallback(
    (query: string): AppPath | null => {
      const normalizedQuery = query.toLowerCase().trim();

      // Recherche exacte par nom
      let app = appPaths.find((a) => a.name.toLowerCase() === normalizedQuery);
      if (app) return app;

      // Recherche par alias
      app = appPaths.find((a) =>
        a.aliases.some((alias) => alias.toLowerCase() === normalizedQuery),
      );
      if (app) return app;

      // Recherche partielle (commence par)
      app = appPaths.find(
        (a) =>
          a.name.toLowerCase().startsWith(normalizedQuery) ||
          a.aliases.some((alias) =>
            alias.toLowerCase().startsWith(normalizedQuery),
          ),
      );
      if (app) return app;

      // Recherche partielle (contient)
      app = appPaths.find(
        (a) =>
          a.name.toLowerCase().includes(normalizedQuery) ||
          a.aliases.some((alias) =>
            alias.toLowerCase().includes(normalizedQuery),
          ),
      );

      return app || null;
    },
    [appPaths],
  );

  // Ajouter une nouvelle application
  const addApp = useCallback((app: AppPath) => {
    setAppPaths((prev) => [...prev, app]);
  }, []);

  // Modifier une application existante
  const updateApp = useCallback((index: number, updatedApp: AppPath) => {
    setAppPaths((prev) =>
      prev.map((app, i) => (i === index ? updatedApp : app)),
    );
  }, []);

  // Supprimer une application
  const removeApp = useCallback((index: number) => {
    setAppPaths((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Réinitialiser aux valeurs par défaut
  const resetToDefaults = useCallback(() => {
    setAppPaths(DEFAULT_APP_PATHS);
  }, []);

  // Importer depuis JSON
  const importPaths = useCallback((json: string) => {
    try {
      const imported = JSON.parse(json);
      if (Array.isArray(imported)) {
        setAppPaths(imported);
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Erreur import:", error);
      return false;
    }
  }, []);

  // Exporter vers JSON
  const exportPaths = useCallback(() => {
    return JSON.stringify(appPaths, null, 2);
  }, [appPaths]);

  return {
    appPaths,
    findApp,
    addApp,
    updateApp,
    removeApp,
    resetToDefaults,
    importPaths,
    exportPaths,
  };
};
