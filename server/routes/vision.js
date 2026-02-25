/**
 * Routes Vision - Gemini Vision API
 * - Capture webcam
 * - Analyse image
 */

import express from "express";
import { captureAndAnalyzeWebcam } from "../services/visionService.js";
import { strictLimiter } from "../middleware/index.js";

const router = express.Router();

/**
 * POST /api/vision/webcam
 * Capture webcam et analyse avec Gemini Vision
 * Body: { prompt?: string }
 */
router.post("/webcam", strictLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    const defaultPrompt = "Décris ce que tu vois dans cette image. Sois précis et concis.";
    
    const result = await captureAndAnalyzeWebcam(prompt || defaultPrompt);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
