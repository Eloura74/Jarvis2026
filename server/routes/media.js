/**
 * Routes Multimédia
 * - YouTube (recherche et lecture)
 * - Spotify (contrôle lecture)
 * - Plex (serveur média)
 */

import express from "express";
import { playYouTube, controlSpotify, playPlex } from "../services/mediaService.js";
import { searchLimiter, strictLimiter } from "../middleware/index.js";

const router = express.Router();

/**
 * POST /api/media/youtube/play
 * Recherche et lance une vidéo YouTube
 * Body: { query: string }
 */
router.post("/youtube/play", strictLimiter, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Paramètre 'query' requis" });
    }
    const result = await playYouTube(query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/media/spotify/control
 * Contrôle la lecture Spotify
 * Body: { action: "play" | "pause" | "next" | "previous", track?: string }
 */
router.post("/spotify/control", strictLimiter, async (req, res) => {
  try {
    const { action, track } = req.body;
    if (!action) {
      return res.status(400).json({ error: "Paramètre 'action' requis" });
    }
    const result = await controlSpotify(action, track);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/media/plex/play
 * Lance un média sur serveur Plex
 * Body: { title: string, type?: "movie" | "show" }
 */
router.post("/plex/play", strictLimiter, async (req, res) => {
  try {
    const { title, type } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Paramètre 'title' requis" });
    }
    const result = await playPlex(title, type);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
