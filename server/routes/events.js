import express from "express";

const router = express.Router();
let clients = [];

/**
 * Endpoint SSE principal: /api/events
 */
router.get("/", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Envoi d'un message initial (ping)
  res.write(
    'data: {"type": "CONNECTED", "message": "SSE connection established"}\n\n',
  );

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
  };
  clients.push(newClient);
  console.log(`[SSE] Client connecté : ${clientId} (${clients.length} total)`);

  req.on("close", () => {
    console.log(`[SSE] Client déconnecté : ${clientId}`);
    clients = clients.filter((client) => client.id !== clientId);
  });
});

/**
 * Fonction interne pour broadcast à tous les clients
 * @param {string} type - "PRINTER", "SYSTEM", "HOME"
 * @param {object} payload - Données brutes (optionnel)
 * @param {string} messageToSpeak - Message vocal que Jarvis doit lire (optionnel mais prioritaire si présent)
 */
export function broadcastEvent(type, payload = {}, messageToSpeak = null) {
  const dataString = JSON.stringify({ type, payload, messageToSpeak });
  clients.forEach((client) => {
    try {
      client.res.write(`data: ${dataString}\n\n`);
    } catch (e) {
      console.error("[SSE] Erreur envoi client:", e);
    }
  });
}

export default router;
