/**
 * Serveur Express pour J.A.R.V.I.S. (MODULARISÉ)
 * @module server
 */

import express from "express";
import dotenv from "dotenv";
import path from "path";
import { spawn, exec } from "child_process";

// Charger les variables d'environnement
// On charge .env.local depuis la racine de Jarvis2026
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// MIDDLEWARES DE SÉCURITÉ
import {
  corsMiddleware,
  apiLimiter,
  sanitizeAll,
  errorHandler,
  notFoundHandler,
} from "./middleware/index.js";

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
import temperatureRoutes from "./routes/temperature.js"; // Monitoring températures
import mapsRoutes from "./routes/maps.js"; // Google Maps Directions
import phoneRoutes from "./routes/phone.js"; // Smartphone KDE Connect
import truenasRoutes from "./routes/truenas.js"; // TrueNAS Monitoring
import securityRoutes from "./routes/security.js"; // Sécurité & Surveillance HA
import mediaRoutes from "./routes/media.js"; // Multimédia (YouTube, Spotify, Plex)
import visionRoutes from "./routes/vision.js"; // Vision Gemini (webcam, analyse image)
import sphereRoutes from "./routes/sphere.js"; // Contrôle Sphere ESP32 (états, modes, texte)
import desktopRoutes from "./routes/desktop.js"; // Copilote Bureau Windows (capture d'écran)

const app = express();
const PORT = 3001;

// MIDDLEWARES GLOBAUX DE SÉCURITÉ
app.use(corsMiddleware); // CORS strict avec whitelist
app.use(express.json({ limit: "15mb" })); // Limite taille body (augmentée pour base64 images)
app.use(sanitizeAll); // Sanitization XSS/injection
app.use(apiLimiter); // Rate limiting global (100 req/15min)

// ENREGISTREMENT DES ROUTES
app.use("/api/apps", appsRoutes);
app.use("/api/shortcuts", shortcutsRoutes);
app.use("/api/commands", commandsRoutes);
app.use("/api/google", googleRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/windows", windowsRoutes);
app.use("/api/automation", windowsRoutes); // Alias : le frontend appelle /api/automation/type et /shortcut
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
app.use("/api/temperature", temperatureRoutes); // Monitoring températures (OpenWeather, piscine, PC/NAS)
app.use("/api/maps", mapsRoutes); // Google Maps Directions (temps trajet avec trafic)
app.use("/api/phone", phoneRoutes); // Smartphone KDE Connect (notifications, appels, SMS)
app.use("/api/truenas", truenasRoutes); // TrueNAS Monitoring (pools, disques, services)
app.use("/api/security", securityRoutes); // Sécurité & Surveillance HA (alarme, caméras, mouvement)
app.use("/api/media", mediaRoutes); // Multimédia (YouTube, Spotify, Plex)
app.use("/api/vision", visionRoutes); // Vision Gemini (webcam, analyse image)
app.use("/api/sphere", sphereRoutes); // Contrôle Sphere ESP32 (états, modes, texte)
app.use("/api/desktop", desktopRoutes); // Copilote Bureau Windows (capture d'écran)

// Route directe pour lancer une application par son chemin
app.post("/api/launch", async (req, res) => {
  try {
    const { path, args } = req.body;
    console.log(`🚀 [launch] Requête reçue:`, { path, args, body: req.body });

    if (!path) {
      console.error(`❌ [launch] Chemin manquant`);
      return res.status(400).json({ error: "Chemin d'application requis" });
    }

    // Décoder le chemin HTML-escaped par sanitizeAll
    const decodedPath = path
      .replace(/&#x2F;/g, "/")
      .replace(/&#x3A;/g, ":")
      .replace(/&#x5C;/g, "\\")
      .replace(/&amp;/g, "&");

    console.log(`📍 [launch] Chemin décodé: ${decodedPath}`);

    // Décoder aussi les arguments (mêmes entités HTML que le path)
    const decodedArgs = (args || []).map((a) =>
      String(a)
        .replace(/&#x2F;/g, "/")
        .replace(/&#x3A;/g, ":")
        .replace(/&#x5C;/g, "\\")
        .replace(/&amp;/g, "&"),
    );

    if (decodedPath.toLowerCase().endsWith(".exe")) {
      // Lancement DIRECT du .exe : pas de shell, pas de "start", pas de
      // problème de guillemets. Le plus fiable sous Windows.
      console.log(
        `⚙️ [launch] Spawn direct: ${decodedPath} ${decodedArgs.join(" ")}`,
      );
      await new Promise((resolve, reject) => {
        const child = spawn(decodedPath, decodedArgs, {
          detached: true,
          stdio: "ignore",
        });
        child.on("error", reject);
        child.on("spawn", () => {
          child.unref();
          resolve();
        });
      });
    } else {
      // Fichiers non-exe (.lnk, documents…) : ouvrir via le shell
      let command = `start "" "${decodedPath}"`;
      if (decodedArgs.length > 0) {
        command += " " + decodedArgs.map((a) => `"${a}"`).join(" ");
      }
      console.log(`⚙️ [launch] Commande shell: ${command}`);
      await new Promise((resolve, reject) => {
        exec(command, { windowsHide: true, timeout: 10000 }, (error) =>
          error ? reject(error) : resolve(),
        );
      });
    }

    console.log(`✅ [launch] Application lancée: ${decodedPath}`);
    res.json({ success: true, path: decodedPath });
  } catch (error) {
    console.error(`❌ [launch] Erreur:`, error);
    res.status(500).json({ error: "Erreur lancement", details: error.message });
  }
});

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

// MIDDLEWARES DE GESTION D'ERREURS (en dernier)
app.use(notFoundHandler); // 404 pour routes non trouvées
app.use(errorHandler); // Gestion centralisée des erreurs

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
  // Init WhatsApp connection (DÉSACTIVÉ temporairement - QR Code ne fonctionne pas)
  // initWhatsAppService();
  // Init Calendar Reminder (rappels proactifs)
  startCalendarReminder();

  app.listen(PORT, () => {
    console.log(`✅ J.A.R.V.I.S. Core running on http://localhost:${PORT}`);
  });
});
