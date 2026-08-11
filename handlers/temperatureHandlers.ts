/**
 * Handlers pour monitoring températures
 * - Température extérieure (OpenWeatherMap)
 * - Température piscine (Tuya)
 * - Températures système (PC/NAS)
 */

import type { HandlerContext } from "../types/app.types";
import { SystemStatus } from "../types";

const API_BASE = "http://localhost:3001";

/**
 * Handler température extérieure
 * Appelle OpenWeatherMap via backend et affiche overlay HUD
 */
export const handleOutdoorTemperature = async (
  args: { city?: string },
  ctx: HandlerContext,
) => {
  const { addLog, setStatus, speak } = ctx;
  const city = args.city || "Le Luc en Provence,FR";

  addLog(
    `Récupération température extérieure pour ${city}...`,
    "SYSTEM",
    "info",
  );
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(
      `${API_BASE}/api/temperature/outdoor?city=${encodeURIComponent(city)}`,
    );

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    const weather = data.weather;

    // Réponse vocale
    const tempMessage = `Il fait actuellement ${weather.temperature} degrés à ${weather.city}, avec ${weather.description}. Ressenti : ${weather.feelsLike} degrés.`;
    speak(tempMessage);

    addLog(
      `Température: ${weather.temperature}°C (${weather.description})`,
      "SYSTEM",
      "success",
    );
    setStatus(SystemStatus.IDLE);

    // TODO: Afficher overlay HUD température extérieure
    return {
      status: "success",
      data: weather,
      message: tempMessage,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    addLog(`Erreur température: ${errorMsg}`, "SYSTEM", "error");
    speak("Impossible de récupérer la température extérieure, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);

    return {
      status: "error",
      message: errorMsg,
    };
  }
};

/**
 * Handler température piscine
 * Récupère température capteur Tuya et alerte si hors plage
 */
export const handlePoolTemperature = async (
  _args: Record<string, never>,
  ctx: HandlerContext,
) => {
  const { addLog, setStatus, speak } = ctx;

  addLog("Récupération température piscine...", "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/temperature/pool`);

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    const pool = data.pool;

    // Réponse vocale avec alerte si nécessaire
    let tempMessage = `La température de la piscine est de ${pool.temperature} degrés.`;

    if (pool.temperature < 18) {
      tempMessage += " C'est un peu froid pour se baigner, Monsieur.";
    } else if (pool.temperature > 30) {
      tempMessage += " L'eau est très chaude, Monsieur.";
    } else if (pool.temperature >= 24 && pool.temperature <= 28) {
      tempMessage += " Température idéale pour la baignade.";
    }

    speak(tempMessage);
    addLog(`Température piscine: ${pool.temperature}°C`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    // TODO: Afficher overlay HUD température piscine
    return {
      status: "success",
      data: pool,
      message: tempMessage,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    addLog(`Erreur température piscine: ${errorMsg}`, "SYSTEM", "error");
    speak("Impossible de récupérer la température de la piscine, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);

    return {
      status: "error",
      message: errorMsg,
    };
  }
};

/**
 * Handler températures système (PC + NAS)
 * Monitoring CPU, GPU, disques avec alertes si >80°C
 */
export const handleSystemTemperatures = async (
  args: Record<string, never>,
  ctx: HandlerContext,
) => {
  const { addLog, setStatus, speak } = ctx;

  addLog("Récupération températures système...", "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/temperature/system`);

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    const system = data.system;

    // Analyser les températures et détecter alertes
    const alerts: string[] = [];

    if (system.pc.cpu > 80) alerts.push(`CPU PC à ${system.pc.cpu} degrés`);
    if (system.pc.gpu > 80) alerts.push(`GPU à ${system.pc.gpu} degrés`);
    if (system.nas.cpu > 70) alerts.push(`CPU NAS à ${system.nas.cpu} degrés`);

    // Réponse vocale
    let tempMessage = `PC : CPU ${system.pc.cpu} degrés, GPU ${system.pc.gpu} degrés. NAS : CPU ${system.nas.cpu} degrés.`;

    if (alerts.length > 0) {
      tempMessage += ` Attention : ${alerts.join(", ")}.`;
    } else {
      tempMessage += " Toutes les températures sont normales.";
    }

    speak(tempMessage);
    addLog(`Températures système récupérées`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    // TODO: Afficher overlay HUD températures système
    return {
      status: "success",
      data: system,
      message: tempMessage,
      alerts,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    addLog(`Erreur températures système: ${errorMsg}`, "SYSTEM", "error");
    speak("Impossible de récupérer les températures système, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);

    return {
      status: "error",
      message: errorMsg,
    };
  }
};
