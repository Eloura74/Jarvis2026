/**
 * Routes pour Google Maps
 * - Directions (temps trajet avec trafic)
 * - Geocoding (adresse → coordonnées)
 */

import express from "express";
import { getDirections } from "../services/googleMapsService.js";
import { searchLimiter } from "../middleware/index.js";

const router = express.Router();

/**
 * GET /api/maps/directions
 * Calcule temps de trajet entre deux adresses avec trafic en temps réel
 *
 * Query params:
 * - origin: Adresse de départ (ex: "Le Luc en Provence, France")
 * - destination: Adresse d'arrivée (ex: "Marseille, France")
 * - mode: Mode de transport (driving, walking, bicycling, transit) - défaut: driving
 */
router.get("/directions", searchLimiter, async (req, res) => {
  try {
    const { origin, destination, mode = "driving" } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        error: "Paramètres 'origin' et 'destination' requis",
      });
    }

    const directions = await getDirections(origin, destination, mode);
    res.json({ success: true, directions });
  } catch (error) {
    console.error("❌ Erreur Google Maps Directions:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
