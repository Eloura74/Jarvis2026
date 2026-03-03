import express from "express";
import { takeContextualScreenshot } from "../services/screenshotService.js";

const router = express.Router();

/**
 * Prend une capture d'écran de l'affichage principal Windows
 * et la retourne en base64 (image/jpeg)
 */
router.get("/screenshot", async (req, res) => {
  try {
    const result = await takeContextualScreenshot();

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (err) {
    console.error("❌ Route /screenshot erreur globale:", err);
    res.status(500).json({ error: "Erreur serveur capture écran" });
  }
});

export default router;
