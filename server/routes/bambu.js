/**
 * Routes API Bambu Labs
 * Exposent les données MQTT au frontend via REST
 */

import express from "express";
import { getBambuStatus } from "../services/bambuMqtt.js";

const router = express.Router();

/**
 * GET /api/bambu/status
 * Récupère l'état actuel du Bambu A1 mini
 */
router.get("/status", (req, res) => {
  try {
    const status = getBambuStatus();
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur récupération status Bambu:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve Bambu status",
    });
  }
});

/**
 * POST /api/bambu/command
 * Envoie une commande au Bambu (pause, resume, cancel)
 * TODO: Implémenter commandes MQTT
 */
router.post("/command", (req, res) => {
  const { command } = req.body;

  // Validation
  if (!["pause", "resume", "cancel"].includes(command)) {
    return res.status(400).json({
      success: false,
      error: "Invalid command. Allowed: pause, resume, cancel",
    });
  }

  // TODO: Implémenter envoi commande MQTT
  res.json({
    success: false,
    message: "Command API not yet implemented",
    command,
  });
});

export default router;
