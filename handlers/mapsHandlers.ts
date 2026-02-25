/**
 * Handlers pour Google Maps
 * - Temps de trajet avec trafic en temps réel
 */

import type { HandlerContext } from "../types/app.types";
import { SystemStatus } from "../types";

const API_BASE = "http://localhost:3001";

/**
 * Handler temps de trajet Google Maps
 * Calcule durée avec trafic en temps réel entre deux adresses
 */
export const handleGetDirections = async (
  args: { origin: string; destination: string; mode?: string },
  ctx: HandlerContext,
) => {
  const { addLog, setStatus, speak } = ctx;
  const { origin, destination, mode = "driving" } = args;

  addLog(`Calcul trajet ${origin} → ${destination}...`, "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const params = new URLSearchParams({
      origin,
      destination,
      mode,
    });

    const response = await fetch(`${API_BASE}/api/maps/directions?${params}`);
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    const directions = data.directions;

    // Construire réponse vocale
    let message = `Pour aller de ${directions.origin} à ${directions.destination}, `;
    
    if (directions.durationInTraffic) {
      const delay = Math.round(directions.trafficDelay / 60);
      message += `il faut compter ${directions.durationInTraffic.text} avec le trafic actuel`;
      
      if (delay > 5) {
        message += `, soit ${delay} minutes de plus que d'habitude`;
      } else if (delay < -2) {
        message += `, le trafic est fluide`;
      }
    } else {
      message += `il faut compter ${directions.duration.text}`;
    }
    
    message += `. Distance : ${directions.distance.text}.`;

    speak(message);
    addLog(`Trajet: ${directions.durationInTraffic?.text || directions.duration.text} (${directions.distance.text})`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    // TODO: Afficher overlay HUD trajet Google Maps
    return {
      status: "success",
      data: directions,
      message,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    addLog(`Erreur Google Maps: ${errorMsg}`, "SYSTEM", "error");
    speak("Impossible de calculer le trajet, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
    
    return {
      status: "error",
      message: errorMsg,
    };
  }
};
