import express from "express";
import { exec } from "child_process";
import webScraper from "../services/webScraper.js";

const router = express.Router();

/**
 * Routes pour les services Web (Scraping + Navigation)
 */

router.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL requise" });

  try {
    const data = await webScraper.scrape(url);
    res.json({ success: true, data });
  } catch (error) {
    console.error(`❌ Web Scrape Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Ouvre une URL dans le navigateur par défaut du système (Windows).
 * Contourne le blocage popup du navigateur en passant par le backend.
 *
 * POST /api/web/open-url
 * Body: { url: string }
 */
router.post("/open-url", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL requise" });

  // Valider que c'est bien une URL http/https pour éviter les injections
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return res
      .status(400)
      .json({ error: "URL invalide (doit commencer par http:// ou https://)" });
  }

  // Échapper les guillemets dans l'URL pour éviter les injections shell
  const safeUrl = url.replace(/"/g, "%22");

  // 'start "" "url"' ouvre l'URL dans le navigateur par défaut Windows
  exec(`start "" "${safeUrl}"`, (error) => {
    if (error) {
      console.error(`❌ Erreur ouverture URL: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    console.log(`🌐 URL ouverte via backend: ${url}`);
    res.json({ success: true, url });
  });
});

export default router;
