/**
 * weatherHandlers.ts - Gestionnaires pour les outils météo
 */

import { HandlerContext } from "../types/app.types";
import * as weatherService from "../services/weatherService";

/**
 * Récupère la météo (actuelle ou prévisions)
 */
export async function handleGetWeather(
  args: { city?: string; dateTime?: string; needsForecast?: boolean },
  ctx: HandlerContext,
) {
  const { addLog } = ctx;
  const { city } = args;

  try {
    addLog(
      `Consultation météo pour ${city || "votre position"}...`,
      "OMNI",
      "info",
    );

    let data;
    if (city) {
      data = await weatherService.getWeatherByCity(city);
    } else {
      data = await weatherService.getCurrentWeather();
    }

    // Call Sphere API to display the temperature
    if (data && data.temperature !== undefined) {
      try {
        fetch("http://localhost:3001/api/sphere/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: `${data.temperature} C` }),
        }).catch((err) => console.warn("Sphere API Error (text):", err));
      } catch (err) {
        console.warn("Failed to send weather text to sphere:", err);
      }
    }

    // Note: Pour l'instant on utilise le service actuel.
    // Si needsForecast est vrai, on pourrait appeler un futur service forecast.

    return { status: "success", data };
  } catch (error: unknown) {
    const err = error as Error;
    addLog(`Erreur météo: ${err.message || String(error)}`, "SYSTEM", "error");
    throw error;
  }
}
