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

/** Clé API OpenWeatherMap (à définir dans .env.local) */
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || "";

/** URL de base de l'API OpenWeatherMap */
const API_BASE_URL = "https://api.openweathermap.org/data/2.5";

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Traduit les conditions météo d'anglais vers français
 *
 * @param condition - Description en anglais (ex: "Clear")
 * @returns Description en français (ex: "Ensoleillé")
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
 *
 * @param metersPerSecond - Vitesse en m/s
 * @returns Vitesse en km/h arrondie
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
// API MÉTÉO
// ============================================================================

/**
 * Récupère les données météo pour une position donnée
 *
 * Appelle l'API OpenWeatherMap avec les coordonnées GPS.
 * Les données sont en métrique (Celsius, km/h).
 *
 * @param latitude - Latitude GPS
 * @param longitude - Longitude GPS
 * @returns Promise avec les données météo formatées
 * @throws Error si l'appel API échoue ou si la clé API est manquante
 */
export const fetchWeatherData = async (
  latitude: number,
  longitude: number,
): Promise<WeatherData> => {
  // Vérification de la clé API
  if (!API_KEY) {
    throw new Error(
      "Clé API OpenWeatherMap manquante. Ajoutez VITE_OPENWEATHER_API_KEY dans .env.local",
    );
  }

  try {
    // Construction de l'URL avec paramètres
    const url = `${API_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=fr`;

    // Appel API
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Clé API invalide");
      }
      throw new Error(`Erreur API : ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extraction et formatage des données
    const weatherData: WeatherData = {
      temperature: Math.round(data.main.temp),
      condition: translateCondition(data.weather[0].main),
      iconCode: data.weather[0].icon,
      city: data.name,
      windSpeed: convertWindSpeed(data.wind.speed),
      humidity: data.main.humidity,
      // OpenWeatherMap ne fournit pas directement la probabilité de précipitations
      // dans l'endpoint /weather (uniquement dans /forecast)
      // On utilise l'humidité comme approximation (>80% = risque de pluie)
      precipitation:
        data.main.humidity > 80 ? Math.round((data.main.humidity - 80) * 5) : 0,
    };

    return weatherData;
  } catch (error) {
    console.error("Erreur récupération météo :", error);
    throw error;
  }
};

/**
 * Récupère la météo pour la position actuelle de l'utilisateur
 *
 * Combine la géolocalisation et l'appel API météo.
 * Fonction principale à utiliser dans les composants.
 *
 * @returns Promise avec les données météo
 * @throws Error si la géolocalisation ou l'API échoue
 *
 * @example
 * ```typescript
 * const weather = await getCurrentWeather();
 * console.log(`${weather.temperature}° à ${weather.city}`);
 * ```
 */
export const getCurrentWeather = async (): Promise<WeatherData> => {
  try {
    // 1. Tenter la géolocalisation
    const position = await getUserPosition();
    return await fetchWeatherData(position.latitude, position.longitude);
  } catch (error) {
    // 2. Fallback sur une ville par défaut (ou IP-based si on avait le service)
    // On utilise Paris par défaut pour ne pas laisser le widget vide
    return await getWeatherByCity("Paris");
  }
};

/**
 * Récupère la météo pour une ville spécifique
 *
 * Utile si l'utilisateur refuse la géolocalisation ou veut une autre ville.
 *
 * @param cityName - Nom de la ville (ex: "Paris", "London")
 * @returns Promise avec les données météo
 * @throws Error si l'appel API échoue
 */
export const getWeatherByCity = async (
  cityName: string,
): Promise<WeatherData> => {
  if (!API_KEY) {
    throw new Error("Clé API OpenWeatherMap manquante");
  }

  try {
    const url = `${API_BASE_URL}/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric&lang=fr`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Ville "${cityName}" introuvable`);
      }
      throw new Error(`Erreur API : ${response.status}`);
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
    throw error;
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
