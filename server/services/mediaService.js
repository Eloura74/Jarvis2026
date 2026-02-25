/**
 * Service Multimédia
 * - YouTube (recherche et lecture)
 * - Spotify (contrôle lecture via Web API)
 * - Plex (serveur média local)
 */

import { exec } from "child_process";
import { promisify } from "util";
import fetch from "node-fetch";

const execAsync = promisify(exec);

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN || "";
const PLEX_URL = process.env.PLEX_URL || "http://localhost:32400";
const PLEX_TOKEN = process.env.PLEX_TOKEN || "";

/**
 * Recherche et lance une vidéo YouTube
 * Utilise l'API YouTube Data v3 pour rechercher puis ouvre dans le navigateur
 */
export async function playYouTube(query) {
  try {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

    if (!YOUTUBE_API_KEY) {
      throw new Error("YOUTUBE_API_KEY non configuré");
    }

    // Recherche via YouTube Data API v3
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&maxResults=1&type=video`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (!data.items || data.items.length === 0) {
      throw new Error("Aucune vidéo trouvée");
    }

    const video = data.items[0];
    const videoId = video.id.videoId;
    const title = video.snippet.title;
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    // Ouvrir dans le navigateur par défaut
    const platform = process.platform;
    let command = "";

    if (platform === "win32") {
      command = `start "" "${url}"`;
    } else if (platform === "darwin") {
      command = `open "${url}"`;
    } else {
      command = `xdg-open "${url}"`;
    }

    await execAsync(command);

    return {
      success: true,
      title,
      url,
      videoId,
    };
  } catch (error) {
    console.error("Erreur playYouTube:", error.message);
    throw new Error(`Impossible de lire YouTube: ${error.message}`);
  }
}

/**
 * Obtient un access token Spotify via refresh token
 */
async function getSpotifyAccessToken() {
  try {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
      throw new Error("Credentials Spotify non configurés");
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: `grant_type=refresh_token&refresh_token=${SPOTIFY_REFRESH_TOKEN}`,
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    return data.access_token;
  } catch (error) {
    console.error("Erreur getSpotifyAccessToken:", error.message);
    throw new Error(`Impossible d'obtenir token Spotify: ${error.message}`);
  }
}

/**
 * Contrôle la lecture Spotify (play/pause/next/previous)
 */
export async function controlSpotify(action, track = null) {
  try {
    const accessToken = await getSpotifyAccessToken();

    let endpoint = "";
    let method = "PUT";
    let body = null;

    if (action === "play" && track) {
      // Rechercher la piste
      const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(track)}&type=track&limit=1`;
      const searchResponse = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const searchData = await searchResponse.json();

      if (!searchData.tracks || searchData.tracks.items.length === 0) {
        throw new Error("Piste non trouvée");
      }

      const trackUri = searchData.tracks.items[0].uri;
      endpoint = "https://api.spotify.com/v1/me/player/play";
      body = JSON.stringify({ uris: [trackUri] });
    } else if (action === "play") {
      endpoint = "https://api.spotify.com/v1/me/player/play";
    } else if (action === "pause") {
      endpoint = "https://api.spotify.com/v1/me/player/pause";
    } else if (action === "next") {
      endpoint = "https://api.spotify.com/v1/me/player/next";
      method = "POST";
    } else if (action === "previous") {
      endpoint = "https://api.spotify.com/v1/me/player/previous";
      method = "POST";
    } else {
      throw new Error(`Action invalide: ${action}`);
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body,
    });

    // Spotify retourne 204 No Content en cas de succès
    if (response.status !== 204 && !response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Erreur Spotify");
    }

    return {
      success: true,
      action,
      track,
    };
  } catch (error) {
    console.error("Erreur controlSpotify:", error.message);
    throw new Error(`Impossible de contrôler Spotify: ${error.message}`);
  }
}

/**
 * Lance un média sur serveur Plex
 */
export async function playPlex(title, type = "movie") {
  try {
    if (!PLEX_TOKEN) {
      throw new Error("PLEX_TOKEN non configuré");
    }

    // Rechercher le média dans la bibliothèque Plex
    const searchUrl = `${PLEX_URL}/search?query=${encodeURIComponent(title)}&X-Plex-Token=${PLEX_TOKEN}`;

    const response = await fetch(searchUrl);
    const text = await response.text();

    // Parser XML (Plex retourne du XML)
    // Pour simplifier, on utilise une regex basique
    const videoMatch = text.match(/<Video[^>]*title="([^"]*)"[^>]*key="([^"]*)"/);

    if (!videoMatch) {
      throw new Error("Média non trouvé dans Plex");
    }

    const mediaTitle = videoMatch[1];
    const mediaKey = videoMatch[2];

    // Lancer la lecture (nécessite un client Plex actif)
    const playUrl = `${PLEX_URL}${mediaKey}?X-Plex-Token=${PLEX_TOKEN}`;

    // Ouvrir dans le navigateur (Plex Web)
    const platform = process.platform;
    let command = "";

    if (platform === "win32") {
      command = `start "" "${playUrl}"`;
    } else if (platform === "darwin") {
      command = `open "${playUrl}"`;
    } else {
      command = `xdg-open "${playUrl}"`;
    }

    await execAsync(command);

    return {
      success: true,
      title: mediaTitle,
      type,
      url: playUrl,
    };
  } catch (error) {
    console.error("Erreur playPlex:", error.message);
    throw new Error(`Impossible de lire Plex: ${error.message}`);
  }
}
