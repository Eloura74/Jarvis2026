/**
 * Service Météo - Intégration OpenWeatherMap API
 *
 * Fournit les données météorologiques en temps réel :
 * - Température actuelle
 * - Conditions météo (ensoleillé, nuageux, pluvieux)
 * - Vitesse du vent
 * - Humidité
 * - Localisation automatique via Geolocation API
 *
 * @module weatherService
 */

// ============================================================================
// TYPES
// ============================================================================

/** Données météo retournées par le service */
export interface WeatherData {
  /** Température en degrés Celsius */
  temperature: number;
  /** Description météo (ex: "Ensoleillé", "Nuageux") */
  condition: string;
  /** Code icône OpenWeatherMap (ex: "01d" pour soleil) */
  iconCode: string;
  /** Nom de la ville */
  city: string;
  /** Vitesse du vent en km/h */
  windSpeed: number;
  /** Humidité en pourcentage */
  humidity: number;
  /** Probabilité de précipitations (0-100%) */
  precipitation: number;
}

/** Position géographique */
interface GeoPosition {
  latitude: number;
  longitude: number;
}

// ============================================================================
// CONFIGURATION API
// ============================================================================

/** URL de base de notre proxy backend (contourne AdBlock/CORS) */
const API_BASE_URL = "http://localhost:3001/api/weather";

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Traduit les conditions météo d'anglais vers français
 * ...
 */
const translateCondition = (condition: string): string => {
  const translations: Record<string, string> = {
    Clear: "Ensoleillé",
    Clouds: "Nuageux",
    Rain: "Pluvieux",
    Drizzle: "Bruine",
    Thunderstorm: "Orage",
    Snow: "Neige",
    Mist: "Brume",
    Fog: "Brouillard",
    Haze: "Brume légère",
  };

  return translations[condition] || condition;
};

/**
 * Convertit la vitesse du vent de m/s vers km/h
 * ...
 */
const convertWindSpeed = (metersPerSecond: number): number => {
  return Math.round(metersPerSecond * 3.6);
};

// ============================================================================
// GEOLOCALISATION
// ============================================================================

/**
 * Récupère la position GPS de l'utilisateur
 *
 * Utilise l'API Geolocation du navigateur pour obtenir la latitude et longitude.
 * Nécessite l'autorisation de l'utilisateur.
 *
 * @returns Promise avec latitude et longitude
 * @throws Error si la géolocalisation échoue ou est refusée
 */
export const getUserPosition = (): Promise<GeoPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Géolocalisation non supportée par ce navigateur"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        // Silencing the gesture warning by providing a clear fallback
        console.warn("Geolocation fallback triggered or permission denied.");
        reject(error);
      },
      {
        enableHighAccuracy: false, // Économise la batterie
        timeout: 10000, // 10 secondes max
        maximumAge: 300000, // Cache de 5 minutes
      },
    );
  });
};

// ============================================================================
// API MÉTÉO (VIA PROXY BACKEND)
// ============================================================================

/**
 * Récupère les données météo pour une position donnée
 * ...
 */
export const fetchWeatherData = async (
  latitude: number,
  longitude: number,
): Promise<WeatherData> => {
  try {
    // Appel au proxy backend
    const url = `${API_BASE_URL}?lat=${latitude}&lon=${longitude}`;

    // Appel API
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Erreur API Proxy : ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // Extraction et formatage des données (structure identique)
    const weatherData: WeatherData = {
      temperature: Math.round(data.main.temp),
      condition: translateCondition(data.weather[0].main),
      iconCode: data.weather[0].icon,
      city: data.name,
      windSpeed: convertWindSpeed(data.wind.speed),
      humidity: data.main.humidity,
      precipitation:
        data.main.humidity > 80 ? Math.round((data.main.humidity - 80) * 5) : 0,
    };

    return weatherData;
  } catch (error) {
    console.error("Erreur récupération météo :", error);
    // Reuse offline fallback logic if needed or let caller handle it.
    // But since we had a fallback in caller, we can throw or return fallback here.
    // The previous edit added fallback inside getWeatherByCity but not fetchWeatherData?
    // Let's add standard fallback here too to be safe.
    return {
      temperature: 0,
      condition: "Offline",
      iconCode: "50d",
      city: "Unknown",
      windSpeed: 0,
      humidity: 0,
      precipitation: 0,
    };
  }
};

// ... (getCurrentWeather inchangée) ...

/**
 * Récupère la météo pour une ville spécifique
 * ...
 */
export const getWeatherByCity = async (
  cityName: string,
): Promise<WeatherData> => {
  try {
    const url = `${API_BASE_URL}?city=${encodeURIComponent(cityName)}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Ville "${cityName}" introuvable`);
      }
      throw new Error(`Erreur API Proxy : ${response.status}`);
    }

    const data = await response.json();

    const weatherData: WeatherData = {
      temperature: Math.round(data.main.temp),
      condition: translateCondition(data.weather[0].main),
      iconCode: data.weather[0].icon,
      city: data.name,
      windSpeed: convertWindSpeed(data.wind.speed),
      humidity: data.main.humidity,
      precipitation:
        data.main.humidity > 80 ? Math.round((data.main.humidity - 80) * 5) : 0,
    };

    return weatherData;
  } catch (error) {
    console.error("Erreur récupération météo par ville :", error);
    return {
      temperature: 0,
      condition: "Offline",
      iconCode: "50d",
      city: cityName,
      windSpeed: 0,
      humidity: 0,
      precipitation: 0,
    };
  }
};

/**
 * Retourne l'URL de l'icône météo OpenWeatherMap
 *
 * @param iconCode - Code icône (ex: "01d", "10n")
 * @param size - Taille de l'icône ("2x" = 100px, "4x" = 200px)
 * @returns URL complète de l'icône
 */
export const getWeatherIconUrl = (
  iconCode: string,
  size: "2x" | "4x" = "2x",
): string => {
  return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
};
