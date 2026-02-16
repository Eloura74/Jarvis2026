/**
 * Serveur Express pour J.A.R.V.I.S. (MODULARISÉ)
 * @module server
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { spawn } from "child_process";

// Charger les variables d'environnement (depuis la racine)
dotenv.config({ path: "../.env.local" });

// DISPATCHER PLATEFORME
import {
  windowManager,
  automation,
  systemControl,
} from "./platform/dispatcher.js";

// SERVICES CORE
import {
  indexApplications,
  searchApplications,
  saveIndexToFile,
  loadIndexFromFile,
} from "./appIndexer.js";
import localMemory from "./services/localMemory.js";

// ROUTES MODULAIRES
import appsRoutes from "./routes/apps.js";
import shortcutsRoutes from "./routes/shortcuts.js";
import commandsRoutes from "./routes/commands.js";
import googleRoutes from "./routes/google.js";
import systemRoutes from "./routes/system.js";
import windowsRoutes from "./routes/windows.js";
import filesRoutes from "./routes/files.js";
import memoryRoutes from "./routes/memory.js";
import webRoutes from "./routes/web.js";
import configRoutes from "./routes/config.js";
import bambuRoutes from "./routes/bambu.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ENREGISTREMENT DES ROUTES
app.use("/api/apps", appsRoutes);
app.use("/api/shortcuts", shortcutsRoutes);
app.use("/api/commands", commandsRoutes);
app.use("/api/google", googleRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/windows", windowsRoutes);
app.use("/api/automation", windowsRoutes); // Partagé avec windowsRoutes
app.use("/api/files", filesRoutes);
app.use("/api/memory", memoryRoutes);
app.use("/api/web", webRoutes);
app.use("/api/config", configRoutes); // Config persistante
app.use("/api/bambu", bambuRoutes); // Bambu MQTT proxy

// Index des applications (chargé en mémoire)
let appsIndex = [];
let indexing = false;
let lastIndexTime = null;

/**
 * Initialise l'index au démarrage du serveur
 */
async function initializeIndex() {
  console.log("🚀 J.A.R.V.I.S. Mainframe starting...\n");
  appsIndex = await loadIndexFromFile();

  if (appsIndex.length > 0) {
    console.log(`✅ Loaded ${appsIndex.length} apps from cache`);
    lastIndexTime = new Date();
  } else {
    await reindexApplications();
  }

  // Initialisation de la mémoire locale (RAG)
  await localMemory.initialize();
}

/**
 * Ré-indexe toutes les applications
 */
async function reindexApplications() {
  if (indexing) return;
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

// --- ROUTES STATIQUES / STATUS ---
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    appsCount: appsIndex.length,
    lastIndexTime: lastIndexTime,
    indexing: indexing,
  });
});

app.get("/api/search", (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing query" });
  const results = searchApplications(appsIndex, query);
  res.json({ query, count: results.length, results: results.slice(0, 10) });
});

app.post("/api/launch", async (req, res) => {
  const { path, args } = req.body;
  if (!path) return res.status(400).json({ error: "Missing path" });

  try {
    const fs = await import("fs/promises");
    await fs.access(path);
    const spawnArgs = Array.isArray(args) ? args : [];
    const child = spawn(path, spawnArgs, { detached: true, stdio: "ignore" });
    child.on("error", (err) =>
      console.error(`❌ Launch error: ${err.message}`),
    );
    child.unref();
    res.json({ success: true, message: `Launched: ${path}`, pid: child.pid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/reindex", async (req, res) => {
  if (indexing) return res.status(409).json({ error: "Indexing in progress" });
  reindexApplications();
  res.json({ success: true, message: "Reindexing started" });
});

// GLOBAL ERROR HANDLERS (Prévention crash)
process.on("uncaughtException", (error) => {
  console.error(`❌ UNCAUGHT EXCEPTION: ${error.message}`);
});
process.on("unhandledRejection", (reason) => {
  console.error(`❌ UNHANDLED REJECTION: ${reason}`);
});

// Import Bambu MQTT service
import { initBambuMqtt } from "./services/bambuMqtt.js";

// START
initializeIndex().then(() => {
  // Init Bambu MQTT connection
  initBambuMqtt();

  app.listen(PORT, () => {
    console.log(`✅ J.A.R.V.I.S. Core running on http://localhost:${PORT}`);
  });
});
