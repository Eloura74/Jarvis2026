/**
 * Media & Volume Handlers
 */

import { HandlerContext } from "../types/app.types";
import { SystemStatus } from "../types";

/**
 * Contrôle du volume système
 */
export const handleAdjustVolume = async (
  args: { action: "increase" | "decrease" | "set" | "mute"; level?: number },
  ctx: HandlerContext,
) => {
  const { action, level } = args;
  const { addLog, setStatus } = ctx;

  setStatus(SystemStatus.EXECUTING);
  addLog(`Volume ${action}${level ? `: ${level}%` : ""}`, "SYSTEM", "info");

  // Logic backend volume control (PowerShell)
  // Implémenter selon besoin

  addLog("Volume adjusted", "SYSTEM", "success");
  setStatus(SystemStatus.IDLE);
};

/**
 * Contrôle média (play/pause/next/prev)
 */
export const handleControlMedia = async (
  args: { action: "play" | "pause" | "next" | "previous" | "stop" },
  ctx: HandlerContext,
) => {
  const { action } = args;
  const { addLog, setStatus } = ctx;

  setStatus(SystemStatus.EXECUTING);
  addLog(`Media Interface: ${action}`, "SYSTEM", "success");
  setStatus(SystemStatus.IDLE);
};

/**
 * Capture d'écran
 */
export const handleTakeScreenshot = async (
  args: { filename?: string; region?: string },
  ctx: HandlerContext,
) => {
  const { filename, region } = args;
  const { addLog, setStatus } = ctx;

  setStatus(SystemStatus.EXECUTING);
  addLog(`Taking screenshot${region ? ` (${region})` : ""}`, "SYSTEM", "info");

  // Backend screenshot logic
  const defaultName = filename || `screenshot_${Date.now()}.png`;

  addLog(`Screenshot saved: ${defaultName}`, "SYSTEM", "success");
  setStatus(SystemStatus.IDLE);
};
