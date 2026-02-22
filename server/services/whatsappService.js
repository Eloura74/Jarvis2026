/**
 * Service pour la gestion de WhatsApp Web (via whatsapp-web.js)
 */
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";
import { broadcastEvent } from "../routes/events.js";
import { setSphereState, setSphereText } from "./sphereService.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Charge les alias WhatsApp depuis user-settings.json.
 * Retourne un objet { "nom vocal lowercase": "nom exact contact" }
 */
function loadWhatsAppAliases() {
  try {
    const settingsPath = join(__dirname, "../config/user-settings.json");
    const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    return settings.whatsappAliases || {};
  } catch {
    return {};
  }
}

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

  client.on("ready", async () => {
    // Émis quand le client est connecté et prêt
    console.log("✅ [WHATSAPP] Client prêt et connecté !");
    isConnected = true;
    qrCodeData = null;
    broadcastEvent("WHATSAPP_STATUS", { status: "CONNECTED" });

    // Afficher un résumé des alias configurés (sans spam de contacts)
    try {
      const aliases = loadWhatsAppAliases();
      const aliasKeys = Object.keys(aliases);
      if (aliasKeys.length > 0) {
        console.log(`📋 [WHATSAPP] ${aliasKeys.length} alias configuré(s).`);
      }
    } catch {
      // Non bloquant
    }
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

/**
 * Envoie un message WhatsApp à un contact.
 * @param {string} to - Numéro au format "33612345678@c.us" ou nom du contact
 * @param {string} message - Texte du message à envoyer
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendWhatsAppMessage(to, message) {
  if (!client || !isConnected) {
    throw new Error(
      "WhatsApp non connecté. Veuillez scanner le QR code d'abord.",
    );
  }

  try {
    // Normaliser le numéro : si c'est déjà au format WhatsApp, l'utiliser tel quel
    // Sinon, chercher le contact par nom
    let chatId = to;

    if (!to.includes("@")) {
      const contacts = await client.getContacts();
      const toLower = to.toLowerCase().trim();

      // 0. Résolution via alias configurés dans user-settings.json — priorité absolue
      // La valeur peut être :
      //   - Un ID WhatsApp direct : "336XXXXXXXX@c.us" → utilisé tel quel (aucune ambiguïté)
      //   - Un nom exact de contact : "Jérémy Cailleux" → recherche exacte dans les contacts
      const aliases = loadWhatsAppAliases();
      const aliasResolved = aliases[toLower];
      if (aliasResolved) {
        // Cas 1 : l'alias pointe directement vers un ID WhatsApp
        if (aliasResolved.includes("@")) {
          console.log(
            `🎯 [WHATSAPP] Alias ID direct : "${to}" → ${aliasResolved}`,
          );
          await client.sendMessage(aliasResolved, message);
          console.log(
            `✅ [WHATSAPP] Message envoyé via alias ID: "${message}"`,
          );
          return { success: true, message: `Message envoyé à ${to}.` };
        }

        // Cas 2 : l'alias pointe vers un nom exact de contact
        const aliasLower = aliasResolved.toLowerCase();
        const aliasFound = contacts.find(
          (c) =>
            c.name?.toLowerCase() === aliasLower ||
            c.pushname?.toLowerCase() === aliasLower,
        );
        if (aliasFound) {
          console.log(
            `🎯 [WHATSAPP] Alias nom : "${to}" → "${aliasResolved}" → contact "${aliasFound.name || aliasFound.pushname}"`,
          );
          await client.sendMessage(aliasFound.id._serialized, message);
          console.log(
            `✅ [WHATSAPP] Message envoyé à ${aliasResolved}: "${message}"`,
          );
          return {
            success: true,
            message: `Message envoyé à ${aliasResolved}.`,
          };
        }
        console.warn(
          `⚠️ [WHATSAPP] Alias "${to}" → "${aliasResolved}" : contact introuvable, recherche normale...`,
        );
      }

      // 1. Correspondance exacte (nom complet)
      let found = contacts.find(
        (c) =>
          c.name?.toLowerCase() === toLower ||
          c.pushname?.toLowerCase() === toLower,
      );

      // 2. Correspondance partielle stricte
      if (!found) {
        found = contacts.find(
          (c) =>
            c.name?.toLowerCase().includes(toLower) ||
            c.pushname?.toLowerCase().includes(toLower),
        );
      }

      // 3. Recherche par prénom exact (mot entier) — si unique, sélection directe
      // Si plusieurs contacts ont le même prénom, scoring sur les tokens suivants
      if (!found) {
        const tokens = toLower.split(/\s+/).filter((t) => t.length > 1);
        const firstName = tokens[0];

        if (firstName) {
          const firstNameMatches = contacts.filter((c) => {
            const contactName = (c.name || c.pushname || "").toLowerCase();
            return contactName.split(/\s+/).some((word) => word === firstName);
          });

          if (firstNameMatches.length === 1) {
            found = firstNameMatches[0];
          } else if (firstNameMatches.length > 1) {
            let bestScore = 0;
            let bestContact = null;
            for (const c of firstNameMatches) {
              const contactName = (c.name || c.pushname || "").toLowerCase();
              let score = 3;
              for (let i = 1; i < tokens.length; i++) {
                if (contactName.includes(tokens[i])) score += 2;
              }
              if (score > bestScore) {
                bestScore = score;
                bestContact = c;
              }
            }
            if (bestContact) found = bestContact;
          }
        }
      }

      // 4. Fallback scoring large
      if (!found) {
        const tokens = toLower.split(/\s+/).filter((t) => t.length > 1);
        const firstName = tokens[0];
        let bestScore = 0;
        let bestContact = null;
        for (const c of contacts) {
          const contactName = (c.name || c.pushname || "").toLowerCase();
          if (!contactName) continue;
          let score = 0;
          if (firstName && contactName.includes(firstName)) score += 3;
          for (let i = 1; i < tokens.length; i++) {
            if (contactName.includes(tokens[i])) score += 1;
          }
          if (toLower.includes(contactName) && contactName.length > 2)
            score += 2;
          if (score > bestScore) {
            bestScore = score;
            bestContact = c;
          }
        }
        if (bestContact && bestScore >= 3) found = bestContact;
      }

      if (!found) {
        throw new Error(
          `Contact "${to}" introuvable dans WhatsApp. Vérifiez le nom.`,
        );
      }
      chatId = found.id._serialized;
      console.log(
        `🔍 [WHATSAPP] Contact trouvé : "${found.name || found.pushname}" pour la recherche "${to}"`,
      );
    }

    await client.sendMessage(chatId, message);
    console.log(`✅ [WHATSAPP] Message envoyé à ${to}: "${message}"`);

    return {
      success: true,
      message: `Message envoyé à ${to}.`,
    };
  } catch (err) {
    console.error("❌ [WHATSAPP] Erreur envoi message:", err.message);
    throw err;
  }
}

/**
 * Recherche des contacts WhatsApp par nom (pour debug et configuration des alias).
 * @param {string} query - Terme de recherche (ex: "jérémy")
 * @returns {Promise<Array<{name: string, pushname: string, id: string}>>}
 */
export async function searchContacts(query) {
  if (!client || !isConnected) {
    throw new Error("WhatsApp non connecté.");
  }
  const contacts = await client.getContacts();
  const q = query.toLowerCase().trim();
  return contacts
    .filter((c) => {
      const name = (c.name || c.pushname || "").toLowerCase();
      return !q || name.includes(q);
    })
    .map((c) => ({
      name: c.name || "",
      pushname: c.pushname || "",
      id: c.id._serialized,
    }))
    .slice(0, 50);
}

/**
 * Sauvegarde un alias vocal → nom exact du contact dans user-settings.json.
 * @param {string} alias - Nom vocal en minuscules (ex: "jérémy afpa")
 * @param {string} contactName - Nom exact du contact WhatsApp (ex: "Jérémy Dupont")
 */
export async function saveAlias(alias, contactName) {
  const { readFileSync, writeFileSync } = await import("fs");
  const settingsPath = join(__dirname, "../config/user-settings.json");
  const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  if (!settings.whatsappAliases) settings.whatsappAliases = {};
  settings.whatsappAliases[alias.toLowerCase().trim()] = contactName;
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
  console.log(`✅ [WHATSAPP] Alias sauvegardé : "${alias}" → "${contactName}"`);
}
