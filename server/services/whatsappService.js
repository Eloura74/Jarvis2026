/**
 * Service pour la gestion de WhatsApp Web (via whatsapp-web.js)
 */
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";
import { broadcastEvent } from "../routes/events.js";
import { setSphereState, setSphereText } from "./sphereService.js";

let client = null;
let isConnected = false;
let qrCodeData = null; // Stocke le dernier QR code généré

/**
 * Initialise le client WhatsApp
 */
export function initWhatsAppService() {
  console.log("🟢 [WHATSAPP] Initialisation du service...");

  client = new Client({
    // LocalAuth permet de sauvegarder la session (les cookies de WhatsApp Web) localement
    // dans un dossier .wwebjs_auth à la racine du projet (ou du dossier d'exécution)
    authStrategy: new LocalAuth({
      dataPath: "./.wwebjs_auth",
    }),
    puppeteer: {
      // Configuration pour éviter des problèmes de lancement sous certains OS
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      // headless: true, // true par défaut
    },
  });

  client.on("qr", (qr) => {
    // Émis quand WhatsApp a besoin d'être authentifié (scan QR code)
    console.log(
      "📱 [WHATSAPP] QR Code reçu. Veuillez le scanner avec votre application WhatsApp :",
    );
    qrcode.generate(qr, { small: true });
    qrCodeData = qr; // Sauver pour pouvoir l'exposer via une API si besoin
    broadcastEvent("WHATSAPP_STATUS", { status: "AWAITING_QR", qr: qr });
  });

  client.on("ready", () => {
    // Émis quand le client est connecté et prêt
    console.log("✅ [WHATSAPP] Client prêt et connecté !");
    isConnected = true;
    qrCodeData = null;
    broadcastEvent("WHATSAPP_STATUS", { status: "CONNECTED" });
  });

  client.on("authenticated", () => {
    console.log("🔐 [WHATSAPP] Authentification réussie.");
    qrCodeData = null;
  });

  client.on("auth_failure", (msg) => {
    console.error("❌ [WHATSAPP] Échec de l'authentification :", msg);
    isConnected = false;
    broadcastEvent("WHATSAPP_STATUS", { status: "AUTH_FAILURE", error: msg });
  });

  client.on("disconnected", (reason) => {
    console.log("🛑 [WHATSAPP] Client déconnecté :", reason);
    isConnected = false;
    broadcastEvent("WHATSAPP_STATUS", { status: "DISCONNECTED", reason });

    // Tenter de se reconnecter après un délai ?
    // setTimeout(() => initWhatsAppService(), 5000)
  });

  client.on("message", async (msg) => {
    try {
      // Filtrer les messages (on ne veut généralement pas réagir aux messages qu'on envoie nous-même)
      // Ni aux status updates etc.
      if (msg.from === "status@broadcast" || msg.isStatus) return;

      const contact = await msg.getContact();
      const senderName =
        contact.name ||
        contact.pushname ||
        msg.from.split("@")[0] ||
        "un contact inconnu";

      console.log(`💬 [WHATSAPP] Reçu message de ${senderName}`);

      // Envoi de l'évènement via SSE à Jarvis
      // On passe messageToSpeak pour que Jarvis l'annonce
      const messageToSpeak = `Nouveau message WhatsApp de ${senderName}.`;

      // 1. Déclenche le mode Visuel sur la sphère ESP32
      setSphereState("WHATSAPP");
      setSphereText(senderName);

      // La sphère va rester en mode WHATSAPP jusqu'à ce que le state "IDLE" l'écrase
      // Le hook useVoiceSynthesis (rawSpeak) redéclanchera "SPEAKING", puis "IDLE" ou "LISTENING"
      // Ce qui fait que le mode WHATSAPP sera visible juste avant que Jarvis ne parle.

      // 2. Transmet à Jarvis (Frontend)
      broadcastEvent(
        "WHATSAPP",
        {
          sender: senderName,
          from: msg.from,
          body: msg.body, // Ajout du contenu du message
          hasMedia: msg.hasMedia,
        },
        messageToSpeak,
      );
    } catch (err) {
      console.error(
        "❌ [WHATSAPP] Erreur lors du traitement du message :",
        err,
      );
    }
  });

  client.initialize().catch((err) => {
    console.error("❌ [WHATSAPP] Erreur fatale à l'initialisation :", err);
  });
}

export function getWhatsAppStatus() {
  return {
    isConnected,
    hasQrCode: !!qrCodeData,
    qr: qrCodeData,
  };
}
