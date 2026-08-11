/**
 * Service Google Maps Directions API
 * API gratuite : 28 000 requêtes/mois
 * Cache 5min pour économiser quota
 */

const directionsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Calcule le temps de trajet entre deux adresses avec trafic en temps réel
 *
 * @param {string} origin - Adresse de départ
 * @param {string} destination - Adresse d'arrivée
 * @param {string} mode - Mode de transport (driving, walking, bicycling, transit)
 * @returns {Promise<Object>} Données de trajet (durée, distance, trafic)
 */
export async function getDirections(origin, destination, mode = "driving") {
  const cacheKey = `${origin}|${destination}|${mode}`;
  const now = Date.now();

  // Vérifier cache
  const cached = directionsCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    console.log("🗺️ [GoogleMaps] Utilisation du cache");
    return cached.data;
  }

  const API_KEY =
    process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY manquante dans .env");
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.append("origin", origin);
    url.searchParams.append("destination", destination);
    url.searchParams.append("mode", mode);
    url.searchParams.append("departure_time", "now"); // Trafic en temps réel
    url.searchParams.append("traffic_model", "best_guess");
    url.searchParams.append("language", "fr");
    url.searchParams.append("key", API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(
        `Google Maps status: ${data.status} - ${data.error_message || "Unknown error"}`,
      );
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    const result = {
      origin: leg.start_address,
      destination: leg.end_address,
      distance: {
        text: leg.distance.text,
        meters: leg.distance.value,
      },
      duration: {
        text: leg.duration.text,
        seconds: leg.duration.value,
      },
      durationInTraffic: leg.duration_in_traffic
        ? {
            text: leg.duration_in_traffic.text,
            seconds: leg.duration_in_traffic.value,
          }
        : null,
      steps: leg.steps.map((step) => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ""), // Retirer HTML
        distance: step.distance.text,
        duration: step.duration.text,
      })),
      trafficDelay: leg.duration_in_traffic
        ? leg.duration_in_traffic.value - leg.duration.value
        : 0,
      timestamp: now,
    };

    // Mettre en cache
    directionsCache.set(cacheKey, { data: result, timestamp: now });

    console.log(
      `🗺️ [GoogleMaps] ${origin} → ${destination}: ${result.durationInTraffic?.text || result.duration.text} (${result.distance.text})`,
    );
    return result;
  } catch (error) {
    console.error("❌ [GoogleMaps] Erreur:", error.message);
    throw error;
  }
}

/**
 * Nettoie le cache périodiquement (toutes les 10 minutes)
 */
setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of directionsCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        directionsCache.delete(key);
      }
    }
  },
  10 * 60 * 1000,
);
