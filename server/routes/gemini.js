/**
 * routes/gemini.js — Routes proxy Gemini (S1)
 *
 * Expose les endpoints Gemini côté backend pour éviter d'exposer
 * la clé API dans le bundle JavaScript frontend.
 *
 * Routes :
 * POST /api/gemini/stream    → Streaming SSE (commandes vocales)
 * POST /api/gemini/summarize → Synthèse courte d'un résultat d'outil
 * POST /api/gemini/qms       → Analyse QMS (suggestions proactives)
 */

import express from "express";
import {
  handleGeminiStream,
  handleGeminiSummarize,
  handleGeminiQMS,
} from "../services/geminiProxyService.js";

const router = express.Router();

// POST /api/gemini/stream
// Body: { input, systemInstruction, tools, temperature, maxOutputTokens }
// Réponse: SSE text/event-stream avec chunks { type, text|name|args|message }
router.post("/stream", handleGeminiStream);

// POST /api/gemini/summarize
// Body: { prompt }
// Réponse: JSON { text }
router.post("/summarize", handleGeminiSummarize);

// POST /api/gemini/qms
// Body: { prompt }
// Réponse: JSON { hasSuggestion, tool?, args?, explanation? }
router.post("/qms", handleGeminiQMS);

export default router;
