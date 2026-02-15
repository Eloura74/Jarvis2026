import express from "express";
import { systemControl } from "../platform/dispatcher.js";
import { getSystemStats, getLightStats } from "../systemStats.js";

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

export default router;
