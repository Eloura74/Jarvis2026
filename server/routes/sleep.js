/**
 * Routes REST pour le Mode Veille Intelligente
 * Montées sur /api/sleep dans server.js
 */

import express from "express";
import {
  activateSleepMode,
  deactivateSleepMode,
  getSleepModeStatus,
} from "../services/sleepModeService.js";

const router = express.Router();

/**
 * POST /api/sleep/activate
 * Active le mode veille.
 * Body JSON optionnel :
 *   { wakeUpTime?: string (ISO 8601), ttsVolume?: number, allowedNotifications?: string[] }
 */
router.post("/activate", (req, res) => {
  const { wakeUpTime, ttsVolume, allowedNotifications } = req.body || {};
  const result = activateSleepMode({ wakeUpTime, ttsVolume, allowedNotifications });
  res.status(result.success ? 200 : 400).json(result);
});

/**
 * POST /api/sleep/deactivate
 * Désactive le mode veille manuellement.
 */
router.post("/deactivate", (req, res) => {
  const result = deactivateSleepMode({ reason: "manual" });
  res.status(result.success ? 200 : 400).json(result);
});

/**
 * GET /api/sleep/status
 * Retourne l'état courant du mode veille.
 */
router.get("/status", (req, res) => {
  res.json(getSleepModeStatus());
});

export default router;
