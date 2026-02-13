/**
 * Constantes globales de l'application J.A.R.V.I.S.
 *
 * Ce fichier centralise toutes les constantes utilisées dans l'application :
 * - Informations de version et branding
 * - Logs initiaux au démarrage
 * - Système de fichiers (mapping apps → chemins)
 *
 * @module constants
 */

// ============================================================================
// INFORMATIONS VERSION
// ============================================================================

/** Nom de l'application affiché dans le HUD */
export const APP_NAME = "J.A.R.V.I.S";

/** Version actuelle (style Marvel/Iron Man) */
export const VERSION = "MK-85";

// ============================================================================
// LOGS INITIAUX
// ============================================================================

/**
 * Logs affichés au démarrage de l'application
 *
 * Ces logs créent l'ambiance immersive et confirment que le système est opérationnel.
 * Ils apparaissent dans le panneau latéral dès le chargement.
 */
export const INITIAL_LOGS = [
  {
    id: "1",
    timestamp: new Date().toISOString(),
    source: "KERNEL" as const,
    message: "Mainframe initialized.",
    type: "info" as const,
  },
  {
    id: "2",
    timestamp: new Date().toISOString(),
    source: "SYSTEM" as const,
    message: "Biometric scan complete. Welcome, Sir.",
    type: "success" as const,
  },
];

// ============================================================================
// SYSTÈME DE FICHIERS (MOCK)
// ============================================================================

/**
 * Mapping des noms d'applications vers leurs chemins d'exécutable
 *
 * Ce dictionnaire permet à J.A.R.V.I.S. de traduire les demandes en langage naturel
 * vers des chemins système réels.
 *
 * Utilisé pour :
 * - Lancement d'apps : "Lance Chrome" → appName="chrome" → chemin résolu
 * - Suggestions intelligentes de Gemini
 * - Mémorisation des habitudes utilisateur
 *
 * NOTE : Les chemins sont configurés pour un système Windows.
 * À adapter selon l'environnement utilisateur (variables d'environnement recommandées).
 *
 * @example
 * ```typescript
 * const chromePath = MOCK_FILE_SYSTEM["chrome"];
 * // → "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
 * ```
 */
export const MOCK_FILE_SYSTEM: Record<string, string> = {
  // ============================================================================
  // NAVIGATEURS WEB
  // ============================================================================
  chrome: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  opera: "C:\\Users\\Admin\\AppData\\Local\\Programs\\Opera\\launcher.exe",
  "opera gx":
    "C:\\Users\\Admin\\AppData\\Local\\Programs\\Opera GX\\launcher.exe",
  firefox: "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
  edge: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",

  // ============================================================================
  // OUTILS DE DÉVELOPPEMENT & IDEs
  // ============================================================================
  vscode:
    "C:\\Users\\Admin\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
  windsurf:
    "C:\\Users\\Admin\\AppData\\Local\\Programs\\Windsurf\\Windsurf.exe",
  cursor: "C:\\Users\\Admin\\AppData\\Local\\Programs\\Cursor\\Cursor.exe",
  powershell: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
  terminal: "C:\\Windows\\System32\\cmd.exe",
  git: "C:\\Program Files\\Git\\git-bash.exe",
  docker: "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe",

  // ============================================================================
  // CRÉATION & 3D
  // ============================================================================
  bambu: "C:\\Program Files\\Bambu Studio\\Bambu Studio.exe",
  "bambu studio": "C:\\Program Files\\Bambu Studio\\Bambu Studio.exe",
  photoshop: "C:\\Program Files\\Adobe\\Adobe Photoshop 2024\\Photoshop.exe",
  blender: "C:\\Program Files\\Blender Foundation\\Blender 4.0\\blender.exe",
  obs: "C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe",

  // ============================================================================
  // SOCIAL & MÉDIA
  // ============================================================================
  spotify: "C:\\Users\\Admin\\AppData\\Roaming\\Spotify\\Spotify.exe",
  discord:
    "C:\\Users\\Admin\\AppData\\Local\\Discord\\app-1.0.9000\\Discord.exe",
  vlc: "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
  steam: "C:\\Program Files (x86)\\Steam\\steam.exe",
};
