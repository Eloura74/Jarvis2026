import express from "express";
import presenceService from "../services/presenceService.js";

const router = express.Router();

/**
 * GET /api/presence/status
 * Récupère le statut de présence et d'inactivité
 */
router.get("/status", (req, res) => {
  res.json(presenceService.getStatusData());
});

/**
 * POST /api/presence/heartbeat
 * Signale une activité utilisateur (réinitialise le timer d'inactivité)
 */
router.post("/heartbeat", (req, res) => {
  presenceService.recordActivity();
  res.json({ success: true, ...presenceService.getStatusData() });
});

/**
 * POST /api/presence/status
 * Force un statut de présence (ex: simuler départ ou retour)
 */
router.post("/status", async (req, res) => {
  const { status } = req.body;
  if (!status || !["PRESENT", "ABSENT"].includes(status)) {
    return res.status(400).json({ error: "Invalid status ('PRESENT' or 'ABSENT' required)" });
  }

  await presenceService.setStatus(status);
  res.json({ success: true, ...presenceService.getStatusData() });
});

/**
 * POST /api/presence/config
 * Met à jour le délai d'inactivité et l'entité HA ciblée
 */
router.post("/config", (req, res) => {
  const { timeoutMinutes, lightEntity } = req.body;
  const updated = presenceService.configure({ timeoutMinutes, lightEntity });
  res.json({ success: true, config: updated });
});

export default router;
