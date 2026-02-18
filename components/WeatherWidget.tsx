/**
 * WeatherWidget - Widget météo dynamique avec API OpenWeatherMap
 *
 * Affiche les conditions météorologiques en temps réel :
 * - Température actuelle
 * - Conditions (ensoleillé, nuageux, etc.)
 * - Vitesse du vent
 * - Probabilité de précipitations
 * - Localisation automatique
 * - Fonds dynamiques réalistes (Images Unsplash) avec mode Nuit
 */

import React, { useState, useEffect } from "react";
import {
  CloudRain,
  Sun,
  Wind,
  Cloud,
  Droplets,
  Loader,
  MapPin,
  Zap,
  CloudSnow,
  Moon,
} from "lucide-react";
import {
  getCurrentWeather,
  getWeatherByCity,
  WeatherData,
} from "../services/weatherService";
import { motion } from "framer-motion";

export const WeatherWidget: React.FC = () => {
  // État local pour les données météo
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNight, setIsNight] = useState(false);

  /**
   * Calcul si c'est la nuit
   */
  useEffect(() => {
    const checkNight = () => {
      const hour = new Date().getHours();
      setIsNight(hour >= 20 || hour < 6); // Nuit entre 20h et 6h
    };
    checkNight();
    const timer = setInterval(checkNight, 60000); // Check every minute
    return () => clearInterval(timer);
  }, []);

  /**
   * Récupère les données météo au montage du composant
   * et les rafraîchit toutes les 10 minutes
   */
  useEffect(() => {
    const fetchWeather = async (useGps: boolean = false) => {
      try {
        setLoading(true);
        setError(null);

        let data: WeatherData;
        if (useGps) {
          data = await getCurrentWeather();
        } else {
          const defaultCity =
            import.meta.env.VITE_DEFAULT_WEATHER_CITY || "Paris";
          data = await getWeatherByCity(defaultCity);
        }
        setWeather(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Météo indisponible");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather(false); // Démarrage sans GPS pour éviter la violation
    const interval = setInterval(() => fetchWeather(false), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Sélectionne l'icône appropriée selon les conditions météo
   */
  const getWeatherIcon = () => {
    if (!weather) return <Sun size={32} />;

    const condition = weather.condition.toLowerCase();

    // Priorité à l'orage et conditions extrêmes
    if (condition.includes("orage") || condition.includes("thunder")) {
      return <Zap size={32} className="text-yellow-400 animate-pulse" />;
    } else if (condition.includes("pluie") || condition.includes("rain")) {
      return <CloudRain size={32} className="text-blue-400" />;
    } else if (condition.includes("neige") || condition.includes("snow")) {
      return <CloudSnow size={32} className="text-white" />;
    } else if (condition.includes("nuage") || condition.includes("cloud")) {
      return <Cloud size={32} className="text-gray-300" />;
    } else if (
      condition.includes("brume") ||
      condition.includes("mist") ||
      condition.includes("fog")
    ) {
      return <Droplets size={32} className="text-gray-400" />;
    }

    // Gestion Jour / Nuit pour le ciel clair
    if (isNight) {
      return <Moon size={32} className="text-indigo-200" />;
    }

    return (
      <Sun
        size={32}
        className="text-yellow-500 animate-[spin_10s_linear_infinite]"
      />
    );
  };

  /**
   * Retourne l'URL de l'image de fond locale (générée par IA)
   * Garantit une stabilité et un design premium JARVIS.
   * Ajout logique Nuit.
   */
  const getBackgroundImage = () => {
    // Si Nuit, on force une variante sombre ou une image spécifique nuit si dispo
    // Pour l'instant on utilise "clouds" assombri par CSS ou une image spécifique si on en avait
    // On va jouer avec l'opacité et le background noir pour simuler la nuit sur les mêmes assets

    if (!weather) return "/weather/clear.png";

    const condition = weather.condition.toLowerCase();

    // TODO: Avoir des assets spécifiques *_night.png idéalement
    // Ici on mappe sur les existants

    if (condition.includes("orage") || condition.includes("thunder")) {
      return "/weather/clouds.png";
    }
    if (condition.includes("pluie") || condition.includes("rain")) {
      return "/weather/rain.png";
    }
    if (condition.includes("neige") || condition.includes("snow")) {
      return "/weather/clouds.png";
    }
    if (condition.includes("nuage") || condition.includes("cloud")) {
      return "/weather/clouds.png";
    }
    if (condition.includes("brume") || condition.includes("mist")) {
      return "/weather/clouds.png";
    }

    // Ciel clair
    return "/weather/clear.png";
  };

  // ========================================
  // ÉTAT DE CHARGEMENT
  // ========================================
  if (loading) {
    return (
      <div className="w-full relative overflow-hidden rounded-xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl p-4 flex items-center justify-center group hover:border-cyan-400/50 transition-colors shadow-[0_0_15px_rgba(0,229,255,0.1)] h-full min-h-[100px]">
        <div className="flex items-center gap-2 text-cyan-400/70">
          <Loader size={20} className="animate-spin" />
          <span className="text-xs tracking-wider">
            ACQUIRING ATMOSPHERE DATA...
          </span>
        </div>
      </div>
    );
  }

  // ========================================
  // ÉTAT D'ERREUR
  // ========================================
  if (error) {
    return (
      <div className="w-full relative overflow-hidden rounded-xl border border-red-400/30 bg-black/20 backdrop-blur-xl p-4 group hover:border-red-400/50 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.1)] h-full min-h-[100px]">
        <div className="flex items-center gap-3">
          <div className="text-red-400">
            <CloudRain size={24} />
          </div>
          <div>
            <div className="text-xs font-light text-red-300">METEO OFFLINE</div>
          </div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <motion.div
      className="w-full relative overflow-hidden rounded-xl border border-cyan-400/30 backdrop-blur-xl p-4 flex items-center justify-between group hover:border-cyan-400/50 transition-all duration-500 shadow-[0_0_15px_rgba(0,229,255,0.1)] h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* IMAGE DE FOND AVEC OVERLAY */}
      <div className="absolute inset-0 z-0">
        <img
          src={getBackgroundImage()}
          alt="Météo Background"
          className={`w-full h-full object-cover transition-all duration-700 ${isNight ? "opacity-30 grayscale-[50%]" : "opacity-80"}`}
        />
        {/* Gradient pour lisibilité texte + Simulation Nuit */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${isNight ? "from-black via-slate-900/80 to-indigo-900/40" : "from-black/80 via-black/50 to-transparent"}`}
        />
      </div>

      {/* CONTENU */}
      <div className="flex items-center gap-4 relative z-10 pl-2">
        {/* Icône météo dynamique */}
        <div className="text-cyan-400 filter drop-shadow-[0_0_8px_rgba(0,229,255,0.4)] transform group-hover:scale-110 transition-transform duration-500">
          {getWeatherIcon()}
        </div>

        <div>
          {/* Température */}
          <div className="text-3xl font-light text-white tracking-tighter drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
            {weather.temperature}°C
          </div>

          {/* Conditions et ville */}
          <div className="text-[10px] text-cyan-300 tracking-widest uppercase opacity-90 flex flex-col gap-0.5 mt-1 drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]">
            <span className="font-bold flex items-center gap-1">
              {weather.condition}
            </span>
            <span className="flex items-center gap-1 text-cyan-200/80">
              <MapPin size={8} />
              {weather.city.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Détails supplémentaires (vent et précipitations) */}
      <div className="flex flex-col gap-3 text-[16px] text-cyan-100 text-center relative z-10 border-l border-cyan-500/30 pl-3 bg-black/30 p-2 rounded-l-lg backdrop-blur-sm">
        {/* Vitesse du vent */}
        <div
          className="flex items-center justify-center gap-1.5 group/wind"
          title="Vitesse du vent"
        >
          <span className="opacity-0 group-hover/wind:opacity-100 transition-opacity text-[8px] text-cyan-300">
            WIND
          </span>
          <Wind
            size={12}
            className="text-cyan-400 block group-hover/wind:animate-pulse"
          />
          <span className="font-mono">
            {weather.windSpeed}{" "}
            <span className="text-[8px] text-cyan-400">km/h</span>
          </span>
        </div>

        {/* Humidité */}
        <div
          className="flex items-center justify-center gap-1.5 group/humidity"
          title="Humidité"
        >
          <span className="opacity-0 group-hover/humidity:opacity-100 transition-opacity text-[8px] text-cyan-300">
            HUM
          </span>
          <Droplets size={12} className="text-cyan-400 block" />
          <span className="font-mono">
            {weather.humidity}
            <span className="text-[8px] text-cyan-400">%</span>
          </span>
        </div>
      </div>

      {/* Decoratives lines */}
      <div className="absolute bottom-0 right-0 w-16 h-[1px] bg-gradient-to-l from-cyan-400/80 to-transparent z-20" />
      <div className="absolute top-0 left-0 w-16 h-[1px] bg-gradient-to-r from-cyan-400/80 to-transparent z-20" />
    </motion.div>
  );
};
