/**
 * Routes REST pour le Briefing Vocal Matinal
 * Montées sur /api/briefing dans server.js
 */

import express from "express";
import { generateMorningBriefing } from "../services/morningBriefingService.js";

const router = express.Router();

/**
 * GET /api/briefing
 * Génère et retourne le briefing matinal.
 * Query params optionnels :
 *   city    - Ville pour la météo (défaut: "Annecy")
 *   events  - Nombre max d'événements Calendar (défaut: 3)
 *   emails  - Nombre max de mails à compter (défaut: 10)
 */
router.get("/", async (req, res) => {
  try {
    const city = req.query.city || "Annecy";
    const maxEvents = Math.min(parseInt(req.query.events) || 3, 10);
    const maxEmails = Math.min(parseInt(req.query.emails) || 10, 20);

    const briefing = await generateMorningBriefing({ city, maxEvents, maxEmails });
    res.json(briefing);
  } catch (error) {
    console.error("❌ [BRIEFING] Erreur génération:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
