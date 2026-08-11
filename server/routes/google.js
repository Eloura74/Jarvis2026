import express from "express";
import * as googleService from "../googleService.js";

const router = express.Router();

/**
 * POST /api/google/config
 * Configure les Client ID et Secret
 */
router.post("/config", async (req, res) => {
  try {
    const { client_id, client_secret, redirect_uri } = req.body;
    if (!client_id || !client_secret || !redirect_uri) {
      return res.status(400).json({ error: "Config incomplète" });
    }
    await googleService.saveCredentials({
      client_id,
      client_secret,
      redirect_uri,
    });
    res.json({ success: true, message: "Configuration Google sauvegardée" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/google/status
 * Vérifie si Google est configuré et renvoie l'URL d'auth
 */
router.get("/status", async (req, res) => {
  try {
    const url = await googleService.getAuthUrl();
    res.json({ configured: true, authUrl: url });
  } catch (error) {
    res.json({ configured: false, authUrl: null });
  }
});

/**
 * GET /api/google/auth-url
 * Récupère l'URL d'auth Google (redirection directe)
 */
router.get("/auth-url", async (req, res) => {
  try {
    const url = await googleService.getAuthUrl();
    res.redirect(url);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/google/callback
 * Reçoit le code de Google et redirige vers le frontend
 */
router.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("Code manquant");

    await googleService.setTokenFromCode(code);

    // Redirige vers le frontend (port 3000)
    res.send(`
      <div style="background: #0f172a; color: #22d3ee; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif;">
        <h1 style="border: 1px solid #22d3ee; padding: 20px; border-radius: 10px; box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);">
          Authentification Réussie
        </h1>
        <p style="margin-top: 20px; opacity: 0.8;">J.A.R.V.I.S. dispose désormais des accès CRUD pour votre calendrier.</p>
        <script>
          setTimeout(() => {
            window.location.href = 'http://localhost:5173';
          }, 2000);
        </script>
      </div>
    `);
  } catch (error) {
    console.error("❌ [Google OAuth] Erreur détaillée:", {
      message: error.message,
      response: error.response?.data,
      code: error.code,
    });
    const details = error.response?.data
      ? JSON.stringify(error.response.data)
      : "";
    res
      .status(500)
      .send(
        "Erreur d'authentification : " +
          error.message +
          "<br><pre>" +
          details +
          "</pre>",
      );
  }
});

/**
 * GET /api/google/gmail/list
 */
router.get("/gmail/list", async (req, res) => {
  try {
    const { max, q } = req.query;
    const emails = await googleService.listEmails(max || 5, q || "");
    res.json({ emails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/gmail/send
 */
router.post("/gmail/send", async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const result = await googleService.sendEmail(to, subject, body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/google/calendar/events
 */
router.get("/calendar/events", async (req, res) => {
  try {
    const events = await googleService.listEvents(req.query.max || 10);
    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/calendar/events
 * Crée un événement
 */
router.post("/calendar/events", async (req, res) => {
  try {
    const event = await googleService.createEvent(req.body);
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/google/calendar/events/:id
 * Supprime un événement
 */
router.delete("/calendar/events/:id", async (req, res) => {
  try {
    const result = await googleService.deleteEvent(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/google/calendar/events/:id
 * Met à jour un événement
 */
router.put("/calendar/events/:id", async (req, res) => {
  try {
    const event = await googleService.updateEvent(req.params.id, req.body);
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/google/distancematrix
 * Proxy pour Google Maps Distance Matrix API
 */
router.get("/distancematrix", async (req, res) => {
  try {
    const { origins, destinations, departure_time, mode, language } = req.query;

    // Récupérer la clé API depuis process.env (chargé par dotenv dans server.js)
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error("❌ Erreur Proxy: VITE_GOOGLE_MAPS_API_KEY manquante");
      return res.status(500).json({
        status: "ERROR",
        error_message: "Configuration serveur incomplète (clé API manquante)",
      });
    }

    const url = new URL(
      "https://maps.googleapis.com/maps/api/distancematrix/json",
    );
    // Construct URL parameters manually to avoid double encoding issues or missing params
    const params = new URLSearchParams();
    params.append("origins", origins || "");
    params.append("destinations", destinations || "");
    params.append("key", apiKey);
    if (departure_time) params.append("departure_time", departure_time);
    if (mode) params.append("mode", mode);
    if (language) params.append("language", language);

    const finalUrl = `${url.toString()}?${params.toString()}`;
    console.log(
      `📡 Google Proxy calling: ${finalUrl.replace(apiKey, "HIDDEN_KEY")}`,
    );

    const response = await fetch(finalUrl);
    const data = await response.json();

    // Log pour debug
    if (data.status !== "OK") {
      console.warn("⚠️ Google API returned non-OK status:", data);
    }

    res.json(data);
  } catch (error) {
    console.error("❌ Erreur Proxy Google Maps:", error);
    res.status(500).json({ status: "ERROR", error_message: error.message });
  }
});

export default router;
