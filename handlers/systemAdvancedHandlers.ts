/**
 * Handlers avancés pour gestion système Windows
 * - Fenêtres multi-écrans
 * - Gestionnaire de tâches
 * - Contrôle audio (volume, mute)
 */

import type { HandlerContext } from "../types/app.types";
import { SystemStatus } from "../types";

const API_BASE = "http://localhost:3001";

/**
 * Handler déplacement fenêtre vers un écran spécifique
 * Permet de gérer les configurations multi-écrans
 */
export const handleMoveWindowToScreen = async (
  args: { appName: string; screenNumber: number },
  ctx: HandlerContext,
) => {
  const { addLog, speak, setStatus } = ctx;

  addLog(
    `Déplacement fenêtre "${args.appName}" vers écran ${args.screenNumber}...`,
    "SYSTEM",
    "info",
  );
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/system/window/move-screen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appName: args.appName,
        screenNumber: args.screenNumber,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const message = `Fenêtre "${args.appName}" déplacée vers écran ${args.screenNumber}, Monsieur.`;
    speak(message);
    addLog(`✅ ${message}`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      message,
      data: data.result,
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur déplacement fenêtre: ${msg}`, "SYSTEM", "error");
    speak(`Impossible de déplacer la fenêtre, Monsieur.`);
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);

    return {
      status: "error",
      message: `Impossible de déplacer la fenêtre : ${msg}`,
    };
  }
};

/**
 * Handler liste processus actifs (gestionnaire de tâches)
 * Retourne les processus avec utilisation CPU/RAM
 */
export const handleListProcesses = async (
  args: { sortBy?: "cpu" | "memory"; limit?: number },
  ctx: HandlerContext,
) => {
  const { addLog, speak, setStatus } = ctx;

  const sortBy = args.sortBy || "cpu";
  const limit = args.limit || 10;

  addLog(
    `Récupération processus actifs (tri: ${sortBy}, limite: ${limit})...`,
    "SYSTEM",
    "info",
  );
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(
      `${API_BASE}/api/system/processes?sortBy=${sortBy}&limit=${limit}`,
    );

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const processes = data.processes;

    if (!processes || processes.length === 0) {
      speak("Aucun processus trouvé, Monsieur.");
      setStatus(SystemStatus.IDLE);
      return {
        status: "success",
        message: "Aucun processus",
        data: [],
      };
    }

    // Trouver les processus gourmands
    const topProcess = processes[0];
    const metric = sortBy === "cpu" ? "CPU" : "mémoire";
    const value =
      sortBy === "cpu" ? topProcess.cpuPercent : topProcess.memoryMB;

    speak(
      `${processes.length} processus actifs. Le plus gourmand en ${metric} est ${topProcess.name} avec ${value}${sortBy === "cpu" ? "%" : " Mo"}.`,
    );

    processes.forEach((proc: any) => {
      addLog(
        `📊 ${proc.name}: CPU ${proc.cpuPercent}%, RAM ${proc.memoryMB} Mo`,
        "SYSTEM",
        "info",
      );
    });

    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      message: `${processes.length} processus actifs`,
      data: processes,
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur liste processus: ${msg}`, "SYSTEM", "error");
    speak("Impossible de récupérer les processus, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);

    return {
      status: "error",
      message: `Impossible de lister les processus : ${msg}`,
    };
  }
};

/**
 * Handler terminer un processus (kill)
 * Permet de fermer un processus bloqué
 */
export const handleKillProcess = async (
  args: { processName: string; force?: boolean },
  ctx: HandlerContext,
) => {
  const { addLog, speak, setStatus } = ctx;

  addLog(
    `Terminaison processus "${args.processName}"${args.force ? " (forcé)" : ""}...`,
    "SYSTEM",
    "info",
  );
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/system/process/kill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        processName: args.processName,
        force: args.force || false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const message = `Processus "${args.processName}" terminé, Monsieur.`;
    speak(message);
    addLog(`✅ ${message}`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      message,
      data: data.result,
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur kill processus: ${msg}`, "SYSTEM", "error");
    speak(`Impossible de terminer le processus, Monsieur.`);
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);

    return {
      status: "error",
      message: `Impossible de terminer le processus : ${msg}`,
    };
  }
};

/**
 * Handler contrôle volume système
 * Permet d'ajuster le volume ou de mute/unmute
 */
export const handleVolumeControl = async (
  args: { action: "set" | "mute" | "unmute"; level?: number },
  ctx: HandlerContext,
) => {
  const { addLog, speak, setStatus } = ctx;

  addLog(`Contrôle audio: ${args.action}...`, "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/system/audio/volume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: args.action,
        level: args.level,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    let message = "";
    if (args.action === "set" && args.level !== undefined) {
      message = `Volume réglé à ${args.level}%, Monsieur.`;
    } else if (args.action === "mute") {
      message = "Audio coupé, Monsieur.";
    } else if (args.action === "unmute") {
      message = "Audio rétabli, Monsieur.";
    }

    speak(message);
    addLog(`✅ ${message}`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      message,
      data: data.result,
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur contrôle audio: ${msg}`, "SYSTEM", "error");
    speak("Impossible de contrôler l'audio, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);

    return {
      status: "error",
      message: `Impossible de contrôler l'audio : ${msg}`,
    };
  }
};

/**
 * Handler récupération niveau volume actuel
 * Retourne le volume système et l'état mute
 */
export const handleGetVolume = async (
  _args: Record<string, never>,
  ctx: HandlerContext,
) => {
  const { addLog, speak, setStatus } = ctx;

  addLog("Récupération niveau volume...", "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/system/audio/volume`);

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const { level, muted } = data;
    const message = muted
      ? "Audio actuellement coupé, Monsieur."
      : `Volume actuel : ${level}%, Monsieur.`;

    speak(message);
    addLog(`🔊 ${message}`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      message,
      data: { level, muted },
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur récupération volume: ${msg}`, "SYSTEM", "error");
    speak("Impossible de récupérer le volume, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);

    return {
      status: "error",
      message: `Impossible de récupérer le volume : ${msg}`,
    };
  }
};
