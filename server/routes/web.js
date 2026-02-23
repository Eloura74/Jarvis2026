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

/**
 * Retourne 5 résultats de recherche enrichis (titre, url, description, image)
 * Utilise DuckDuckGo Instant Answer API (gratuit, sans clé)
 * Fallback sur scraping Google si DDG ne retourne pas assez de résultats
 *
 * POST /api/web/search-results
 * Body: { query: string, type?: "web" | "images" }
 */
router.post("/search-results", async (req, res) => {
  const { query, type = "web" } = req.body;
  if (!query) return res.status(400).json({ error: "Query requise" });

  try {
    // DuckDuckGo Instant Answer API — retourne des résultats JSON sans clé
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const ddgRes = await fetch(ddgUrl, {
      headers: { "User-Agent": "JARVIS/2.0 (personal assistant)" },
    });
    const ddgData = await ddgRes.json();

    const results = [];

    // 1. Résultat principal (AbstractText)
    if (ddgData.AbstractText && ddgData.AbstractURL) {
      results.push({
        title: ddgData.Heading || query,
        url: ddgData.AbstractURL,
        description: ddgData.AbstractText.substring(0, 200),
        image: ddgData.Image ? `https://duckduckgo.com${ddgData.Image}` : null,
        source: ddgData.AbstractSource || "DuckDuckGo",
      });
    }

    // 2. Résultats RelatedTopics
    for (const topic of ddgData.RelatedTopics || []) {
      if (results.length >= 5) break;
      // Ignorer les groupes (qui ont une propriété Topics)
      if (topic.Topics) continue;
      if (!topic.FirstURL) continue;
      results.push({
        title: topic.Text ? topic.Text.split(" - ")[0].substring(0, 80) : query,
        url: topic.FirstURL,
        description: topic.Text ? topic.Text.substring(0, 200) : "",
        image: topic.Icon?.URL
          ? `https://duckduckgo.com${topic.Icon.URL}`
          : null,
        source: "DuckDuckGo",
      });
    }

    // 3. Si pas assez de résultats, compléter avec des liens Google générés
    const fallbackEngines = [
      {
        title: `Résultats Google : ${query}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        description: `Voir tous les résultats Google pour "${query}"`,
        image: null,
        source: "Google",
      },
      {
        title: `Thingiverse : ${query}`,
        url: `https://www.thingiverse.com/search?q=${encodeURIComponent(query)}`,
        description: `Fichiers STL et modèles 3D pour "${query}" sur Thingiverse`,
        image: null,
        source: "Thingiverse",
      },
      {
        title: `Printables : ${query}`,
        url: `https://www.printables.com/search/models?q=${encodeURIComponent(query)}`,
        description: `Modèles 3D imprimables pour "${query}" sur Printables`,
        image: null,
        source: "Printables",
      },
      {
        title: `Cults3D : ${query}`,
        url: `https://cults3d.com/fr/recherche?q=${encodeURIComponent(query)}`,
        description: `Fichiers 3D à télécharger pour "${query}" sur Cults3D`,
        image: null,
        source: "Cults3D",
      },
      {
        title: `MyMiniFactory : ${query}`,
        url: `https://www.myminifactory.com/search/?search=${encodeURIComponent(query)}`,
        description: `Modèles 3D gratuits pour "${query}" sur MyMiniFactory`,
        image: null,
        source: "MyMiniFactory",
      },
    ];

    // Détecter si c'est une recherche de fichiers 3D/STL
    const is3DQuery =
      query.toLowerCase().includes("stl") ||
      query.toLowerCase().includes("3d") ||
      query.toLowerCase().includes("support") ||
      query.toLowerCase().includes("modèle") ||
      query.toLowerCase().includes("imprim");

    // Compléter jusqu'à 5 résultats
    const fallbacks = is3DQuery
      ? fallbackEngines.slice(1) // Thingiverse, Printables, Cults3D, MyMiniFactory
      : fallbackEngines.slice(0, 1); // Juste Google

    for (const fb of fallbacks) {
      if (results.length >= 5) break;
      results.push(fb);
    }

    // Toujours au moins 1 résultat
    if (results.length === 0) {
      results.push(fallbackEngines[0]);
    }

    console.log(`🔍 search-results: "${query}" → ${results.length} résultats`);
    res.json({ success: true, results: results.slice(0, 5), query });
  } catch (error) {
    console.error("❌ search-results error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
