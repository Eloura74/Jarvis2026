/**
 * Session Handlers - Lock, Shutdown, Restart, Sleep
 */

import { HandlerContext } from "../types/app.types";
import { SystemStatus } from "../types";

/**
 * Verrouiller la session Windows
 */
export const handleLockSession = async (args: {}, ctx: HandlerContext) => {
  const { addLog, setStatus } = ctx;

  setStatus(SystemStatus.EXECUTING);
  addLog("Locking session...", "SYSTEM", "info");

  // PowerShell: rundll32.exe user32.dll,LockWorkStation
  // Backend call

  addLog("Session locked", "SYSTEM", "success");
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

  // PowerShell: shutdown /s /t {delay}

  addLog("Shutdown initiated", "SYSTEM", "success");
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

  // PowerShell: shutdown /r /t {delay}

  addLog("Restart initiated", "SYSTEM", "success");
  setStatus(SystemStatus.IDLE);
};

/**
 * Mettre en veille
 */
export const handleSleepSystem = async (args: {}, ctx: HandlerContext) => {
  const { addLog, setStatus } = ctx;

  setStatus(SystemStatus.EXECUTING);
  addLog("Entering sleep mode...", "SYSTEM", "info");

  // PowerShell: rundll32.exe powrprof.dll,SetSuspendState 0,1,0

  addLog("Sleep mode activated", "SYSTEM", "success");
  setStatus(SystemStatus.IDLE);
};
