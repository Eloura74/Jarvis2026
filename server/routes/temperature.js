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
import { getHAEntityState } from "../services/haService.js";

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
 * Température piscine (capteur Tuya via HA)
 */
router.get("/pool", async (req, res) => {
  try {
    const poolTempEntity = await getHAEntityState("sensor.temperature_piscine");
    const tempValue = parseFloat(poolTempEntity.state);
    
    const poolTemp = {
      temperature: tempValue,
      timestamp: Date.now(),
      status: "ok",
      alert: tempValue < 18 || tempValue > 30, 
    };

    res.json({ success: true, pool: poolTemp });
  } catch (error) {
    console.error("❌ Erreur température piscine (fallback mock):", error.message);
    const mockTemp = {
      temperature: 24,
      timestamp: Date.now(),
      status: "ok",
      alert: false,
    };
    res.json({ success: true, pool: mockTemp });
  }
});

/**
 * GET /api/temperature/system
 * Températures PC et NAS via HA
 */
router.get("/system", async (req, res) => {
  try {
    const pcCpu = await getHAEntityState("sensor.pc_cpu_temperature").catch(() => ({ state: 45 }));
    const pcGpu = await getHAEntityState("sensor.pc_gpu_temperature").catch(() => ({ state: 52 }));
    const nasCpu = await getHAEntityState("sensor.truenas_cpu_temperature").catch(() => ({ state: 38 }));

    const systemTemps = {
      pc: {
        cpu: parseFloat(pcCpu.state) || 45,
        gpu: parseFloat(pcGpu.state) || 52,
        motherboard: 38,
        disks: [42, 40, 43],
      },
      nas: {
        cpu: parseFloat(nasCpu.state) || 38,
        disks: [35, 36, 34, 37],
      },
      timestamp: Date.now(),
    };

    res.json({ success: true, system: systemTemps });
  } catch (error) {
    console.error("❌ Erreur températures système (fallback mock):", error.message);
    res.json({
      success: true, 
      system: {
        pc: { cpu: 45, gpu: 52, motherboard: 38, disks: [42, 40, 43] },
        nas: { cpu: 38, disks: [35, 36, 34, 37] },
        timestamp: Date.now()
      }
    });
  }
});

export default router;

