import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

let port;
let parser;
let isConnected = false;
let reconnectInterval;

const BAUD_RATE = 115200;
const RECONNECT_DELAY = 5000;

/**
 * Détecte le port série de l'ESP32 (CH340/CP210x)
 */
async function detectPort() {
  const ports = await SerialPort.list();

  // Filtrer pour trouver l'ESP32
  const espPort = ports.find(
    (p) =>
      (p.manufacturer &&
        (p.manufacturer.includes("Espressif") ||
          p.manufacturer.includes("wch.cn") || // CH340
          p.manufacturer.includes("Silicon Labs"))) || // CP210x
      (p.pnpId &&
        (p.pnpId.includes("VID_1A86") || p.pnpId.includes("VID_10C4"))), // Fallback PnpId
  );

  if (espPort) {
    console.log(`🔌 [Sphere] Port détecté: ${espPort.path}`);
    return espPort.path;
  }

  return null;
}

/**
 * Initialise la connexion série
 */
export async function initSphereService() {
  connect();
}

async function connect() {
  // Eviter connexion double
  if (isConnected || (port && port.isOpen)) return;

  const portPath = await detectPort();

  if (!portPath) {
    console.log("⚠️ [Sphere] Aucun ESP32 détecté. Tentative dans 5s...");
    scheduleReconnect();
    return;
  }

  console.log(`🔌 [Sphere] Tentative de connexion sur ${portPath}...`);

  try {
    port = new SerialPort({ path: portPath, baudRate: BAUD_RATE });
    parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

    port.on("open", () => {
      console.log(`✅ [Sphere] Connecté sur ${portPath}`);
      isConnected = true;
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }

      // Reset state on connect
      setTimeout(() => {
        setSphereState("IDLE");
        setSphereText("JARVIS ONLINE");
      }, 2000); // Attendre le boot de l'ESP
    });

    port.on("close", () => {
      console.log("❌ [Sphere] Connexion perdue");
      isConnected = false;
      port = null;
      scheduleReconnect();
    });

    port.on("error", (err) => {
      console.error(`❌ [Sphere] Erreur: ${err.message}`);
      isConnected = false;
      if (port && port.isOpen) port.close();
      port = null;
      scheduleReconnect();
    });
  } catch (error) {
    console.error(`❌ [Sphere] Erreur init: ${error.message}`);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectInterval) return;
  reconnectInterval = setInterval(connect, RECONNECT_DELAY);
}

/**
 * Change l'état visuel de la sphère
 * @param {"IDLE" | "LISTENING" | "SPEAKING" | "ERROR"} state
 */
export function setSphereState(state) {
  if (!isConnected || !port) return;
  try {
    const cmd = `STATE ${state.toUpperCase()}\n`;
    port.write(cmd);
  } catch (error) {
    console.error("Error writing to sphere:", error);
  }
}

/**
 * Affiche du texte sur la sphère
 * @param {string} text
 */
export function setSphereText(text) {
  if (!isConnected || !port) return;
  try {
    // Nettoyage basique pour éviter caractères non supportés par l'ESP
    const cleanText = text
      .substring(0, 60)
      .replace(/[\n\r]/g, " ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Enlever accents si besoin (optionnel)
      .trim();

    const cmd = `TEXT ${cleanText}\n`;
    port.write(cmd);
  } catch (error) {
    console.error("Error writing text to sphere:", error);
  }
}
