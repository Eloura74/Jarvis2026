/**
 * Serveur Express pour J.A.R.V.I.S. (MODULARISÉ)
 * @module server
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { spawn } from "child_process";

// Charger les variables d'environnement
// 1. Racine du projet (Home Assistant, WhatsApp, etc.)
dotenv.config({ path: "../.env.local" });
// 2. Dossier server/ (GEMINI_API_KEY et secrets backend uniquement)
dotenv.config({ path: "./.env.local" });

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
import weatherRoutes from "./routes/weather.js";
import eventsRoutes from "./routes/events.js";
import whatsappRoutes from "./routes/whatsapp.js";
import sleepRoutes from "./routes/sleep.js";
import briefingRoutes from "./routes/briefing.js";
import cameraRoutes from "./routes/camera.js";
import geminiRoutes from "./routes/gemini.js"; // S1 : Proxy Gemini (clé API côté serveur)

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
app.use("/api/files", filesRoutes);
app.use("/api/memory", memoryRoutes);
app.use("/api/web", webRoutes);
app.use("/api/config", configRoutes); // Config persistante
app.use("/api/bambu", bambuRoutes); // Bambu MQTT proxy
app.use("/api/weather", weatherRoutes); // Weather Proxy
app.use("/api/events", eventsRoutes); // Jarvis Push Notifications
app.use("/api/whatsapp", whatsappRoutes); // WhatsApp Auth and Status
app.use("/api/sleep", sleepRoutes); // Mode Veille Intelligente
app.use("/api/briefing", briefingRoutes); // Briefing Vocal Matinal
app.use("/api/camera", cameraRoutes); // Snapshots Webcam HA
app.use("/api/gemini", geminiRoutes); // S1 : Proxy Gemini (clé API sécurisée côté serveur)

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
// Import Sphere Service
import { initSphereService } from "./services/sphereService.js";
import sphereRoutes from "./routes/sphere.js";
// Import WhatsApp Service
import { initWhatsAppService } from "./services/whatsappService.js";
// Import Calendar Reminder Service
import { startCalendarReminder } from "./services/calendarReminder.js";

// START
initializeIndex().then(() => {
  // Init Bambu MQTT connection
  initBambuMqtt();
  // Init Sphere Serial connection
  initSphereService();
  // Init WhatsApp connection
  initWhatsAppService();
  // Init Calendar Reminder (rappels proactifs)
  startCalendarReminder();

  // Register Sphere Routes
  app.use("/api/sphere", sphereRoutes);

  app.listen(PORT, () => {
    console.log(`✅ J.A.R.V.I.S. Core running on http://localhost:${PORT}`);
  });
});
