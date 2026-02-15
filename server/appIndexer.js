/**
 * Indexeur d'applications Windows pour J.A.R.V.I.S.
 *
 * Ce module scanne automatiquement le système Windows pour trouver
 * tous les exécutables (.exe) dans les répertoires standard.
 *
 * Répertoires scannés :
 * - C:\Program Files
 * - C:\Program Files (x86)
 * - C:\Users\[username]\AppData\Local\Programs
 * - C:\Users\[username]\AppData\Roaming
 *
 * @module appIndexer
 */

import fs from "fs/promises";
import path from "path";
import { glob } from "glob";
import os from "os";

/**
 * Structure d'une application indexée
 * @typedef {Object} IndexedApp
 * @property {string} name - Nom de l'exécutable (sans extension)
 * @property {string} path - Chemin complet vers l'exécutable
 * @property {number} size - Taille du fichier en bytes
 * @property {Date} modified - Date de dernière modification
 * @property {string} directory - Répertoire parent
 * @property {string[]} keywords - Mots-clés extraits du chemin
 */

/**
 * Applications système Windows critiques (NE PAS lancer)
 * Ces .exe sont essentiels au fonctionnement de Windows
 */
const SYSTEM_CRITICAL_APPS = [
  "svchost.exe",
  "csrss.exe",
  "winlogon.exe",
  "lsass.exe",
  "services.exe",
  "smss.exe",
  "wininit.exe",
  "dwm.exe",
  "taskhost.exe",
  "taskhostw.exe",
  "sihost.exe",
  "fontdrvhost.exe",
  "conhost.exe",
  "audiodg.exe",
  "spoolsv.exe",
  "searchindexer.exe",
];

/**
 * Mapping aliases français → nom d'app Windows
 * Permet de dire "ouvre la calculatrice" au lieu de "ouvre calc"
 */
export const NATIVE_APPS_ALIASES = {
  calculatrice: "calc",
  calculette: "calc",
  calc: "calc",

  "bloc-note": "notepad",
  "bloc note": "notepad",
  notepad: "notepad",
  "bloc notes": "notepad",

  paint: "mspaint",
  peinture: "mspaint",

  explorateur: "explorer",
  explorer: "explorer",
  "explorateur de fichiers": "explorer",

  cmd: "cmd",
  "invite de commandes": "cmd",
  terminal: "cmd",

  powershell: "powershell",

  "gestionnaire des taches": "taskmgr",
  "gestionnaire de taches": "taskmgr",
  "task manager": "taskmgr",
  taskmgr: "taskmgr",

  "panneau de configuration": "control",
  control: "control",

  registre: "regedit",
  regedit: "regedit",

  "snipping tool": "snippingtool",
  "outil capture": "snippingtool",
};

/**
 * Répertoires Windows standard où chercher les applications
 * @returns {string[]} Liste des répertoires à scanner
 */
function getSearchDirectories() {
  const IS_WINDOWS = process.platform === "win32";

  if (!IS_WINDOWS) {
    return [
      "/usr/share/applications",
      `${os.homedir()}/.local/share/applications`,
      "/var/lib/snapd/desktop/applications",
    ];
  }

  const username = os.userInfo().username;
  const driveLetters = ["A", "C", "D", "E", "F", "G", "H"];
  const drives = [];

  for (const letter of driveLetters) {
    const drive = `${letter}:`;
    drives.push(
      `${drive}\\Program Files`,
      `${drive}\\Program Files (x86)`,
      `${drive}\\Logiciels`,
      `${drive}\\Programs`,
      `${drive}\\Apps`,
      `${drive}\\Games`,
    );
  }

  drives.push(
    `C:\\Users\\${username}\\AppData\\Local\\Programs`,
    `C:\\Users\\${username}\\AppData\\Local`,
    `C:\\Users\\${username}\\AppData\\Roaming`,
    "C:\\Windows\\System32",
    "C:\\Windows",
    `C:\\Users\\${username}\\AppData\\Local\\Microsoft\\WindowsApps`,
  );

  return drives;
}

/**
 * Extrait les mots-clés depuis un chemin de fichier
 *
 * @param {string} filePath - Chemin du fichier
 * @returns {string[]} Liste de mots-clés
 */
function extractKeywords(filePath) {
  const keywords = new Set();

  // Découper le chemin en segments
  const segments = filePath.split(/[\\\/]/).filter((s) => s.length > 0);

  segments.forEach((segment) => {
    // Ignorer les segments système
    if (
      [
        "C:",
        "Program Files",
        "Program Files (x86)",
        "AppData",
        "Local",
        "Roaming",
        "Programs",
      ].includes(segment)
    ) {
      return;
    }

    // Séparer les mots (camelCase, spaces, tirets)
    const words = segment
      .replace(/\.exe$/i, "") // Retirer .exe
      .split(/[\s\-_]+/) // Séparer par espaces, tirets, underscores
      .flatMap((word) => {
        // Séparer camelCase : "BambuStudio" → ["Bambu", "Studio"]
        return word.split(/(?=[A-Z])/).filter((w) => w.length > 0);
      });

    words.forEach((word) => {
      if (word.length >= 2) {
        keywords.add(word.toLowerCase());
      }
    });
  });

  return Array.from(keywords);
}

/**
 * Scanne un répertoire pour trouver tous les fichiers .exe
 *
 * @param {string} directory - Répertoire à scanner
 * @param {number} maxDepth - Profondeur maximale de recherche
 * @returns {Promise<IndexedApp[]>} Liste des applications trouvées
 */
async function scanDirectory(directory, maxDepth = 3) {
  const apps = [];
  const IS_WINDOWS = process.platform === "win32";
  const extension = IS_WINDOWS ? ".exe" : ".desktop";

  try {
    await fs.access(directory);
  } catch {
    return apps;
  }

  console.log(`📁 Scanning: ${directory}`);

  try {
    const pattern = path
      .join(directory, `**/*${extension}`)
      .replace(/\\/g, "/");
    const files = await glob(pattern, {
      windowsPathsNoEscape: true,
      maxDepth: maxDepth,
      ignore: IS_WINDOWS
        ? [
            "**/unins*.exe",
            "**/updater*.exe",
            "**/crash*.exe",
            "**/*uninstall*.exe",
            "**/*setup*.exe",
            "**/*install*.exe",
            "**/*installer*.exe",
            "**/node_modules/**",
            "**/.git/**",
          ]
        : ["**/node_modules/**", "**/.git/**"],
    });

    for (const filePath of files) {
      try {
        const stats = await fs.stat(filePath);
        if (IS_WINDOWS && stats.size < 50 * 1024) continue;

        let fileName = path.basename(filePath, extension);
        let launchPath = filePath;

        // Parsing spécifique Linux pour les fichiers .desktop
        if (!IS_WINDOWS) {
          const content = await fs.readFile(filePath, "utf-8");
          const nameMatch = content.match(/^Name=(.+)$/m);
          const execMatch = content.match(/^Exec=(.+)$/m);

          if (nameMatch) fileName = nameMatch[1];
          if (execMatch) {
            // Nettoyer les arguments spécifiques xdg (%u, %f, etc.)
            launchPath = execMatch[1].split(/\s+/)[0].replace(/["']/g, "");
          } else {
            continue; // Pas de commande Exec, on ignore
          }
        } else if (SYSTEM_CRITICAL_APPS.includes(fileName.toLowerCase())) {
          continue;
        }

        apps.push({
          name: fileName,
          path: launchPath,
          size: stats.size,
          modified: stats.mtime,
          directory: path.dirname(filePath),
          keywords: extractKeywords(filePath),
          isDesktopFile: !IS_WINDOWS,
        });
      } catch (err) {
        continue;
      }
    }
  } catch (error) {
    console.error(`Error scanning ${directory}:`, error);
  }

  return apps;
}

/**
 * Indexe toutes les applications Windows
 *
 * @returns {Promise<IndexedApp[]>} Liste complète des applications
 */
export async function indexApplications() {
  console.log("🔍 Starting Windows application indexing...\n");

  const startTime = Date.now();
  const directories = getSearchDirectories();

  console.log(
    `Searching in ${directories.length} directories:\n${directories.map((d) => `  - ${d}`).join("\n")}\n`,
  );

  // Scanner tous les répertoires en parallèle
  const results = await Promise.all(
    directories.map((dir) => scanDirectory(dir)),
  );

  // Fusionner tous les résultats
  const allApps = results.flat();

  // Supprimer les doublons (même chemin)
  const uniqueApps = Array.from(
    new Map(allApps.map((app) => [app.path, app])).values(),
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n✅ Indexing complete!`);
  console.log(`   Found: ${uniqueApps.length} applications`);
  console.log(`   Time: ${elapsed}s\n`);

  return uniqueApps;
}

/**
 * Recherche une application dans l'index
 *
 * @param {IndexedApp[]} apps - Index des applications
 * @param {string} query - Requête de recherche
 * @returns {IndexedApp[]} Applications correspondantes, triées par pertinence
 */
export function searchApplications(apps, query) {
  const queryLower = query.toLowerCase();

  // NOUVEAU : Vérifier si c'est un alias d'app native
  const aliasMatch = NATIVE_APPS_ALIASES[queryLower];
  const searchTerm = aliasMatch || queryLower;

  const queryWords = searchTerm.split(/\s+/).filter((w) => w.length > 0);
  const results = [];

  for (const app of apps) {
    const appNameLower = app.name.toLowerCase();
    let score = 0;

    // CAS 1 : Nom exact complet (100 points)
    if (appNameLower === queryLower) {
      score = 100;
    }
    // CAS 2 : Nom contient la requête exacte (95 points)
    else if (appNameLower.includes(queryLower)) {
      score = 95;
    }
    // CAS 3 : Recherche multi-mots (NOUVEAU)
    else if (queryWords.length > 1) {
      // Vérifier combien de mots de la requête sont présents dans l'app
      const matchedWords = queryWords.filter((word) => {
        // Chercher dans le nom
        if (appNameLower.includes(word)) return true;

        // Chercher dans les keywords
        if (app.keywords.some((kw) => kw.includes(word) || word.includes(kw)))
          return true;

        return false;
      });

      const matchRatio = matchedWords.length / queryWords.length;

      // Si TOUS les mots matchent : excellent score
      if (matchRatio === 1.0) {
        score = 90; // Tous les mots présents

        // Bonus si les mots sont dans le nom (plus pertinent que keywords)
        const wordsInName = queryWords.filter((word) =>
          appNameLower.includes(word),
        );
        if (wordsInName.length === queryWords.length) {
          score = 95; // Tous les mots dans le nom
        }
      }
      // Si au moins 50% des mots matchent
      else if (matchRatio >= 0.5) {
        score = Math.floor(50 * matchRatio);
      }
    }
    // CAS 4 : Requête simple (1 mot)
    else {
      const singleWord = queryWords[0];

      // Mot exact dans keywords
      if (app.keywords.some((kw) => kw === singleWord)) {
        score = 80;
      }
      // Mot partiel dans keywords
      else if (
        app.keywords.some(
          (kw) => kw.includes(singleWord) || singleWord.includes(kw),
        )
      ) {
        score = 70;
      }
      // Mot dans le nom
      else if (appNameLower.includes(singleWord)) {
        score = 60;
      }
      // Mot dans le chemin
      else if (app.path.toLowerCase().includes(singleWord)) {
        score = 40;
      }
    }

    if (score > 0) {
      results.push({ app, score });
    }
  }

  // Trier par score décroissant
  return results.sort((a, b) => b.score - a.score).map((r) => r.app);
}

/**
 * Sauvegarde l'index dans un fichier JSON
 * @param {IndexedApp[]} apps - Applications à sauvegarder
 * @param {string} filename - Nom du fichier
 */
export async function saveIndexToFile(apps, filename = "apps-index.json") {
  const data = JSON.stringify(apps, null, 2);
  await fs.writeFile(filename, data, "utf-8");
  console.log(`💾 Index saved to ${filename}`);
}

/**
 * Charge l'index depuis un fichier JSON
 * @param {string} filename - Nom du fichier
 * @returns {Promise<IndexedApp[]>} Applications chargées
 */
export async function loadIndexFromFile(filename = "apps-index.json") {
  try {
    const data = await fs.readFile(filename, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.log(`ℹ️  No existing index found`);
    return [];
  }
}

// Si exécuté directement (node appIndexer.js)
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  (async () => {
    try {
      const apps = await indexApplications();
      await saveIndexToFile(apps);

      console.log("\n📋 Sample results:");
      apps.slice(0, 10).forEach((app, i) => {
        console.log(`${i + 1}. ${app.name}`);
        console.log(`   Path: ${app.path}`);
        console.log(`   Keywords: ${app.keywords.join(", ")}\n`);
      });
    } catch (error) {
      console.error("Fatal error:", error);
      process.exit(1);
    }
  })();
}
