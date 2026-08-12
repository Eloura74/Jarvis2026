import express from "express";
import { windowManager, automation } from "../platform/dispatcher.js";
import { validateBody, schemas } from "../middleware/validation.js";
import { strictLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/**
 * Extrait le nom de la fenêtre depuis les 3 champs possibles envoyés par le frontend
 * (windowTitle, appName ou title) — Gemini envoie "appName", windowApi envoie "windowTitle"
 */
function getTargetWindow(body) {
  return body.windowTitle || body.appName || body.title || "";
}

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
router.post("/focus", validateBody(schemas.windowAction), async (req, res) => {
  try {
    const target = getTargetWindow(req.body);
    if (!target) return res.status(400).json({ error: "windowTitle, appName ou title requis" });
    const success = await windowManager.focusWindow(target);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CLOSE ---
router.post("/close", validateBody(schemas.windowAction), async (req, res) => {
  try {
    const target = getTargetWindow(req.body);
    if (!target) return res.status(400).json({ error: "windowTitle, appName ou title requis" });
    const success = await windowManager.closeWindow(target);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- MINIMIZE ---
router.post("/minimize", validateBody(schemas.windowAction), async (req, res) => {
  try {
    const target = getTargetWindow(req.body);
    if (!target) return res.status(400).json({ error: "windowTitle, appName ou title requis" });
    const success = await windowManager.minimizeWindow(target);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- MAXIMIZE ---
router.post("/maximize", validateBody(schemas.windowAction), async (req, res) => {
  try {
    const target = getTargetWindow(req.body);
    if (!target) return res.status(400).json({ error: "windowTitle, appName ou title requis" });
    const success = await windowManager.maximizeWindow(target);
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- AUTOMATION (TYPE) ---
router.post(
  "/type",
  strictLimiter,
  validateBody(schemas.typeText),
  async (req, res) => {
    try {
      const { text } = req.body;
      const success = await automation.typeText(text);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// --- AUTOMATION (SHORTCUT) ---
router.post(
  "/shortcut",
  strictLimiter,
  validateBody(schemas.sendShortcut),
  async (req, res) => {
    try {
      const { keys } = req.body;
      const success = await automation.sendShortcut(keys);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
