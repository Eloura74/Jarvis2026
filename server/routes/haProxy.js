import express from "express";
import fetch from "node-fetch";

const router = express.Router();

/**
 * Middleware Proxy HA avec Fallback Silencieux
 * Évite d'envoyer des erreurs HTTP 500 au navigateur quand Home Assistant n'est pas connecté.
 */

// GET /api/states — État des entités Home Assistant
router.get("/states", async (req, res) => {
  const HA_BASE_URL = process.env.HA_BASE_URL || process.env.VITE_HA_BASE_URL || "http://192.168.1.193:8123";
  const HA_TOKEN = process.env.HA_TOKEN || process.env.VITE_HA_TOKEN;

  if (!HA_TOKEN) {
    return res.json([]);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // Timeout 2s max

    const response = await fetch(`${HA_BASE_URL}/api/states`, {
      headers: {
        "Authorization": `Bearer ${HA_TOKEN}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.json([]);
    }

    const data = await response.json();
    res.json(data);
  } catch {
    // HA non joignable ou déconnecté : retourner un tableau vide sans erreur HTTP
    res.json([]);
  }
});

// POST /api/services/:domain/:service — Appel de service HA (ex: light.turn_off)
router.post("/services/:domain/:service", async (req, res) => {
  const { domain, service } = req.params;
  const HA_BASE_URL = process.env.HA_BASE_URL || process.env.VITE_HA_BASE_URL || "http://192.168.1.193:8123";
  const HA_TOKEN = process.env.HA_TOKEN || process.env.VITE_HA_TOKEN;

  if (!HA_TOKEN) {
    return res.json({ success: false, message: "HA Token non configuré" });
  }

  try {
    const response = await fetch(`${HA_BASE_URL}/api/services/${domain}/${service}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HA_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      return res.json({ success: false, message: `HA status ${response.status}` });
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, message: "HA hors ligne" });
  }
});

// GET /api/camera_proxy_stream/* — Streams caméra HA avec fallback
router.get("/camera_proxy_stream/*", (req, res) => {
  // Réponse neutre No Content (204) si HA caméra est déconnecté
  res.status(204).end();
});

export default router;
