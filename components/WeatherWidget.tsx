/**
 * WeatherWidget - Widget météo dynamique avec API OpenWeatherMap
 * 
 * Affiche les conditions météorologiques en temps réel :
 * - Température actuelle
 * - Conditions (ensoleillé, nuageux, etc.)
 * - Vitesse du vent
 * - Probabilité de précipitations
 * - Localisation automatique
 */

import React, { useState, useEffect } from "react";
import { CloudRain, Sun, Wind, Cloud, Droplets, Loader, MapPin } from "lucide-react";
import { getCurrentWeather, getWeatherByCity, WeatherData } from "../services/weatherService";

export const WeatherWidget: React.FC = () => {
  // État local pour les données météo
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupère les données météo au montage du composant
   * et les rafraîchit toutes les 10 minutes
   * 
   * Stratégie de fallback :
   * 1. Essayer géolocalisation
   * 2. Si refusée → utiliser ville par défaut depuis .env
   * 3. Si pas de ville → Paris par défaut
   */
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Tentative de géolocalisation
        const data = await getCurrentWeather();
        setWeather(data);
      } catch (err) {
        // Géolocalisation refusée ou indisponible - utiliser ville par défaut (pas d'erreur à logger)
        const defaultCity = import.meta.env.VITE_DEFAULT_WEATHER_CITY || "Paris";
        
        try {
          const data = await getWeatherByCity(defaultCity);
          setWeather(data);
          setError(null); // Pas d'erreur si fallback réussi
        } catch (fallbackErr) {
          // Erreur API uniquement (clé invalide ou ville introuvable)
          setError(fallbackErr instanceof Error ? fallbackErr.message : "Météo indisponible");
        } finally {
          setLoading(false);
        }
        return; // Sortir pour éviter double setLoading(false)
      } finally {
        setLoading(false);
      }
    };

    // Récupération initiale
    fetchWeather();

    // Rafraîchissement automatique toutes les 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Sélectionne l'icône appropriée selon les conditions météo
   */
  const getWeatherIcon = () => {
    if (!weather) return <Sun size={32} />;

    const condition = weather.condition.toLowerCase();
    
    if (condition.includes("ensoleillé") || condition.includes("clear")) {
      return <Sun size={32} />;
    } else if (condition.includes("nuageux") || condition.includes("cloud")) {
      return <Cloud size={32} />;
    } else if (condition.includes("pluie") || condition.includes("rain")) {
      return <CloudRain size={32} />;
    } else if (condition.includes("brume") || condition.includes("mist")) {
      return <Droplets size={32} />;
    }
    
    return <Sun size={32} />;
  };

  // ========================================
  // ÉTAT DE CHARGEMENT
  // ========================================
  if (loading) {
    return (
      <div className="w-full relative overflow-hidden rounded-xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl p-4 flex items-center justify-center group hover:border-cyan-400/50 transition-colors shadow-[0_0_15px_rgba(0,229,255,0.1)]">
        <div className="flex items-center gap-2 text-cyan-400/70">
          <Loader size={20} className="animate-spin" />
          <span className="text-xs tracking-wider">Chargement météo...</span>
        </div>
      </div>
    );
  }

  // ========================================
  // ÉTAT D'ERREUR
  // ========================================
  if (error) {
    return (
      <div className="w-full relative overflow-hidden rounded-xl border border-red-400/30 bg-black/20 backdrop-blur-xl p-4 group hover:border-red-400/50 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.1)]">
        <div className="flex items-center gap-3">
          <div className="text-red-400">
            <CloudRain size={32} />
          </div>
          <div>
            <div className="text-sm font-light text-red-300">Météo indisponible</div>
            <div className="text-[9px] text-red-400/70 tracking-wider mt-0.5">
              {error.includes("Clé API") ? "Config API manquante" : "Géolocalisation refusée"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // AFFICHAGE DES DONNÉES MÉTÉO
  // ========================================
  if (!weather) return null;

  return (
    <div className="w-full relative overflow-hidden rounded-xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl p-4 flex items-center justify-between group hover:border-cyan-400/50 transition-colors shadow-[0_0_15px_rgba(0,229,255,0.1)]">
      <div className="flex items-center gap-4">
        {/* Icône météo dynamique */}
        <div className="text-cyan-400 filter drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
          {getWeatherIcon()}
        </div>

        <div>
          {/* Température */}
          <div className="text-2xl font-light text-white tracking-tighter">
            {weather.temperature}°
          </div>
          
          {/* Conditions et ville */}
          <div className="text-[10px] text-cyan-400 tracking-widest uppercase opacity-80 flex items-center gap-1">
            <span>{weather.condition}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5">
              <MapPin size={8} />
              {weather.city}
            </span>
          </div>
        </div>
      </div>

      {/* Détails supplémentaires (vent et précipitations) */}
      <div className="flex flex-col gap-2 text-[10px] text-cyan-500/70 text-right">
        {/* Vitesse du vent */}
        <div className="flex items-center justify-end gap-1" title="Vitesse du vent">
          <Wind size={10} />
          <span>{weather.windSpeed} km/h</span>
        </div>
        
        {/* Probabilité de précipitations */}
        <div className="flex items-center justify-end gap-1" title="Humidité">
          <Droplets size={10} />
          <span>{weather.humidity}%</span>
        </div>
      </div>
    </div>
  );
};
