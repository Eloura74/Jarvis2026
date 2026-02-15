/**
 * Serveur Express pour J.A.R.V.I.S.
 *
 * API REST qui expose :
 * - GET /api/apps - Liste toutes les applications indexées
 * - GET /api/search?q=bambu - Recherche une application
 * - POST /api/launch - Lance une application
 * - GET /api/reindex - Force une ré-indexation
 *
 * @module server
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Charger les variables d'environnement (.env.local)
dotenv.config({ path: "./.env.local" });
import { spawn } from "child_process";
import {
  windowManager,
  automation,
  systemControl,
} from "./platform/dispatcher.js";
import {
  indexApplications,
  searchApplications,
  saveIndexToFile,
  loadIndexFromFile,
} from "./appIndexer.js";
import { getSystemStats, getLightStats } from "./systemStats.js";
import appsRoutes from "./routes/apps.js";
import shortcutsRoutes from "./routes/shortcuts.js";
import commandsRoutes from "./routes/commands.js";
import googleRoutes from "./routes/google.js";
import * as googleService from "./googleService.js";
import localMemory from "./services/localMemory.js";
import secureFileManager from "./services/secureFileManager.js"; // NOUVEAU
import webScraper from "./services/webScraper.js"; // NOUVEAU

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Routes API - Gestion Google
console.log("🛠️  Debug: googleService keys:", Object.keys(googleService));
app.use("/api/google", googleRoutes);

// Routes API - Gestion des applications (CRUD)
app.use("/api/apps", appsRoutes);

// Routes API - Gestion des raccourcis
app.use("/api/shortcuts", shortcutsRoutes);

// Routes API - Gestion des commandes
app.use("/api/commands", commandsRoutes);

// Index des applications (chargé en mémoire)
let appsIndex = [];
let indexing = false;
let lastIndexTime = null;

/**
 * Initialise l'index au démarrage du serveur
 */
async function initializeIndex() {
  console.log("🚀 J.A.R.V.I.S. Backend starting...\n");

  // Essayer de charger un index existant
  appsIndex = await loadIndexFromFile();

  if (appsIndex.length > 0) {
    console.log(`✅ Loaded ${appsIndex.length} apps from cache\n`);
    lastIndexTime = new Date();
  } else {
    // Pas de cache : indexer maintenant
    console.log("📁 No cache found, indexing system...\n");
    console.log("📁 No cache found, indexing system...\n");
    await reindexApplications();
  }

  // Initialisation de la mémoire locale (RAG)
  await localMemory.initialize();
}

/**
 * Ré-indexe toutes les applications
 */
async function reindexApplications() {
  if (indexing) {
    console.log("⚠️  Indexing already in progress");
    return;
  }

  indexing = true;

  try {
    appsIndex = await indexApplications();
    await saveIndexToFile(appsIndex);
    lastIndexTime = new Date();
  } catch (error) {
    console.error("❌ Indexing failed:", error);
  } finally {
    indexing = false;
  }
}

// ============================================================================
// ROUTES API
// ============================================================================

/**
 * GET /api/status
 * Retourne l'état du serveur
 */
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    appsCount: appsIndex.length,
    lastIndexTime: lastIndexTime,
    indexing: indexing,
  });
});

// Note: /api/apps est maintenant géré par appsRoutes dans ./routes/apps.js

/**
 * GET /api/search?q=bambu
 * Recherche une application
 */
app.get("/api/search", (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({
      error: 'Missing query parameter "q"',
    });
  }

  console.log(`🔍 Searching for: "${query}"`);

  const results = searchApplications(appsIndex, query);

  console.log(`   Found ${results.length} results`);

  res.json({
    query: query,
    count: results.length,
    results: results.slice(0, 10), // Top 10 résultats
  });
});

/**
 * POST /api/launch
 * Lance une application
 * Body: { "path": "C:\\Program Files\\...", "args": ["url"] }
 */
app.post("/api/launch", async (req, res) => {
  const { path, args } = req.body;

  if (!path) {
    return res.status(400).json({
      error: 'Missing "path" in request body',
    });
  }

  console.log(`🚀 [LAUNCH REQUEST] Path: ${path}`);
  if (args && args.length > 0) {
    console.log(`   📋 Arguments: ${JSON.stringify(args)}`);
  }

  try {
    // Vérifier que le fichier existe (prévention crash)
    const fs = await import("fs/promises");
    try {
      await fs.access(path);
      console.log(`   ✅ Path exists and is accessible`);
    } catch (accessError) {
      console.error(`   ❌ Path not accessible: ${accessError.message}`);
      return res.status(404).json({
        success: false,
        error: `File not found or not accessible: ${path}`,
      });
    }

    console.log(`   📂 Spawning process...`);

    // Lancer l'application en arrière-plan avec arguments optionnels
    const spawnArgs = args && Array.isArray(args) ? args : [];
    const child = spawn(path, spawnArgs, {
      detached: true,
      stdio: "ignore",
      shell: false, // Pas de shell pour éviter injection
    });

    // Handler d'erreur CRITIQUE sur le child process
    // Sans ceci, une erreur child peut crasher le serveur parent
    child.on("error", (err) => {
      console.error(`   ❌ Child process error: ${err.message}`);
      console.error(`   Stack: ${err.stack}`);
      // NE PAS crasher le serveur, juste logger
    });

    child.on("spawn", () => {
      console.log(`   ✅ Process spawned successfully (PID: ${child.pid})`);
    });

    child.on("exit", (code, signal) => {
      if (code !== null) {
        console.log(`   ℹ️  Process exited with code ${code}`);
      }
      if (signal !== null) {
        console.log(`   ℹ️  Process killed with signal ${signal}`);
      }
    });

    // Détacher le processus pour qu'il continue après la fermeture du serveur
    child.unref();
    console.log(`   🔓 Process detached and unreferenced`);

    res.json({
      success: true,
      message: `Launched: ${path}`,
      pid: child.pid,
    });

    console.log(`   ✅ Response sent to client\\n`);
  } catch (error) {
    console.error(`❌ [LAUNCH FAILED] ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/reindex
 * Force une ré-indexation du système
 */
app.post("/api/reindex", async (req, res) => {
  if (indexing) {
    return res.status(409).json({
      error: "Indexing already in progress",
    });
  }

  console.log("🔄 Manual reindex requested");

  // Lancer la ré-indexation en arrière-plan
  reindexApplications();

  res.json({
    success: true,
    message: "Reindexing started",
  });
});

// ============================================================================
// ENDPOINTS STATS SYSTÈME
// ============================================================================

/**
 * GET /api/system/stats
 * Récupère les statistiques système complètes
 * (CPU, RAM, Réseau, Processus, Température)
 */
app.get("/api/system/stats", async (req, res) => {
  try {
    const stats = await getSystemStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error(`❌ Failed to get system stats: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/system/stats/light
 * Récupère uniquement les stats légères (CPU, RAM, Processus)
 * Plus rapide, optimisé pour polling fréquent
 */
app.get("/api/system/stats/light", async (req, res) => {
  try {
    const stats = await getLightStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error(`❌ Failed to get light stats: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// ENDPOINTS WINDOW MANAGEMENT
// ============================================================================

/**
 * GET /api/windows
 * Liste toutes les fenêtres ouvertes
 */
app.get("/api/windows", (req, res) => {
  try {
    const windows = windowManager.listWindows();
    res.json({
      count: windows.length,
      windows: windows,
    });
  } catch (error) {
    console.error(`❌ Failed to list windows: ${error.message}`);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * POST /api/windows/focus
 * Met au premier plan la fenêtre spécifiée
 * Body: { "windowTitle": "Chrome" }
 */
app.post("/api/windows/focus", async (req, res) => {
  const { windowTitle } = req.body;

  if (!windowTitle) {
    return res.status(400).json({
      error: 'Missing "windowTitle" in request body',
    });
  }

  console.log(`🔍 Focusing window: "${windowTitle}"`);

  try {
    const success = await windowManager.focusWindow(windowTitle);

    if (success) {
      res.json({ success: true, message: `Focused: ${windowTitle}` });
    } else {
      res.status(404).json({ success: false, error: "Window not found" });
    }
  } catch (error) {
    console.error(`❌ Failed to focus window: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/windows/close
 * Ferme la fenêtre spécifiée
 * Body: { "windowTitle": "Notepad" }
 */
app.post("/api/windows/close", async (req, res) => {
  const { windowTitle } = req.body;

  if (!windowTitle) {
    return res.status(400).json({
      error: 'Missing "windowTitle" in request body',
    });
  }

  console.log(`❌ Closing window: "${windowTitle}"`);

  try {
    const success = await windowManager.closeWindow(windowTitle);

    if (success) {
      res.json({ success: true, message: `Closed: ${windowTitle}` });
    } else {
      res.status(404).json({ success: false, error: "Window not found" });
    }
  } catch (error) {
    console.error(`❌ Failed to close window: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/windows/minimize
 * Minimise la fenêtre spécifiée
 * Body: { "windowTitle": "Chrome" }
 */
app.post("/api/windows/minimize", async (req, res) => {
  const { windowTitle } = req.body;

  if (!windowTitle) {
    return res.status(400).json({
      error: 'Missing "windowTitle" in request body',
    });
  }

  console.log(`⬇️  Minimizing window: "${windowTitle}"`);

  try {
    const success = await windowManager.minimizeWindow(windowTitle);

    if (success) {
      res.json({ success: true, message: `Minimized: ${windowTitle}` });
    } else {
      res.status(404).json({ success: false, error: "Window not found" });
    }
  } catch (error) {
    console.error(`❌ Failed to minimize window: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/windows/maximize
 * Agrandit la fenêtre spécifiée
 * Body: { "windowTitle": "Chrome" }
 */
app.post("/api/windows/maximize", async (req, res) => {
  const { windowTitle } = req.body;

  if (!windowTitle) {
    return res.status(400).json({
      error: 'Missing "windowTitle" in request body',
    });
  }

  console.log(`⬆️  Maximizing window: "${windowTitle}"`);

  try {
    const success = await windowManager.maximizeWindow(windowTitle);

    if (success) {
      res.json({ success: true, message: `Maximized: ${windowTitle}` });
    } else {
      res.status(404).json({ success: false, error: "Window not found" });
    }
  } catch (error) {
    console.error(`❌ Failed to maximize window: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENDPOINTS AUTOMATION
// ============================================================================

/**
 * POST /api/automation/type
 * Tape du texte dans la fenêtre active
 * Body: { "text": "Hello World" }
 */
app.post("/api/automation/type", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      error: 'Missing "text" in request body',
    });
  }

  console.log(`⌨️  Typing: "${text}"`);

  try {
    const success = await automation.typeText(text);

    if (success) {
      res.json({ success: true, message: `Typed: ${text}` });
    } else {
      res.status(500).json({ success: false, error: "Failed to type text" });
    }
  } catch (error) {
    console.error(`❌ Failed to type: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/automation/shortcut
 * Envoie un raccourci clavier
 * Body: { "keys": "ctrl+c" }
 */
app.post("/api/automation/shortcut", async (req, res) => {
  const { keys } = req.body;

  if (!keys) {
    return res.status(400).json({
      error: 'Missing "keys" in request body',
    });
  }

  console.log(`⌨️  Shortcut: ${keys}`);

  try {
    const success = await automation.sendShortcut(keys);

    if (success) {
      res.json({ success: true, message: `Sent: ${keys}` });
    } else {
      res
        .status(500)
        .json({ success: false, error: "Failed to send shortcut" });
    }
  } catch (error) {
    console.error(`❌ Failed to send shortcut: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENDPOINTS SYSTEM CONTROL (NOUVELLES ROUTES)
// ============================================================================

/**
 * POST /api/system/volume
 * Contrôle volume audio
 * Body: { action: "set"|"increase"|"decrease"|"mute"|"unmute", value?: 0-100 }
 */
app.post("/api/system/volume", async (req, res) => {
  try {
    const { action, value } = req.body;
    console.log(
      `🔊 [Server] Requête volume: ${action}${value ? ` à ${value}%` : ""}`,
    );
    const result = await systemControl.controlVolume(req.body);
    res.json(result);
  } catch (error) {
    console.error(`❌ [Server] Erreur volume:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/system/brightness
 * Contrôle luminosité écran
 * Body: { action: "set"|"increase"|"decrease", value?: 0-100 }
 */
app.post("/api/system/brightness", async (req, res) => {
  try {
    const result = await systemControl.controlBrightness(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/files/action
 * Gestion fichiers et dossiers
 * Body: { action: "create"|"delete"|"move"|"copy", path, destination?, type? }
 */
app.post("/api/files/action", async (req, res) => {
  try {
    const { action, path, destination, type } = req.body;

    if (!action || !path) {
      return res.status(400).json({ error: "Action et path requis" });
    }

    // Sécurité: bloquer system32
    const forbidden = ["system32", "windows", "program files"];
    if (forbidden.some((f) => path.toLowerCase().includes(f))) {
      return res.status(403).json({ error: "Accès interdit à ce dossier" });
    }

    console.log(`📁 Fichier ${action}: ${path}`);

    // Implémentation avec fs natif
    const fs = await import("fs/promises");

    switch (action) {
      case "create":
        if (type === "directory") {
          await fs.mkdir(path, { recursive: true });
          console.log(`   ✅ Dossier créé: ${path}`);
          res.json({ success: true, message: `Dossier créé: ${path}` });
        } else {
          await fs.writeFile(path, "");
          console.log(`   ✅ Fichier créé: ${path}`);
          res.json({ success: true, message: `Fichier créé: ${path}` });
        }
        break;

      case "delete":
        const stats = await fs.stat(path);
        if (stats.isDirectory()) {
          await fs.rm(path, { recursive: true, force: true });
          console.log(`   ✅ Dossier supprimé: ${path}`);
          res.json({ success: true, message: `Dossier supprimé` });
        } else {
          await fs.unlink(path);
          console.log(`   ✅ Fichier supprimé: ${path}`);
          res.json({ success: true, message: `Fichier supprimé` });
        }
        break;

      case "move":
        if (!destination) {
          return res.status(400).json({ error: "Destination requise" });
        }
        await fs.rename(path, destination);
        console.log(`   ✅ Déplacé: ${path} → ${destination}`);
        res.json({ success: true, message: `Déplacé vers ${destination}` });
        break;

      case "copy":
        if (!destination) {
          return res.status(400).json({ error: "Destination requise" });
        }
        await fs.copyFile(path, destination);
        console.log(`   ✅ Copié: ${path} → ${destination}`);
        res.json({ success: true, message: `Copié vers ${destination}` });
        break;

      default:
        res.status(400).json({ error: "Action inconnue" });
    }
  } catch (error) {
    console.error("Erreur route fichiers:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/files/search
 * Recherche fichiers
 * Query: ?query=...&path=...&maxResults=...
 */
app.get("/api/files/search", async (req, res) => {
  try {
    const { query, path, maxResults } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Query requise" });
    }

    console.log(`🔍 Recherche fichiers: ${query}`);

    // Implémentation avec fast-glob
    const fg = (await import("fast-glob")).default;
    const basePath = path || process.env.USERPROFILE;
    const limit = maxResults ? parseInt(maxResults) : 50;

    const pattern = `${basePath}/**/*${query}*`;
    const results = await fg(pattern, {
      caseSensitiveMatch: false,
      ignore: ["**/node_modules/**", "**/.git/**", "**/AppData/**"],
      onlyFiles: true,
      absolute: true,
    });

    const limitedResults = results.slice(0, limit);
    console.log(`   ✅ Trouvé: ${limitedResults.length} fichiers`);

    res.json({
      success: true,
      results: limitedResults,
      total: results.length,
    });
  } catch (error) {
    console.error("Erreur route recherche:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/system/screenshot
 * Capture d'écran
 * Body: { savePath?: string }
 */
app.post("/api/system/screenshot", async (req, res) => {
  try {
    const result = await systemControl.takeScreenshot(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/system/power
 * Contrôle session (lock, shutdown, restart, sleep)
 * Body: { action: "lock"|"shutdown"|"restart"|"sleep", delay?: number }
 */
app.post("/api/system/power", async (req, res) => {
  try {
    const result = await systemControl.controlSession(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/media/control
 * Contrôle lecture média
 * Body: { action: "play"|"pause"|"next"|"previous"|"stop" }
 */
app.post("/api/media/control", async (req, res) => {
  try {
    const result = await systemControl.controlMedia(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENDPOINTS FILE EXPLORER
// ============================================================================

/**
 * GET /api/files/list?path=C:\Users
 * Liste les fichiers et dossiers d'un répertoire
 */
app.get("/api/files/list", async (req, res) => {
  try {
    const os = await import("os");
    const dirPath = req.query.path || os.homedir();
    const showHidden = req.query.showHidden === "true";

    const result = await fileSystem.listDirectory(dirPath, showHidden);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Erreur listage fichiers:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/files/search?path=C:\Users&query=test
 * Recherche des fichiers
 */
app.get("/api/files/search", async (req, res) => {
  try {
    const os = await import("os");
    const searchPath = req.query.path || os.homedir();
    const query = req.query.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Paramètre 'query' manquant",
      });
    }

    const results = await fileSystem.searchFiles(searchPath, query, 50);
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("❌ Erreur recherche fichiers:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/files/quick-access
 * Retourne les dossiers d'accès rapide
 */
app.get("/api/files/quick-access", (req, res) => {
  try {
    const folders = fileSystem.getQuickAccessFolders();
    res.json({
      success: true,
      data: folders,
    });
  } catch (error) {
    console.error("❌ Erreur quick access:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/files/read?path=C:\file.txt
 * Lit le contenu d'un fichier texte
 */
app.get("/api/files/read", async (req, res) => {
  try {
    const filePath = req.query.path;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: "Paramètre 'path' manquant",
      });
    }

    const content = await fileSystem.readTextFile(filePath);
    res.json({
      success: true,
      data: { content },
    });
  } catch (error) {
    console.error("❌ Erreur lecture fichier:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// GLOBAL ERROR HANDLERS (Prévention crash serveur)
// ============================================================================

/**
 * Handler pour les exceptions non catchées
 * Sans ceci, une exception non gérée crasherait le serveur
 */
process.on("uncaughtException", (error, origin) => {
  console.error(`\n❌❌❌ UNCAUGHT EXCEPTION ❌❌❌`);
  console.error(`Origin: ${origin}`);
  console.error(`Error: ${error.message}`);
  console.error(`Stack: ${error.stack}`);
  console.error(
    `\n⚠️  Server is still running, but this should be investigated!\n`,
  );
  // NE PAS terminer le process, juste logger
  // process.exit(1); // ❌ Éviter le crash
});

/**
 * Handler pour les promesses rejetées non gérées
 * Prévient le crash si une Promise.reject() n'a pas de .catch()
 */
process.on("unhandledRejection", (reason, promise) => {
  console.error(`\n❌❌❌ UNHANDLED PROMISE REJECTION ❌❌❌`);
  console.error(`Promise:`, promise);
  console.error(`Reason:`, reason);
  console.error(
    `\n⚠️  Server is still running, but this should be investigated!\n`,
  );
  // NE PAS terminer le process
});

// ============================================================================
// ENDPOINTS MÉMOIRE LOCALE (RAG)
// ============================================================================

/**
 * POST /api/memory/scan
 * Lance l'indexation d'un dossier
 * Body: { path: "C:\\..." }
 */
app.post("/api/memory/scan", async (req, res) => {
  const { path } = req.body;

  if (!path) return res.status(400).json({ error: "Path required" });

  try {
    const result = await localMemory.indexDirectory(path);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/search
 * Recherche dans la mémoire locale
 * Query: ?q=terme
 */
app.get("/api/memory/search", (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Query required" });

  const results = localMemory.search(query);
  res.json({ count: results.length, results });
});

// ============================================================================
// ENDPOINTS GESTION FICHIERS SÉCURISÉE (AGENT DE CODE)
// ============================================================================

/**
 * POST /api/files/secure-read
 * Lecture sécurisée avec validation
 * Body: { path: "C:\\..." }
 */
app.post("/api/files/secure-read", async (req, res) => {
  const { path } = req.body;
  if (!path) return res.status(400).json({ error: "Path requis" });

  try {
    const content = await secureFileManager.readFile(path);
    res.json({ success: true, content });
  } catch (error) {
    console.error(`❌ Secure Read Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/files/secure-write
 * Écriture sécurisée avec backup
 * Body: { path: "C:\\...", content: "..." }
 */
app.post("/api/files/secure-write", async (req, res) => {
  const { path, content } = req.body;
  if (!path || content === undefined)
    return res.status(400).json({ error: "Path et content requis" });

  try {
    const result = await secureFileManager.writeFile(path, content);
    res.json(result);
  } catch (error) {
    console.error(`❌ Secure Write Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENDPOINTS RECHERCHE PROFONDE (AGENT WEB)
// ============================================================================

/**
 * POST /api/web/scrape
 * Scrape une page web de manière sécurisée (texte pur)
 * Body: { url: "https://..." }
 */
app.post("/api/web/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL requise" });

  try {
    const data = await webScraper.scrape(url);
    res.json({ success: true, data });
  } catch (error) {
    console.error(`❌ Web Scrape Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// DÉMARRAGE DU SERVEUR
// ============================================================================

initializeIndex().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ J.A.R.V.I.S. Backend running on http://localhost:${PORT}`);
    console.log(`\n📡 Available endpoints:`);
    console.log(`   GET  /api/status              - Server status`);
    console.log(`   GET  /api/apps                - List all apps`);
    console.log(`   GET  /api/search?q=...        - Search apps`);
    console.log(`   POST /api/launch              - Launch app`);
    console.log(`   POST /api/reindex             - Reindex system`);
    console.log(`   GET  /api/windows             - List windows`);
    console.log(`   POST /api/windows/focus       - Focus window`);
    console.log(`   POST /api/windows/close       - Close window`);
    console.log(`   POST /api/windows/minimize    - Minimize window`);
    console.log(`   POST /api/windows/maximize    - Maximize window`);
    console.log(`   POST /api/automation/type     - Type text`);
    console.log(`   POST /api/automation/shortcut - Send shortcut`);
    console.log(`   GET  /api/google/auth-url         - Get Google Auth URL`);
    console.log(`   GET  /api/google/callback         - Google OAuth callback`);
    console.log(`   GET  /api/google/gmail/list       - List recent emails`);
    console.log(`   POST /api/google/gmail/send       - Send email`);
    console.log(`   GET  /api/google/calendar/events  - List calendar events`);
    console.log(`   POST /api/google/calendar/events  - Create calendar event`);
    console.log(
      `   PUT  /api/google/calendar/events/:id - Update calendar event`,
    );
    console.log(
      `   DELETE /api/google/calendar/events/:id - Delete calendar event`,
    );
    console.log(`\n🎯 Ready to serve requests!`);
    console.log(
      `🛡️  Global error handlers active - server crash protection enabled\n`,
    );
  });
});
