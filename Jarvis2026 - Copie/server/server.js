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
import { spawn } from "child_process";
import {
  indexApplications,
  searchApplications,
  saveIndexToFile,
  loadIndexFromFile,
} from "./appIndexer.js";
import * as windowManager from "./windowManager.js";
import * as automation from "./automation.js";

const app = express();
const PORT = 3001;

// Middleware
app.use(cors()); // Permettre les requêtes depuis le frontend (localhost:5003)
app.use(express.json());

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
    await reindexApplications();
  }
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

/**
 * GET /api/apps
 * Retourne toutes les applications indexées
 */
app.get("/api/apps", (req, res) => {
  res.json({
    count: appsIndex.length,
    apps: appsIndex,
  });
});

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
 * Body: { "path": "C:\\Program Files\\..." }
 */
app.post("/api/launch", (req, res) => {
  const { path } = req.body;

  if (!path) {
    return res.status(400).json({
      error: 'Missing "path" in request body',
    });
  }

  console.log(`🚀 Launching: ${path}`);

  try {
    // Lancer l'application en arrière-plan
    const child = spawn(path, [], {
      detached: true,
      stdio: "ignore",
    });

    // Détacher le processus pour qu'il continue après la fermeture du serveur
    child.unref();

    res.json({
      success: true,
      message: `Launched: ${path}`,
    });
  } catch (error) {
    console.error(`❌ Failed to launch: ${error.message}`);
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
app.post("/api/windows/focus", (req, res) => {
  const { windowTitle } = req.body;

  if (!windowTitle) {
    return res.status(400).json({
      error: 'Missing "windowTitle" in request body',
    });
  }

  console.log(`🔍 Focusing window: "${windowTitle}"`);

  try {
    const success = windowManager.focusWindow(windowTitle);

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
app.post("/api/windows/close", (req, res) => {
  const { windowTitle } = req.body;

  if (!windowTitle) {
    return res.status(400).json({
      error: 'Missing "windowTitle" in request body',
    });
  }

  console.log(`❌ Closing window: "${windowTitle}"`);

  try {
    const success = windowManager.closeWindow(windowTitle);

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
app.post("/api/windows/minimize", (req, res) => {
  const { windowTitle } = req.body;

  if (!windowTitle) {
    return res.status(400).json({
      error: 'Missing "windowTitle" in request body',
    });
  }

  console.log(`⬇️  Minimizing window: "${windowTitle}"`);

  try {
    const success = windowManager.minimizeWindow(windowTitle);

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
app.post("/api/windows/maximize", (req, res) => {
  const { windowTitle } = req.body;

  if (!windowTitle) {
    return res.status(400).json({
      error: 'Missing "windowTitle" in request body',
    });
  }

  console.log(`⬆️  Maximizing window: "${windowTitle}"`);

  try {
    const success = windowManager.maximizeWindow(windowTitle);

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
    console.log(`\n🎯 Ready to serve requests!\n`);
  });
});
