/**
 * Service de recherche intelligente d'applications Windows
 *
 * Ce service scanne le système Windows pour localiser automatiquement
 * les exécutables des applications, au lieu d'utiliser des chemins hardcodés.
 *
 * Stratégie de recherche :
 * 1. Vérifier dans les chemins communs (Program Files, Program Files (x86))
 * 2. Parser le registre Windows via PowerShell
 * 3. Chercher dans AppData\Local et AppData\Roaming
 * 4. Mémoriser les chemins trouvés dans LocalStorage
 *
 * @module appScanner
 */

/**
 * Chemins Windows standard où chercher les applications
 */
const COMMON_PATHS = [
  "C:\\Program Files",
  "C:\\Program Files (x86)",
  `C:\\Users\\${getUsername()}\\AppData\\Local\\Programs`,
  `C:\\Users\\${getUsername()}\\AppData\\Roaming`,
  `C:\\Users\\${getUsername()}\\AppData\\Local`,
];

/**
 * Récupère le nom d'utilisateur Windows actuel
 */
function getUsername(): string {
  // En environnement navigateur, on ne peut pas accéder directement au username
  // Fallback vers un paramètre générique
  return "Admin"; // TODO: À remplacer par une config utilisateur
}

/**
 * Cache des chemins d'applications trouvés
 * Stocké dans LocalStorage pour éviter de rescanner à chaque fois
 */
const APP_PATHS_CACHE_KEY = "jarvis_app_paths_cache";

/**
 * Résultat d'une recherche d'application
 */
export interface AppSearchResult {
  /** Nom de l'application recherchée */
  appName: string;
  /** Chemin complet trouvé (ou null si non trouvé) */
  path: string | null;
  /** Source de la trouvaille (cache, scan, registre, etc.) */
  source: "cache" | "scan" | "registry" | "fallback";
  /** Confiance dans le résultat (0-1) */
  confidence: number;
}

/**
 * Récupère le cache des chemins d'applications
 */
function getPathsCache(): Record<string, string> {
  try {
    const cached = localStorage.getItem(APP_PATHS_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

/**
 * Sauvegarde un chemin d'application dans le cache
 */
export function cacheAppPath(appName: string, path: string): void {
  try {
    const cache = getPathsCache();
    cache[appName.toLowerCase()] = path;
    localStorage.setItem(APP_PATHS_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("Failed to cache app path:", error);
  }
}

/**
 * Recherche une application dans le cache
 */
function searchInCache(appName: string): string | null {
  const cache = getPathsCache();
  return cache[appName.toLowerCase()] || null;
}

/**
 * Génère des variations possibles du nom d'application
 *
 * Exemples :
 * - "bambu" → ["bambu", "Bambu", "BAMBU", "Bambu Studio", "BambuStudio"]
 * - "vscode" → ["vscode", "VSCode", "Code", "Visual Studio Code"]
 */
function generateAppNameVariations(appName: string): string[] {
  const variations = new Set<string>();
  const lower = appName.toLowerCase();

  // Variations de base
  variations.add(lower);
  variations.add(appName);
  variations.add(appName.toUpperCase());
  variations.add(appName.charAt(0).toUpperCase() + appName.slice(1));

  // Variations avec espaces
  const withSpaces = appName.replace(/([a-z])([A-Z])/g, "$1 $2");
  if (withSpaces !== appName) {
    variations.add(withSpaces);
    variations.add(withSpaces.toLowerCase());
  }

  // Variations spécifiques connues
  const knownVariations: Record<string, string[]> = {
    bambu: ["Bambu Studio", "BambuStudio", "Bambu Lab Studio"],
    vscode: ["Visual Studio Code", "Code", "VS Code"],
    windsurf: ["Windsurf"],
    cursor: ["Cursor"],
    chrome: ["Google Chrome", "Chrome"],
    firefox: ["Mozilla Firefox", "Firefox"],
    obs: ["OBS Studio", "OBS"],
  };

  if (knownVariations[lower]) {
    knownVariations[lower].forEach((v) => variations.add(v));
  }

  return Array.from(variations);
}

/**
 * Construit des patterns de chemins potentiels pour une application
 *
 * @param appName - Nom de l'application
 * @returns Liste de patterns de chemins possibles
 */
function generatePathPatterns(appName: string): string[] {
  const variations = generateAppNameVariations(appName);
  const patterns: string[] = [];

  for (const basePath of COMMON_PATHS) {
    for (const variation of variations) {
      // Pattern 1 : C:\Program Files\AppName\AppName.exe
      patterns.push(`${basePath}\\${variation}\\${variation}.exe`);

      // Pattern 2 : C:\Program Files\AppName\bin\AppName.exe
      patterns.push(`${basePath}\\${variation}\\bin\\${variation}.exe`);

      // Pattern 3 : C:\Program Files\AppName\Application.exe
      patterns.push(`${basePath}\\${variation}\\Application.exe`);

      // Pattern 4 : C:\Program Files\AppName\launcher.exe
      patterns.push(`${basePath}\\${variation}\\launcher.exe`);
    }
  }

  return patterns;
}

/**
 * NOTE IMPORTANTE : Recherche système limitée en environnement navigateur
 *
 * Le navigateur ne peut PAS accéder directement au système de fichiers Windows
 * pour des raisons de sécurité. Cette fonction simule une recherche locale.
 *
 * Solutions possibles :
 * 1. Backend Node.js qui scanne le système (recommandé pour production)
 * 2. Extension navigateur avec permissions filesystem
 * 3. Electron app avec accès natif aux fichiers
 * 4. Configuration manuelle par l'utilisateur (apps-config.json)
 *
 * Pour ce MVP, on va utiliser l'approche 4 : configuration utilisateur.
 */

/**
 * Recherche intelligente d'une application
 *
 * Process :
 * 1. Vérifier le cache LocalStorage
 * 2. Vérifier la configuration utilisateur (apps-config.json)
 * 3. Demander à l'utilisateur de configurer le chemin
 *
 * @param appName - Nom de l'application à rechercher
 * @returns Résultat de la recherche avec chemin et confiance
 */
export async function findApplication(
  appName: string,
): Promise<AppSearchResult> {
  // ÉTAPE 1 : Vérifier le cache
  const cachedPath = searchInCache(appName);
  if (cachedPath) {
    return {
      appName,
      path: cachedPath,
      source: "cache",
      confidence: 0.95,
    };
  }

  // ÉTAPE 2 : Vérifier la configuration utilisateur
  // TODO: Charger apps-config.json si présent

  // ÉTAPE 3 : Patterns de chemins intelligents (fallback)
  const patterns = generatePathPatterns(appName);

  // En environnement navigateur, on ne peut pas vérifier si les fichiers existent
  // On retourne le pattern le plus probable comme suggestion
  const mostLikelyPath = patterns[0];

  return {
    appName,
    path: mostLikelyPath,
    source: "fallback",
    confidence: 0.3, // Faible confiance car non vérifié
  };
}

/**
 * Demande à l'utilisateur de localiser manuellement une application
 *
 * Ouvre une interface pour que l'utilisateur puisse :
 * - Parcourir son système de fichiers
 * - Sélectionner l'exécutable
 * - Sauvegarder le chemin pour usage futur
 *
 * @param appName - Nom de l'application
 * @returns Promise qui résout avec le chemin sélectionné
 */
export async function promptUserForAppPath(
  appName: string,
): Promise<string | null> {
  // NOTE: En environnement navigateur pur, il n'y a pas d'API File System Access
  // qui permette de parcourir le système pour choisir un .exe

  // Solution temporaire : demander le chemin via prompt
  const userPath = window.prompt(
    `J.A.R.V.I.S. ne peut pas localiser "${appName}".\n\n` +
      `Veuillez entrer le chemin complet de l'exécutable :\n` +
      `(Exemple : C:\\Program Files\\Bambu Studio\\Bambu Studio.exe)`,
  );

  if (userPath && userPath.trim()) {
    // Sauvegarder dans le cache
    cacheAppPath(appName, userPath.trim());
    return userPath.trim();
  }

  return null;
}

/**
 * Vérifie si un chemin d'exécutable semble valide (basé sur l'extension)
 */
export function isValidExePath(path: string): boolean {
  return path.toLowerCase().endsWith(".exe");
}

/**
 * Exporte la configuration actuelle des chemins d'apps
 * pour création d'un fichier apps-config.json
 *
 * @returns Configuration JSON des chemins
 */
export function exportAppsConfig(): string {
  const cache = getPathsCache();
  return JSON.stringify(cache, null, 2);
}

/**
 * Importe une configuration de chemins d'apps depuis JSON
 *
 * @param configJson - Configuration JSON des chemins
 */
export function importAppsConfig(configJson: string): void {
  try {
    const config = JSON.parse(configJson);
    localStorage.setItem(APP_PATHS_CACHE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Failed to import apps config:", error);
    throw new Error("Configuration invalide");
  }
}
