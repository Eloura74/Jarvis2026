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
 * GET /api/google/auth-url
 * Récupère l'URL d'auth Google
 */
router.get("/auth-url", async (req, res) => {
  try {
    const url = await googleService.getAuthUrl();
    res.json({ url });
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

    // Redirige vers le frontend (on suppose localhost:5173 pour Vite)
    res.send(`
      <div style="background: #0f172a; color: #22d3ee; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif;">
        <h1 style="border: 1px solid #22d3ee; padding: 20px; border-radius: 10px; box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);">
          Authentification Réussie
        </h1>
        <p style="margin-top: 20px; opacity: 0.8;">Vous pouvez fermer cette fenêtre, J.A.R.V.I.S. est prêt.</p>
        <script>
          setTimeout(() => {
            window.location.href = 'http://localhost:5173';
          }, 2000);
        </script>
      </div>
    `);
  } catch (error) {
    res.status(500).send("Erreur d'authentification : " + error.message);
  }
});

/**
 * GET /api/google/gmail/list
 * Liste les derniers mails
 */
router.get("/gmail/list", async (req, res) => {
  try {
    const emails = await googleService.listEmails(req.query.max || 5);
    res.json({ emails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/gmail/send
 * Envoie un mail
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
 * Liste calendrier
 */
router.get("/calendar/events", async (req, res) => {
  try {
    const events = await googleService.listEvents(req.query.max || 10);
    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
