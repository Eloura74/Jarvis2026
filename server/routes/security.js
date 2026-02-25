/**
 * Routes Sécurité & Surveillance
 * - État système sécurité
 * - Contrôle alarme
 * - Caméras
 * - Historique mouvement
 */

import express from "express";
import {
  getSecurityStatus,
  controlAlarm,
  getCameraSnapshot,
  listCameras,
  getMotionHistory,
} from "../services/securityService.js";
import { searchLimiter, strictLimiter } from "../middleware/index.js";

const router = express.Router();

/**
 * GET /api/security/status
 * Récupère l'état complet du système de sécurité
 */
router.get("/status", searchLimiter, async (req, res) => {
  try {
    const status = await getSecurityStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/security/alarm
 * Active ou désactive l'alarme
 * Body: { action: "arm" | "disarm", mode?: "home" | "away" }
 */
router.post("/alarm", strictLimiter, async (req, res) => {
  try {
    const { action, mode } = req.body;
    const result = await controlAlarm(action, mode);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/security/camera/snapshot
 * Capture un snapshot depuis une caméra
 * Query: camera=<nom_camera>
 */
router.get("/camera/snapshot", searchLimiter, async (req, res) => {
  try {
    const { camera } = req.query;
    if (!camera) {
      return res.status(400).json({ error: "Paramètre 'camera' requis" });
    }
    const snapshot = await getCameraSnapshot(camera);
    res.json({ success: true, ...snapshot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/security/cameras
 * Liste toutes les caméras disponibles
 */
router.get("/cameras", searchLimiter, async (req, res) => {
  try {
    const cameras = await listCameras();
    res.json({ success: true, cameras });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/security/motion/history
 * Récupère l'historique des détections de mouvement
 * Query: hours=<nombre_heures> (défaut: 24)
 */
router.get("/motion/history", searchLimiter, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const detections = await getMotionHistory(hours);
    res.json({ success: true, detections });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
