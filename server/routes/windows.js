import express from "express";
import { windowManager, automation } from "../platform/dispatcher.js";

const router = express.Router();

/**
 * Routes pour la gestion des fenêtres et l'automatisation clavier
 */

// --- LISTE DES FENÊTRES ---
router.get("/", async (req, res) => {
  try {
    const windows = await windowManager.listWindows();
    res.json(windows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- FOCUS ---
router.post("/focus", async (req, res) => {
  try {
    const result = await windowManager.focusWindow(req.body.title);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CLOSE ---
router.post("/close", async (req, res) => {
  try {
    const result = await windowManager.closeWindow(req.body.title);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- MINIMIZE ---
router.post("/minimize", async (req, res) => {
  try {
    const result = await windowManager.minimizeWindow(req.body.title);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- MAXIMIZE ---
router.post("/maximize", async (req, res) => {
  try {
    const result = await windowManager.maximizeWindow(req.body.title);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- AUTOMATION (TYPE) ---
router.post("/type", async (req, res) => {
  try {
    const { text } = req.body;
    const result = await automation.typeText(text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- AUTOMATION (SHORTCUT) ---
router.post("/shortcut", async (req, res) => {
  try {
    const { keys } = req.body;
    const result = await automation.sendShortcut(keys);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
