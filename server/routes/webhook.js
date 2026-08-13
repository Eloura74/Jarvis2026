import express from "express";
import { broadcastEvent } from "./events.js";

const router = express.Router();

/**
 * POST /api/webhook/ha
 * Reçoit des alertes de Home Assistant
 * Body attendu : { type: string, message: string, data?: any }
 */
router.post("/ha", (req, res) => {
  const { type, message, data } = req.body;

  if (!type || !message) {
    return res.status(400).json({ error: "Missing type or message in payload" });
  }

  console.log(`🚨 [WEBHOOK HA] Reçu: ${type} - ${message}`);

  // Transférer l'événement vers le frontend via SSE
  // L'événement sera nommé "HA_ALERT" par défaut
  broadcastEvent("HA_ALERT", { type, message, data }, message);

  res.json({ success: true, message: "Webhook processed" });
});

export default router;
