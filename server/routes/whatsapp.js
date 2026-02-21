import express from "express";
import {
  getWhatsAppStatus,
  sendWhatsAppMessage,
  searchContacts,
  saveAlias,
} from "../services/whatsappService.js";

const router = express.Router();

/**
 * GET /api/whatsapp/status
 * Récupère l'état actuel de la connexion WhatsApp et potentiellement le QR code.
 */
router.get("/status", (req, res) => {
  const statusInfo = getWhatsAppStatus();
  res.json(statusInfo);
});

/**
 * POST /api/whatsapp/send
 * Envoie un message WhatsApp à un contact.
 * Body: { to: "33612345678@c.us" | "Prénom", message: "Texte du message" }
 */
router.post("/send", async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res
        .status(400)
        .json({ error: "Paramètres manquants : 'to' et 'message' requis." });
    }
    const result = await sendWhatsAppMessage(to, message);
    res.json(result);
  } catch (error) {
    console.error("[API] Erreur envoi WhatsApp:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/whatsapp/contacts?q=jeremy
 * Recherche des contacts WhatsApp par nom (pour debug et configuration des alias)
 */
router.get("/contacts", async (req, res) => {
  try {
    const query = req.query.q || "";
    const results = await searchContacts(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/whatsapp/alias
 * Sauvegarde un alias vocal → nom exact du contact
 * Body: { alias: "jérémy afpa", contactName: "Jérémy Dupont" }
 */
router.post("/alias", async (req, res) => {
  try {
    const { alias, contactName } = req.body;
    if (!alias || !contactName) {
      return res.status(400).json({ error: "alias et contactName requis" });
    }
    await saveAlias(alias, contactName);
    res.json({
      success: true,
      message: `Alias "${alias}" → "${contactName}" sauvegardé.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
