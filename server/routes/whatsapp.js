import express from "express";
import { getWhatsAppStatus } from "../services/whatsappService.js";

const router = express.Router();

/**
 * GET /api/whatsapp/status
 * Récupère l'état actuel de la connexion WhatsApp et potentiellement le QR code.
 */
router.get("/status", (req, res) => {
  const statusInfo = getWhatsAppStatus();
  res.json(statusInfo);
});

export default router;
