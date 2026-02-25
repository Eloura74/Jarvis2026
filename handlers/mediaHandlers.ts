/**
 * Media & Volume Handlers
 */

import { HandlerContext } from "../types/app.types";
import { SystemStatus } from "../types";
import {
  controlVolumeOnBackend,
  takeScreenshotOnBackend,
} from "../services/backendApi";

/**
 * Contrôle du volume système
 */
export const handleAdjustVolume = async (
  args: {
    action: "increase" | "decrease" | "set" | "mute" | "unmute";
    level?: number;
  },
  ctx: HandlerContext,
) => {
  const { action, level } = args;
  const { addLog, setStatus } = ctx;

  setStatus(SystemStatus.EXECUTING);
  addLog(`Volume ${action}${level ? `: ${level}%` : ""}`, "SYSTEM", "info");

  // On transforme l'action pour le backend si nécessaire
  const backendAction = action === "mute" ? "mute" : action;
  const success = await controlVolumeOnBackend(backendAction, level);

  if (success) {
    addLog(`Volume ${action} avec succès`, "SYSTEM", "success");
  } else {
    addLog(`Échec du réglage du volume`, "SYSTEM", "error");
  }

  setStatus(SystemStatus.IDLE);
};

/**
 * Contrôle média (play/pause/next/prev/volume)
 * Gère le mapping entre les outils Gemini et les actions physiques
 */
export const handleControlMedia = async (
  args: {
    action:
      | "play"
      | "pause"
      | "next"
      | "previous"
      | "stop"
      | "PLAY"
      | "PAUSE"
      | "NEXT"
      | "PREVIOUS"
      | "MUTE"
      | "VOLUME_UP"
      | "VOLUME_DOWN";
  },
  ctx: HandlerContext,
) => {
  const { action } = args;
  const { addLog, setStatus } = ctx;

  setStatus(SystemStatus.EXECUTING);

  // Mapping pour le volume (Gemini utilise souvent MAJUSCULES)
  const normalizedAction = action.toUpperCase();

  if (["VOLUME_UP", "VOLUME_DOWN", "MUTE"].includes(normalizedAction)) {
    const volumeAction =
      normalizedAction === "VOLUME_UP"
        ? "increase"
        : normalizedAction === "VOLUME_DOWN"
          ? "decrease"
          : "mute";

    addLog(`Redirection média vers volume: ${volumeAction}`, "SYSTEM", "info");
    return await handleAdjustVolume(
      {
        action: volumeAction as "increase" | "decrease" | "mute",
      },
      ctx,
    );
  }

  addLog(`Media Interface: ${action.toLowerCase()}`, "SYSTEM", "success");
  setStatus(SystemStatus.IDLE);
  return { status: "success", message: `Média ${action} exécuté` };
};

/**
 * Capture d'écran
 */
export const handleTakeScreenshot = async (
  args: { filename?: string; region?: string },
  ctx: HandlerContext,
) => {
  const { region } = args;
  const { addLog, setStatus } = ctx;

  setStatus(SystemStatus.EXECUTING);
  addLog(`Taking screenshot${region ? ` (${region})` : ""}`, "SYSTEM", "info");

  // Appel au backend
  const path = await takeScreenshotOnBackend();

  if (path) {
    addLog(`Screenshot saved: ${path}`, "SYSTEM", "success");
  } else {
    addLog(`Failed to take screenshot`, "SYSTEM", "error");
  }

  setStatus(SystemStatus.IDLE);
};

/**
 * Handler recherche et lecture YouTube
 * Ouvre YouTube dans le navigateur et lance la vidéo
 */
export const handlePlayYouTube = async (
  args: { query: string },
  ctx: HandlerContext,
) => {
  const { addLog, speak, setStatus } = ctx;

  addLog(`Recherche YouTube: "${args.query}"...`, "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const API_BASE = "http://localhost:3001";
    const response = await fetch(`${API_BASE}/api/media/youtube/play`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: args.query }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const message = `Lecture de "${data.title}" sur YouTube, Monsieur.`;
    speak(message);
    addLog(`▶️ ${message}`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      message,
      data: { title: data.title, url: data.url },
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur YouTube: ${msg}`, "SYSTEM", "error");
    speak("Impossible de lire la vidéo YouTube, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);

    return {
      status: "error",
      message: `Impossible de lire YouTube : ${msg}`,
    };
  }
};

/**
 * Handler contrôle lecture Spotify
 * Play/pause/next/previous via Spotify Web API
 */
export const handleSpotifyControl = async (
  args: { action: "play" | "pause" | "next" | "previous"; track?: string },
  ctx: HandlerContext,
) => {
  const { addLog, speak, setStatus } = ctx;

  addLog(
    `Spotify ${args.action}${args.track ? `: ${args.track}` : ""}...`,
    "SYSTEM",
    "info",
  );
  setStatus(SystemStatus.PROCESSING);

  try {
    const API_BASE = "http://localhost:3001";
    const response = await fetch(`${API_BASE}/api/media/spotify/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: args.action, track: args.track }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    let message = "";
    if (args.action === "play" && args.track) {
      message = `Lecture de "${args.track}" sur Spotify, Monsieur.`;
    } else if (args.action === "play") {
      message = "Lecture Spotify reprise, Monsieur.";
    } else if (args.action === "pause") {
      message = "Lecture Spotify en pause, Monsieur.";
    } else if (args.action === "next") {
      message = "Piste suivante, Monsieur.";
    } else if (args.action === "previous") {
      message = "Piste précédente, Monsieur.";
    }

    speak(message);
    addLog(`🎵 ${message}`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      message,
      data: data.result,
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur Spotify: ${msg}`, "SYSTEM", "error");
    speak("Impossible de contrôler Spotify, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);

    return {
      status: "error",
      message: `Impossible de contrôler Spotify : ${msg}`,
    };
  }
};

/**
 * Handler lecture média Plex
 * Lance un film/série sur serveur Plex
 */
export const handlePlayPlex = async (
  args: { title: string; type?: "movie" | "show" },
  ctx: HandlerContext,
) => {
  const { addLog, speak, setStatus } = ctx;

  addLog(`Recherche Plex: "${args.title}"...`, "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const API_BASE = "http://localhost:3001";
    const response = await fetch(`${API_BASE}/api/media/plex/play`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: args.title, type: args.type }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const message = `Lecture de "${data.title}" sur Plex, Monsieur.`;
    speak(message);
    addLog(`🎬 ${message}`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      message,
      data: { title: data.title, type: data.type },
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur Plex: ${msg}`, "SYSTEM", "error");
    speak("Impossible de lire le média Plex, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);

    return {
      status: "error",
      message: `Impossible de lire Plex : ${msg}`,
    };
  }
};
