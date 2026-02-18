/**
 * Session Handlers - Lock, Shutdown, Restart, Sleep
 */

import { HandlerContext } from "../types/app.types";
import { SystemStatus } from "../types";
import { controlPowerOnBackend } from "../services/backendApi";

/**
 * Verrouiller la session Windows
 */
export const handleLockSession = async (
  _args: Record<string, unknown>,
  ctx: HandlerContext,
) => {
  const { addLog, setStatus } = ctx;

  setStatus(SystemStatus.EXECUTING);
  addLog("Locking session...", "SYSTEM", "info");

  const success = await controlPowerOnBackend("lock");

  if (success) {
    addLog("Session locked", "SYSTEM", "success");
  } else {
    addLog("Failed to lock session", "SYSTEM", "error");
  }

  setStatus(SystemStatus.IDLE);
};

/**
 * Éteindre le système
 */
export const handleShutdownSystem = async (
  args: { delay?: number },
  ctx: HandlerContext,
) => {
  const { delay = 0 } = args;
  const { addLog, setStatus } = ctx;

  setStatus(SystemStatus.EXECUTING);
  addLog(`Shutdown scheduled in ${delay}s`, "SYSTEM", "warning");

  const success = await controlPowerOnBackend("shutdown", delay);

  if (success) {
    addLog("Shutdown initiated", "SYSTEM", "success");
  } else {
    addLog("Failed to initiate shutdown", "SYSTEM", "error");
  }

  setStatus(SystemStatus.IDLE);
};

/**
 * Redémarrer le système
 */
export const handleRestartSystem = async (
  args: { delay?: number },
  ctx: HandlerContext,
) => {
  const { delay = 0 } = args;
  const { addLog, setStatus } = ctx;

  setStatus(SystemStatus.EXECUTING);
  addLog(`Restart scheduled in ${delay}s`, "SYSTEM", "warning");

  const success = await controlPowerOnBackend("restart", delay);

  if (success) {
    addLog("Restart initiated", "SYSTEM", "success");
  } else {
    addLog("Failed to initiate restart", "SYSTEM", "error");
  }

  setStatus(SystemStatus.IDLE);
};

/**
 * Mettre en veille
 */
export const handleSleepSystem = async (
  _args: Record<string, unknown>,
  ctx: HandlerContext,
) => {
  const { addLog, setStatus } = ctx;

  setStatus(SystemStatus.EXECUTING);
  addLog("Entering sleep mode...", "SYSTEM", "info");

  const success = await controlPowerOnBackend("sleep");

  if (success) {
    addLog("Sleep mode activated", "SYSTEM", "success");
  } else {
    addLog("Failed to enter sleep mode", "SYSTEM", "error");
  }

  setStatus(SystemStatus.IDLE);
};
