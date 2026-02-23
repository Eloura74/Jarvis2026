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
 * Utilise Gemini avec Google Search grounding pour des résultats réels avec images.
 * Fallback sur liens statiques si Gemini échoue.
 *
 * POST /api/web/search-results
 * Body: { query: string }
 */
router.post("/search-results", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query requise" });

  try {
    const results = await searchWithGemini(query);
    console.log(`🔍 search-results: "${query}" → ${results.length} résultats`);
    res.json({ success: true, results, query });
  } catch (error) {
    console.error("❌ search-results error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Recherche enrichie via Gemini + Google Search grounding.
 * Demande à Gemini de retourner un JSON structuré avec 5 résultats
 * incluant titre, url, description courte et URL d'image.
 *
 * @param {string} query - La requête de recherche
 * @returns {Promise<Array>} Tableau de 5 résultats enrichis
 */
async function searchWithGemini(query) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.warn(
      "⚠️ GEMINI_API_KEY manquante, utilisation du fallback statique",
    );
    return buildStaticFallback(query);
  }

  try {
    // Prompt structuré pour forcer un JSON propre avec 5 résultats
    const prompt = `Tu es un moteur de recherche. Recherche "${query}" sur le web et retourne EXACTEMENT ce JSON (rien d'autre, pas de markdown, pas de \`\`\`):
{
  "results": [
    {
      "title": "Titre du résultat 1",
      "url": "https://url-complete.com/page",
      "description": "Description courte en 1-2 phrases max",
      "image": "https://url-image-directe.jpg-ou-png",
      "source": "NomDuSite"
    }
  ]
}
Règles STRICTES :
- Exactement 5 résultats pertinents pour "${query}"
- URLs complètes et valides (https://)
- Images : URL directe vers une image réelle du résultat (jpg/png/webp). Si pas d'image disponible, utilise null
- Descriptions en français, max 120 caractères
- Sources variées (pas 5 fois le même site)
- Pour les fichiers STL/3D : inclure Thingiverse, Printables, Cults3D, MyMiniFactory
- Retourne UNIQUEMENT le JSON, sans aucun autre texte`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Gemini API error ${response.status}: ${errText.substring(0, 200)}`,
      );
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extraire le JSON de la réponse (Gemini peut ajouter du texte autour)
    const jsonMatch = rawText.match(/\{[\s\S]*"results"[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn(
        "⚠️ Gemini n'a pas retourné de JSON valide, fallback statique",
      );
      return buildStaticFallback(query);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const results = (parsed.results || []).slice(0, 5).map((r) => ({
      title: r.title || query,
      url:
        r.url || `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      description: r.description || "",
      image: r.image && r.image.startsWith("http") ? r.image : null,
      source: r.source || "Web",
    }));

    // Compléter avec fallback si moins de 5 résultats
    if (results.length < 5) {
      const fallbacks = buildStaticFallback(query);
      for (const fb of fallbacks) {
        if (results.length >= 5) break;
        // Éviter les doublons d'URL
        if (!results.some((r) => r.url === fb.url)) {
          results.push(fb);
        }
      }
    }

    return results;
  } catch (err) {
    console.warn(`⚠️ Gemini search failed (${err.message}), fallback statique`);
    return buildStaticFallback(query);
  }
}

/**
 * Fallback statique : génère des liens pertinents selon le type de requête.
 * Utilisé si Gemini est indisponible ou ne retourne pas de JSON valide.
 *
 * @param {string} query - La requête de recherche
 * @returns {Array} Tableau de résultats statiques
 */
function buildStaticFallback(query) {
  const q = query.toLowerCase();
  const enc = encodeURIComponent(query);

  const is3D =
    q.includes("stl") ||
    q.includes("3d") ||
    q.includes("modèle") ||
    q.includes("imprim") ||
    q.includes("support");

  if (is3D) {
    return [
      {
        title: `Thingiverse : ${query}`,
        url: `https://www.thingiverse.com/search?q=${enc}`,
        description: `Fichiers STL et modèles 3D pour "${query}" sur Thingiverse`,
        image: "https://cdn.thingiverse.com/site/img/thingiverse-logo-2015.png",
        source: "Thingiverse",
      },
      {
        title: `Printables : ${query}`,
        url: `https://www.printables.com/search/models?q=${enc}`,
        description: `Modèles 3D imprimables pour "${query}" sur Printables`,
        image: "https://media.printables.com/media/prints/og-image.jpg",
        source: "Printables",
      },
      {
        title: `Cults3D : ${query}`,
        url: `https://cults3d.com/fr/recherche?q=${enc}`,
        description: `Fichiers 3D à télécharger pour "${query}" sur Cults3D`,
        image: null,
        source: "Cults3D",
      },
      {
        title: `MyMiniFactory : ${query}`,
        url: `https://www.myminifactory.com/search/?search=${enc}`,
        description: `Modèles 3D gratuits pour "${query}" sur MyMiniFactory`,
        image: null,
        source: "MyMiniFactory",
      },
      {
        title: `Google : ${query}`,
        url: `https://www.google.com/search?q=${enc}`,
        description: `Voir tous les résultats Google pour "${query}"`,
        image: null,
        source: "Google",
      },
    ];
  }

  return [
    {
      title: `Google : ${query}`,
      url: `https://www.google.com/search?q=${enc}`,
      description: `Résultats Google pour "${query}"`,
      image: null,
      source: "Google",
    },
    {
      title: `Wikipedia : ${query}`,
      url: `https://fr.wikipedia.org/wiki/Special:Search?search=${enc}`,
      description: `Article Wikipedia sur "${query}"`,
      image: null,
      source: "Wikipedia",
    },
    {
      title: `YouTube : ${query}`,
      url: `https://www.youtube.com/results?search_query=${enc}`,
      description: `Vidéos YouTube sur "${query}"`,
      image: null,
      source: "YouTube",
    },
    {
      title: `Amazon : ${query}`,
      url: `https://www.amazon.fr/s?k=${enc}`,
      description: `Produits Amazon pour "${query}"`,
      image: null,
      source: "Amazon",
    },
    {
      title: `GitHub : ${query}`,
      url: `https://github.com/search?q=${enc}`,
      description: `Projets GitHub pour "${query}"`,
      image: null,
      source: "GitHub",
    },
  ];
}

export default router;
