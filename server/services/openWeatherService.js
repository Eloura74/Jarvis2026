/**
 * Service OpenWeatherMap
 * API gratuite : 1000 requêtes/jour
 * Cache 15min pour économiser quota
 */

let weatherCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Récupère la météo actuelle pour une ville
 * 
 * @param {string} city - Nom de la ville (ex: "Istres,FR")
 * @returns {Promise<Object>} Données météo
 */
export async function getCurrentWeather(city = "Istres,FR") {
  const now = Date.now();
  
  // Retourner cache si valide
  if (weatherCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log("☁️ [OpenWeather] Utilisation du cache");
    return weatherCache;
  }

  const API_KEY = process.env.OPENWEATHER_API_KEY;
  if (!API_KEY) {
    throw new Error("OPENWEATHER_API_KEY manquante dans .env");
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=fr`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.status}`);
    }

    const data = await response.json();
    
    const result = {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: data.wind.speed,
      city: data.name,
      country: data.sys.country,
      timestamp: now,
    };

    // Mettre en cache
    weatherCache = result;
    cacheTimestamp = now;

    console.log(`☁️ [OpenWeather] ${result.city}: ${result.temperature}°C (${result.description})`);
    return result;
  } catch (error) {
    console.error("❌ [OpenWeather] Erreur:", error.message);
    throw error;
  }
}

/**
 * Récupère les prévisions 5 jours
 * 
 * @param {string} city - Nom de la ville
 * @returns {Promise<Array>} Prévisions par tranches de 3h
 */
export async function getForecast(city = "Istres,FR") {
  const API_KEY = process.env.OPENWEATHER_API_KEY;
  if (!API_KEY) {
    throw new Error("OPENWEATHER_API_KEY manquante dans .env");
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=fr`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Formater les prévisions
    const forecast = data.list.map(item => ({
      timestamp: item.dt * 1000,
      temperature: Math.round(item.main.temp),
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      humidity: item.main.humidity,
      windSpeed: item.wind.speed,
    }));

    console.log(`☁️ [OpenWeather] Prévisions ${city}: ${forecast.length} entrées`);
    return forecast;
  } catch (error) {
    console.error("❌ [OpenWeather] Erreur prévisions:", error.message);
    throw error;
  }
}
