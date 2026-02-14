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
    return await handleAdjustVolume({ action: volumeAction as any }, ctx);
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
