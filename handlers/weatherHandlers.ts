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

    // Note: Pour l'instant on utilise le service actuel.
    // Si needsForecast est vrai, on pourrait appeler un futur service forecast.

    return { status: "success", data };
  } catch (error: unknown) {
    const err = error as Error;
    addLog(`Erreur météo: ${err.message || String(error)}`, "SYSTEM", "error");
    throw error;
  }
}
