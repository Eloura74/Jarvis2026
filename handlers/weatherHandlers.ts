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
  const { city, dateTime, needsForecast } = args;

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

    // Note: Pour l'instant on utilise le service actuel.
    // Si needsForecast est vrai, on pourrait appeler un futur service forecast.

    return { status: "success", data };
  } catch (error: any) {
    addLog(
      `Erreur météo: ${error.message || String(error)}`,
      "SYSTEM",
      "error",
    );
    throw error;
  }
}
