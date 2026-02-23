import express from "express";
import { setSphereState, setSphereText } from "../services/sphereService.js";

const router = express.Router();

// Liste blanche des états reconnus par l'ESP32
const VALID_STATES = [
  "IDLE",
  "STANDBY",
  "LISTENING",
  "SPEAKING",
  "RECEIVING",
  "ERROR",
  "WEATHER",
  "HOME",
  "SYSTEM",
  "MATRIX",
  "SEARCH",
  "MEDIA",
  "TIMER",
  "PRINT",
  "NOTIF",
  "SUCCESS",
  "APPS",
  "VISION",
  "GHOST",
  "SECURITY",
  "WHATSAPP",
  "GMAIL",
  "CALENDAR",
  "MAP",
  "TRAJET",
];

// POST /api/sphere/state OR /api/sphere/mode
router.post(["/state", "/mode"], async (req, res) => {
  try {
    const target = req.body.state || req.body.mode;

    if (!target || typeof target !== "string") {
      return res
        .status(400)
        .json({ error: "État ou mode manquant ou format invalide." });
    }

    const normalizedTarget = target.trim().toUpperCase();

    if (!VALID_STATES.includes(normalizedTarget)) {
      return res.status(400).json({
        error: "État non reconnu.",
        accepted_values: VALID_STATES,
      });
    }

    // L'utilisation de await prévient les crashs si le service est asynchrone
    await setSphereState(normalizedTarget);
    res.json({ success: true, state: normalizedTarget });
  } catch (error) {
    console.error("[API] Erreur série (State) :", error.message);
    res
      .status(500)
      .json({ error: "Erreur de communication avec le matériel." });
  }
});

// POST /api/sphere/text
router.post("/text", async (req, res) => {
  try {
    let { text } = req.body;

    if (text === undefined || text === null) {
      return res.status(400).json({ error: "Texte manquant." });
    }

    // Conversion forcée en chaîne et nettoyage
    text = String(text).trim();

    // Tronquage préventif à 63 caractères pour correspondre au buffer C++ (char textLabel[64])
    if (text.length > 63) {
      text = text.substring(0, 63);
    }

    await setSphereText(text);
    res.json({ success: true, text });
  } catch (error) {
    console.error("[API] Erreur série (Text) :", error.message);
    res
      .status(500)
      .json({ error: "Erreur de communication avec le matériel." });
  }
});

export default router;
