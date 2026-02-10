/**
 * Routes API pour contrôle système
 *
 * Expose les fonctionnalités de systemControl.js via HTTP
 *
 * @module systemControlRoutes
 */

const express = require("express");
const router = express.Router();
const systemControl = require("./systemControl");

// ============================================================================
// VOLUME AUDIO
// ============================================================================

/**
 * POST /api/system/volume
 * Contrôle volume audio
 *
 * Body: { action: "set"|"increase"|"decrease"|"mute"|"unmute", value?: 0-100 }
 */
router.post("/volume", async (req, res) => {
  try {
    const { action, value } = req.body;

    if (!action) {
      return res.status(400).json({ error: "Action requise" });
    }

    const result = await systemControl.controlVolume({ action, value });
    res.json(result);
  } catch (error) {
    console.error("Erreur route volume:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LUMINOSITÉ
// ============================================================================

/**
 * POST /api/system/brightness
 * Contrôle luminosité écran
 *
 * Body: { action: "set"|"increase"|"decrease", value?: 0-100 }
 */
router.post("/brightness", async (req, res) => {
  try {
    const { action, value } = req.body;

    if (!action) {
      return res.status(400).json({ error: "Action requise" });
    }

    const result = await systemControl.controlBrightness({ action, value });
    res.json(result);
  } catch (error) {
    console.error("Erreur route luminosité:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// FICHIERS
// ============================================================================

/**
 * POST /api/files/action
 * Gestion fichiers et dossiers
 *
 * Body: { action, path, destination?, type? }
 */
router.post("/action", async (req, res) => {
  try {
    const { action, path, destination, type } = req.body;

    if (!action || !path) {
      return res.status(400).json({ error: "Action et path requis" });
    }

    const result = await systemControl.manageFile({
      action,
      path,
      destination,
      type,
    });
    res.json(result);
  } catch (error) {
    console.error("Erreur route fichiers:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/files/search
 * Recherche fichiers
 *
 * Query: ?query=...&path=...&maxResults=...
 */
router.get("/search", async (req, res) => {
  try {
    const { query, path, maxResults } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Query requise" });
    }

    const result = await systemControl.searchFiles({
      query,
      path,
      maxResults: maxResults ? parseInt(maxResults) : 50,
    });
    res.json(result);
  } catch (error) {
    console.error("Erreur route recherche:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CAPTURE ÉCRAN
// ============================================================================

/**
 * POST /api/system/screenshot
 * Capture d'écran
 *
 * Body: { savePath?: string }
 */
router.post("/screenshot", async (req, res) => {
  try {
    const { savePath } = req.body;

    const result = await systemControl.takeScreenshot({ savePath });
    res.json(result);
  } catch (error) {
    console.error("Erreur route screenshot:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SESSION
// ============================================================================

/**
 * POST /api/system/power
 * Contrôle session (lock, shutdown, restart, sleep)
 *
 * Body: { action: "lock"|"shutdown"|"restart"|"sleep", delay?: number }
 */
router.post("/power", async (req, res) => {
  try {
    const { action, delay } = req.body;

    if (!action) {
      return res.status(400).json({ error: "Action requise" });
    }

    const result = await systemControl.controlSession({ action, delay });
    res.json(result);
  } catch (error) {
    console.error("Erreur route power:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// MÉDIA
// ============================================================================

/**
 * POST /api/media/control
 * Contrôle lecture média
 *
 * Body: { action: "play"|"pause"|"next"|"previous"|"stop" }
 */
router.post("/control", async (req, res) => {
  try {
    const { action } = req.body;

    if (!action) {
      return res.status(400).json({ error: "Action requise" });
    }

    const result = await systemControl.controlMedia({ action });
    res.json(result);
  } catch (error) {
    console.error("Erreur route média:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
