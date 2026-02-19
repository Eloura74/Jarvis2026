import express from "express";
import { setSphereState, setSphereText } from "../services/sphereService.js";

const router = express.Router();

// POST /api/sphere/state OR /api/sphere/mode
// Body: { state: "IDLE" | "LISTENING" | "SPEAKING" | "ERROR" | "WEATHER" | "HOME" | "SYSTEM" | "MATRIX" | "SEARCH" }
router.post(["/state", "/mode"], (req, res) => {
  const { state, mode } = req.body;
  const target = state || mode;

  if (target) {
    setSphereState(target);
    res.json({ success: true, state: target });
  } else {
    res.status(400).json({ error: "Invalid state/mode." });
  }
});

// POST /api/sphere/text
router.post("/text", (req, res) => {
  const { text } = req.body;
  if (text) {
    setSphereText(text);
    res.json({ success: true, text });
  } else {
    res.status(400).json({ error: "Missing text" });
  }
});

export default router;
