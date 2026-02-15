import express from "express";
import webScraper from "../services/webScraper.js";

const router = express.Router();

/**
 * Routes pour les services Web (Scraping)
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

export default router;
