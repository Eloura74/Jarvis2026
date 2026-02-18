import { loadSettings } from "./configService";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface RouteInfo {
  distance: string;
  duration: string;
  durationInTraffic?: string;
  startAddress: string;
  endAddress: string;
}

/**
 * Calcule le temps de trajet via Google Maps Distance Matrix API
 */
// Helper Geolocation
async function getCurrentPosition(): Promise<string | null> {
  if (!navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve(`${pos.coords.latitude},${pos.coords.longitude}`);
      },
      (err) => {
        console.warn("⚠️ Géolocalisation refusée ou échouée:", err.message);
        resolve(null);
      },
      { timeout: 5000 },
    );
  });
}

/**
 * Calcule le temps de trajet via Google Maps Distance Matrix API
 */
export async function getTravelTime(
  destination: string,
  departureTime?: string, // Format ISO ou "now"
  arrivalTime?: string, // Format ISO (nouveau paramètre)
): Promise<
  | RouteInfo
  | null
  | (RouteInfo & {
      recommendedDeparture: string;
      diffToLeave: string;
      arrivalTarget: string;
    })
> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("⚠️ Clé API Google Maps manquante");
    return null;
  }

  // Résolution des alias via settings
  const settings = await loadSettings();
  console.log(
    "📍 NavigationService: Settings loaded:",
    Object.keys(settings.savedLocations || {}),
  );

  let finalDestination = destination;

  if (settings.savedLocations) {
    const rawDest = destination.toLowerCase().trim();

    // Mapping manuel pour gérer les traductions de Gemini
    const commonMappings: Record<string, string[]> = {
      work: ["travail", "bureau", "job", "entreprise"],
      home: ["maison", "domicile", "appart", "appartement"],
      gym: ["salle de sport", "sport"],
    };

    // Chercher d'abord correspondance exacte
    let foundAlias = Object.keys(settings.savedLocations).find(
      (k) => k.toLowerCase() === rawDest,
    );

    // Si pas trouvé, essayer les mappings
    if (!foundAlias) {
      // Est-ce que 'destination' est un mot clé anglais connu ?
      const potentialFrenchKeys = commonMappings[rawDest];
      if (potentialFrenchKeys) {
        foundAlias = Object.keys(settings.savedLocations).find((k) =>
          potentialFrenchKeys.includes(k.toLowerCase()),
        );
      }
    }

    if (foundAlias) {
      finalDestination = settings.savedLocations[foundAlias];
      console.log(
        `📍 Alias résolu: "${destination}" -> "${foundAlias}" -> "${finalDestination}"`,
      );
    } else {
      console.log(
        `📍 Alias NON résolu pour "${destination}". Available:`,
        Object.keys(settings.savedLocations),
      );
    }
  }

  // Origine : Géolocalisation > Maison > Domicile > Paris
  let origin =
    settings.savedLocations?.["maison"] ||
    settings.savedLocations?.["domicile"];

  if (!origin) {
    console.log(
      "📍 Pas d'origine sauvegardée, tentative de géolocalisation...",
    );
    const geoPos = await getCurrentPosition();
    if (geoPos) {
      origin = geoPos;
      console.log("📍 Géolocalisation réussie:", origin);
    } else {
      origin = "Paris, France";
      console.log("⚠️ Géolocalisation échouée, fallback:", origin);
    }
  }

  // Helper pour parser les inputs de temps (ISO ou "HH:MM" ou "HH:MM:SS")
  function parseInputTime(input: string): Date | null {
    if (!input) return null;
    const now = new Date();

    // Cas 1: ISO complet
    const isoDate = new Date(input);
    if (!isNaN(isoDate.getTime()) && input.includes("T")) {
      return isoDate;
    }

    // Cas 2: Format Heure simple "09:00" ou "9:00" ou "09:00:00"
    const timeMatch = input.match(/(\d{1,2})[:h](\d{2})(?::(\d{2}))?/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;

      const date = new Date(now);
      date.setHours(hours, minutes, seconds, 0);

      // Si l'heure est déja passée aujourd'hui, on suppose demain ?
      // Pour l'instant on garde aujourd'hui (le trajet peut être immédiat ou pour plus tard)
      // Si l'utilisateur dit "arriver à 08h00" et il est 20h, c'est surement demain.
      if (date.getTime() < now.getTime() - 1000 * 60 * 60) {
        // Si passé de plus d'1h
        date.setDate(date.getDate() + 1);
      }
      return date;
    }

    return null;
  }

  // MODE "ARRIVAL TIME" (Calcul inversé)
  if (arrivalTime && arrivalTime !== "now") {
    console.log(`📍 Calcul départ pour arriver à [raw]: ${arrivalTime}`);

    const arrivalDate = parseInputTime(arrivalTime);

    if (!arrivalDate || isNaN(arrivalDate.getTime())) {
      console.error("❌ Arrival Time invalid:", arrivalTime);
      // Fallback sur mode normal
      return await fetchRoute(origin, finalDestination, "now");
    }

    console.log(
      `📍 Calcul départ pour arriver à [parsed]: ${arrivalDate.toISOString()}`,
    );

    // 1. D'abord, obtenir la durée approximative du trajet (sans trafic ou avec trafic actuel)
    // On fait un premier appel "now" pour avoir la durée
    const routeEstimate = await fetchRoute(origin, finalDestination, "now");

    if (!routeEstimate || !routeEstimate.duration_value) {
      console.warn("Impossible d'estimer le temps initial");
      return await fetchRoute(origin, finalDestination, "now");
    }

    // 2. Calculer l'heure de départ théorique
    // Departure = Arrival - Duration
    const durationSec = routeEstimate.duration_value;
    const departureDate = new Date(arrivalDate.getTime() - durationSec * 1000);
    const departureDateWithBuffer = new Date(
      departureDate.getTime() - 10 * 60 * 1000,
    ); // +10min buffer sécurité

    // Recalculer le trajet avec cette heure de départ théorique pour vérifier le trafic
    // (Optionnel mais plus précis) - Pour l'instant on garde l'estimation "now" mais on renvoie le conseil

    return {
      ...routeEstimate,
      recommendedDeparture: departureDateWithBuffer.toISOString(),
      diffToLeave: `Vous devriez partir vers ${departureDateWithBuffer.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      arrivalTarget: arrivalDate.toISOString(),
    };
  }

  // MODE NORMAL (Departure Time)
  return await fetchRoute(origin, finalDestination, departureTime || "now");
}

// Fonction Helper pour l'appel API (évite duplication)
async function fetchRoute(
  origin: string,
  destination: string,
  departureTimeType: string,
): Promise<(RouteInfo & { duration_value: number }) | null> {
  const baseUrl = "http://localhost:3001";
  let depTimeVal = "now";

  if (departureTimeType && departureTimeType !== "now") {
    const d = new Date(departureTimeType);
    if (!isNaN(d.getTime()))
      depTimeVal = Math.floor(d.getTime() / 1000).toString();
  }

  const proxyUrl = `${baseUrl}/api/google/distancematrix?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&departure_time=${depTimeVal}`;
  console.log("📍 FetchRoute:", proxyUrl);

  try {
    const response = await fetch(proxyUrl);
    // Debug: Lire le texte brut d'abord
    const textResponse = await response.text();
    // console.log("📍 NavigationService: Raw response:", textResponse);

    if (!response.ok) {
      console.error(`Erreur HTTP Proxy: ${response.status}`, textResponse);
      throw new Error(`Erreur HTTP ${response.status}: ${textResponse}`);
    }

    let data;
    try {
      data = JSON.parse(textResponse);
    } catch {
      throw new Error(
        `Réponse Backend invalide (pas du JSON): ${textResponse.substring(0, 50)}...`,
      );
    }

    if (data.status !== "OK") {
      throw new Error(`Erreur API Google: ${data.status}`);
    }

    const rows = data.rows;
    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    const element = row.elements[0];

    if (element.status !== "OK") {
      console.warn(`⚠️ Google Matrix Element Status: ${element.status}`);
      return null;
    }

    return {
      distance: element.distance.text,
      duration: element.duration.text,
      duration_value: element.duration.value, // Ajout pour calculs
      durationInTraffic:
        element.duration_in_traffic?.text || element.duration.text,
      startAddress: data.origin_addresses[0],
      endAddress: data.destination_addresses[0],
    };
  } catch (e) {
    console.error("Erreur calcul trajet:", e);
    return null;
  }
}
