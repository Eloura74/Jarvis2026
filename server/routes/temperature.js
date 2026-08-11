/**
 * Routes pour monitoring températures
 * - Température extérieure (OpenWeatherMap)
 * - Température piscine (capteur Tuya)
 * - Températures système (PC/NAS)
 */

import express from "express";
import {
  getCurrentWeather,
  getForecast,
} from "../services/openWeatherService.js";
import { searchLimiter } from "../middleware/index.js";

const router = express.Router();

/**
 * GET /api/temperature/outdoor
 * Température extérieure via OpenWeatherMap
 */
router.get("/outdoor", searchLimiter, async (req, res) => {
  try {
    const city = req.query.city || "Le Luc en Provence,FR";
    const weather = await getCurrentWeather(city);
    res.json({ success: true, weather });
  } catch (error) {
    console.error("❌ Erreur température extérieure:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/temperature/forecast
 * Prévisions météo 5 jours
 */
router.get("/forecast", searchLimiter, async (req, res) => {
  try {
    const city = req.query.city || "Le Luc en Provence,FR";
    const forecast = await getForecast(city);
    res.json({ success: true, forecast });
  } catch (error) {
    console.error("❌ Erreur prévisions météo:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/temperature/pool
 * Température piscine (capteur Tuya)
 * TODO: Intégrer API Tuya pour capteur température
 */
router.get("/pool", async (req, res) => {
  try {
    // TODO: Appel API Tuya pour récupérer température capteur piscine
    // Pour l'instant, retourner mock data
    const poolTemp = {
      temperature: 24,
      timestamp: Date.now(),
      status: "ok",
      alert: false, // true si <18°C ou >30°C
    };

    res.json({ success: true, pool: poolTemp });
  } catch (error) {
    console.error("❌ Erreur température piscine:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/temperature/system
 * Températures PC et NAS
 * TODO: Intégrer Open Hardware Monitor + TrueNAS API
 */
router.get("/system", async (req, res) => {
  try {
    // TODO: Appel Open Hardware Monitor pour PC
    // TODO: Appel TrueNAS API pour NAS
    // Pour l'instant, retourner mock data
    const systemTemps = {
      pc: {
        cpu: 45,
        gpu: 52,
        motherboard: 38,
        disks: [42, 40, 43],
      },
      nas: {
        cpu: 38,
        disks: [35, 36, 34, 37],
      },
      timestamp: Date.now(),
    };

    res.json({ success: true, system: systemTemps });
  } catch (error) {
    console.error("❌ Erreur températures système:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
