import express from "express";
import { setSphereState, setSphereText } from "../services/sphereService.js";

const router = express.Router();

// POST /api/sphere/state
// Body: { state: "IDLE" | "LISTENING" | "SPEAKING" | "ERROR" }
router.post("/state", (req, res) => {
  const { state } = req.body;
  if (["IDLE", "LISTENING", "SPEAKING", "ERROR"].includes(state)) {
    setSphereState(state);
    res.json({ success: true, state });
  } else {
    res
      .status(400)
      .json({
        error: "Invalid state. Must be IDLE, LISTENING, SPEAKING, or ERROR.",
      });
  }
});

// POST /api/sphere/text
// Body: { text: "Hello world" }
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
