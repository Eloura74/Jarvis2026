/**
 * Handlers pour Sécurité & Surveillance
 * - Alertes intrusion Home Assistant
 * - Caméras (snapshots, streaming)
 * - Détection mouvement
 * - État système sécurité
 */

import type { HandlerContext } from "../types/app.types";
import { SystemStatus } from "../types";

const API_BASE = "http://localhost:3001";

/**
 * Handler récupération état système sécurité
 * Vérifie capteurs portes/fenêtres, détecteurs mouvement, alarme
 */
export const handleSecurityStatus = async (
  _args: Record<string, never>,
  ctx: HandlerContext,
) => {
  const { addLog, speak, setStatus } = ctx;

  addLog("Vérification état système sécurité...", "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/security/status`);

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const { doors, windows, motionSensors, alarmArmed, alerts } = data;

    // Compter éléments ouverts/actifs
    const openDoors = doors.filter((d: any) => d.state === "open").length;
    const openWindows = windows.filter((w: any) => w.state === "open").length;
    const activeMotion = motionSensors.filter(
      (m: any) => m.state === "on",
    ).length;

    // Construire message vocal
    let message = "";
    if (alarmArmed) {
      message = "Alarme activée. ";
    } else {
      message = "Alarme désactivée. ";
    }

    if (openDoors > 0 || openWindows > 0) {
      message += `${openDoors} porte${openDoors > 1 ? "s" : ""} et ${openWindows} fenêtre${openWindows > 1 ? "s" : ""} ouvertes. `;
    } else {
      message += "Toutes les ouvertures sont fermées. ";
    }

    if (activeMotion > 0) {
      message += `Mouvement détecté sur ${activeMotion} capteur${activeMotion > 1 ? "s" : ""}.`;
    } else {
      message += "Aucun mouvement détecté.";
    }

    // Alertes actives
    if (alerts && alerts.length > 0) {
      message += ` ⚠️ ${alerts.length} alerte${alerts.length > 1 ? "s" : ""} active${alerts.length > 1 ? "s" : ""} !`;
      speak(`Attention Monsieur, ${message}`);
      addLog(`🚨 ${message}`, "SECURITY", "warning");
    } else {
      speak(message + " Tout est normal, Monsieur.");
      addLog(`✅ ${message}`, "SECURITY", "success");
    }

    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      message,
      data: { doors, windows, motionSensors, alarmArmed, alerts },
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur sécurité: ${msg}`, "SYSTEM", "error");
    speak("Impossible de vérifier l'état de sécurité, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);

    return {
      status: "error",
      message: `Impossible de vérifier la sécurité : ${msg}`,
    };
  }
};

/**
 * Handler activation/désactivation alarme
 * Permet d'armer ou désarmer le système d'alarme
 */
export const handleAlarmControl = async (
  args: { action: "arm" | "disarm"; mode?: "home" | "away" },
  ctx: HandlerContext,
) => {
  const { addLog, speak, setStatus } = ctx;

  const action = args.action;
  const mode = args.mode || "away";

  addLog(
    `${action === "arm" ? "Activation" : "Désactivation"} alarme (mode: ${mode})...`,
    "SECURITY",
    "info",
  );
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/security/alarm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, mode }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    let message = "";
    if (action === "arm") {
      message = `Alarme activée en mode ${mode === "home" ? "présence" : "absence"}, Monsieur.`;
    } else {
      message = "Alarme désactivée, Monsieur.";
    }

    speak(message);
    addLog(`✅ ${message}`, "SECURITY", "success");
    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      message,
      data: data.result,
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur contrôle alarme: ${msg}`, "SYSTEM", "error");
    speak("Impossible de contrôler l'alarme, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);

    return {
      status: "error",
      message: `Impossible de contrôler l'alarme : ${msg}`,
    };
  }
};

/**
 * Handler récupération snapshot caméra
 * Capture une image depuis une caméra Home Assistant
 */
export const handleCameraSnapshot = async (
  args: { cameraName: string },
  ctx: HandlerContext,
) => {
  const { addLog, speak, setStatus } = ctx;

  addLog(`Capture snapshot caméra "${args.cameraName}"...`, "SECURITY", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(
      `${API_BASE}/api/security/camera/snapshot?camera=${encodeURIComponent(args.cameraName)}`,
    );

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const message = `Snapshot caméra "${args.cameraName}" capturé, Monsieur.`;
    speak(message);
    addLog(`📷 ${message}`, "SECURITY", "success");
    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      message,
      data: {
        cameraName: args.cameraName,
        imageUrl: data.imageUrl,
        timestamp: data.timestamp,
      },
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur snapshot caméra: ${msg}`, "SYSTEM", "error");
    speak("Impossible de capturer l'image, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);

    return {
      status: "error",
      message: `Impossible de capturer snapshot : ${msg}`,
    };
  }
};

/**
 * Handler liste caméras disponibles
 * Retourne toutes les caméras configurées dans Home Assistant
 */
export const handleListCameras = async (
  _args: Record<string, never>,
  ctx: HandlerContext,
) => {
  const { addLog, speak, setStatus } = ctx;

  addLog("Récupération liste caméras...", "SECURITY", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/security/cameras`);

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const cameras = data.cameras;

    if (!cameras || cameras.length === 0) {
      speak("Aucune caméra configurée, Monsieur.");
      setStatus(SystemStatus.IDLE);
      return {
        status: "success",
        message: "Aucune caméra",
        data: [],
      };
    }

    const message = `${cameras.length} caméra${cameras.length > 1 ? "s" : ""} disponible${cameras.length > 1 ? "s" : ""} : ${cameras.map((c: any) => c.name).join(", ")}.`;
    speak(message);

    cameras.forEach((cam: any) => {
      addLog(
        `📷 ${cam.name} (${cam.state === "idle" ? "inactive" : "active"})`,
        "SECURITY",
        "info",
      );
    });

    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      message,
      data: cameras,
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur liste caméras: ${msg}`, "SYSTEM", "error");
    speak("Impossible de récupérer les caméras, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);

    return {
      status: "error",
      message: `Impossible de lister les caméras : ${msg}`,
    };
  }
};

/**
 * Handler historique détections mouvement
 * Retourne les dernières détections de mouvement
 */
export const handleMotionHistory = async (
  args: { hours?: number },
  ctx: HandlerContext,
) => {
  const { addLog, speak, setStatus } = ctx;

  const hours = args.hours || 24;

  addLog(
    `Récupération historique mouvement (${hours}h)...`,
    "SECURITY",
    "info",
  );
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(
      `${API_BASE}/api/security/motion/history?hours=${hours}`,
    );

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const detections = data.detections;

    if (!detections || detections.length === 0) {
      speak(
        `Aucune détection de mouvement dans les ${hours} dernières heures, Monsieur.`,
      );
      setStatus(SystemStatus.IDLE);
      return {
        status: "success",
        message: "Aucune détection",
        data: [],
      };
    }

    const message = `${detections.length} détection${detections.length > 1 ? "s" : ""} de mouvement dans les ${hours} dernières heures.`;
    speak(message);

    detections.slice(0, 5).forEach((det: any) => {
      const time = new Date(det.timestamp).toLocaleTimeString("fr-FR");
      addLog(
        `🚶 ${time} - ${det.sensor} (${det.location})`,
        "SECURITY",
        "info",
      );
    });

    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      message,
      data: detections,
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur historique mouvement: ${msg}`, "SYSTEM", "error");
    speak("Impossible de récupérer l'historique, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);

    return {
      status: "error",
      message: `Impossible de récupérer l'historique : ${msg}`,
    };
  }
};
