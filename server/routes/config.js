/**
 * API Routes - Configuration Persistence
 * GET/POST /api/config/settings
 */

import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const CONFIG_DIR = path.join(__dirname, "../config");
const SETTINGS_FILE = path.join(CONFIG_DIR, "user-settings.json");

// Ensure config directory exists
async function ensureConfigDir() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create config directory:", error);
  }
}

// Default settings
const DEFAULT_SETTINGS = {
  wakeWordEnabled: true,
  wakeWordThreshold: 0.8,
  voiceLanguage: "fr-FR",
  voiceVolume: 1.0,
  theme: "ironman",
  ghostModeEnabled: false,
  psychProfileEnabled: true,
};

/**
 * GET /api/config/settings
 * Récupère configuration utilisateur
 */
router.get("/settings", async (req, res) => {
  try {
    await ensureConfigDir();

    try {
      const data = await fs.readFile(SETTINGS_FILE, "utf-8");
      const settings = JSON.parse(data);
      res.json(settings);
    } catch (error) {
      // File doesn't exist, return defaults
      console.log("No settings file found, returning defaults");
      res.json(DEFAULT_SETTINGS);
    }
  } catch (error) {
    console.error("Error loading settings:", error);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

/**
 * POST /api/config/settings
 * Sauvegarde configuration utilisateur
 */
router.post("/settings", async (req, res) => {
  try {
    await ensureConfigDir();

    const settings = { ...DEFAULT_SETTINGS, ...req.body };

    // Validation basique
    if (
      typeof settings.wakeWordThreshold !== "number" ||
      settings.wakeWordThreshold < 0 ||
      settings.wakeWordThreshold > 1
    ) {
      return res.status(400).json({ error: "Invalid wakeWordThreshold" });
    }

    await fs.writeFile(
      SETTINGS_FILE,
      JSON.stringify(settings, null, 2),
      "utf-8",
    );
    console.log("✅ Settings saved to backend");
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

/**
 * POST /api/config/settings/reset
 * Reset configuration aux defaults
 */
router.post("/settings/reset", async (req, res) => {
  try {
    await ensureConfigDir();
    await fs.writeFile(
      SETTINGS_FILE,
      JSON.stringify(DEFAULT_SETTINGS, null, 2),
      "utf-8",
    );
    console.log("🔄 Settings reset to defaults");
    res.json({ success: true });
  } catch (error) {
    console.error("Error resetting settings:", error);
    res.status(500).json({ error: "Failed to reset settings" });
  }
});

export default router;
