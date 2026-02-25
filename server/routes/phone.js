/**
 * Routes pour contrôle smartphone via KDE Connect
 * - Notifications push
 * - Appels téléphoniques
 * - SMS
 * - Batterie
 */

import express from "express";
import {
  sendNotification,
  makeCall,
  sendSMS,
  getBatteryLevel,
  listDevices,
} from "../services/kdeConnectService.js";
import { validateBody, schemas } from "../middleware/validation.js";
import { strictLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/**
 * POST /api/phone/notification
 * Envoie une notification push sur le smartphone
 */
router.post("/notification", strictLimiter, async (req, res) => {
  try {
    const { title, message, deviceId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ 
        error: "Paramètres 'title' et 'message' requis" 
      });
    }

    const result = await sendNotification(title, message, deviceId);
    res.json({ success: true, result });
  } catch (error) {
    console.error("❌ Erreur notification smartphone:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/phone/call
 * Lance un appel téléphonique
 */
router.post("/call", strictLimiter, async (req, res) => {
  try {
    const { phoneNumber, deviceId } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ 
        error: "Paramètre 'phoneNumber' requis" 
      });
    }

    const result = await makeCall(phoneNumber, deviceId);
    res.json({ success: true, result });
  } catch (error) {
    console.error("❌ Erreur appel téléphonique:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/phone/sms
 * Envoie un SMS
 */
router.post("/sms", strictLimiter, async (req, res) => {
  try {
    const { phoneNumber, message, deviceId } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ 
        error: "Paramètres 'phoneNumber' et 'message' requis" 
      });
    }

    const result = await sendSMS(phoneNumber, message, deviceId);
    res.json({ success: true, result });
  } catch (error) {
    console.error("❌ Erreur envoi SMS:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/phone/battery
 * Récupère le niveau de batterie du smartphone
 */
router.get("/battery", async (req, res) => {
  try {
    const { deviceId } = req.query;
    const result = await getBatteryLevel(deviceId);
    res.json({ success: true, battery: result });
  } catch (error) {
    console.error("❌ Erreur batterie smartphone:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/phone/devices
 * Liste tous les devices KDE Connect disponibles
 */
router.get("/devices", async (req, res) => {
  try {
    const devices = await listDevices();
    res.json({ success: true, devices });
  } catch (error) {
    console.error("❌ Erreur liste devices:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
