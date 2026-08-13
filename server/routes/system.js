import express from "express";
import { systemControl } from "../platform/dispatcher.js";
import { getSystemStats, getLightStats } from "../systemStats.js";
import {
  moveWindowToScreen,
  listProcesses,
  killProcess,
  setVolume,
  muteAudio,
  getVolume,
} from "../services/systemService.js";
import { searchLimiter, strictLimiter } from "../middleware/index.js";
import { duckAudio, restoreAudio } from "../services/duckingService.js";

const router = express.Router();

/**
 * Routes pour le contrôle système (Volume, Luminosité, Session, Média, Stats)
 */

// --- STATS ---
router.get("/stats", async (req, res) => {
  try {
    const stats = await getSystemStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/stats/light", async (req, res) => {
  try {
    const stats = await getLightStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- VOLUME ---
router.post("/volume", async (req, res) => {
  try {
    const result = await systemControl.controlVolume(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- BRIGHTNESS ---
router.post("/brightness", async (req, res) => {
  try {
    const result = await systemControl.controlBrightness(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SCREENSHOT ---
router.post("/screenshot", async (req, res) => {
  try {
    const result = await systemControl.takeScreenshot(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- POWER / SESSION ---
router.post("/power", async (req, res) => {
  try {
    const result = await systemControl.controlSession(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- MEDIA ---
router.post("/media/control", async (req, res) => {
  try {
    const result = await systemControl.controlMedia(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- FENÊTRES MULTI-ÉCRANS ---
router.post("/window/move-screen", strictLimiter, async (req, res) => {
  try {
    const { appName, screenNumber } = req.body;
    const result = await moveWindowToScreen(appName, screenNumber);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GESTIONNAIRE DE TÂCHES ---
router.get("/processes", searchLimiter, async (req, res) => {
  try {
    const { sortBy, limit } = req.query;
    const processes = await listProcesses(sortBy, parseInt(limit) || 10);
    res.json({ success: true, processes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/process/kill", strictLimiter, async (req, res) => {
  try {
    const { processName, force } = req.body;
    const result = await killProcess(processName, force);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CONTRÔLE AUDIO AVANCÉ ---
router.get("/audio/volume", async (req, res) => {
  try {
    const volumeInfo = await getVolume();
    res.json({ success: true, ...volumeInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/audio/volume", strictLimiter, async (req, res) => {
  try {
    const { action, level } = req.body;
    let result;

    if (action === "set" && level !== undefined) {
      result = await setVolume(level);
    } else if (action === "mute") {
      result = await muteAudio(true);
    } else if (action === "unmute") {
      result = await muteAudio(false);
    } else {
      return res.status(400).json({ error: "Action invalide" });
    }

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- AUDIO DUCKING ---
/**
 * POST /api/system/duck/start
 * Baisse le volume des autres apps pendant que Jarvis parle
 */
router.post("/duck/start", async (_req, res) => {
  try {
    await duckAudio();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/system/duck/stop
 * Restaure le volume après la parole de Jarvis
 */
router.post("/duck/stop", async (_req, res) => {
  try {
    await restoreAudio();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
