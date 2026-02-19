import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

let port;
let parser;
let isConnected = false;
let reconnectInterval;

const BAUD_RATE = 115200;
const RECONNECT_DELAY = 5000;

export async function initSphereService() {
  connect();
}

async function detectPort() {
  const ports = await SerialPort.list();
  const espPort = ports.find(
    (p) =>
      (p.manufacturer &&
        (p.manufacturer.includes("Espressif") ||
          p.manufacturer.includes("wch.cn") ||
          p.manufacturer.includes("Silicon Labs"))) ||
      (p.pnpId &&
        (p.pnpId.includes("VID_1A86") || p.pnpId.includes("VID_10C4"))),
  );
  return espPort ? espPort.path : null;
}

async function connect() {
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
      setTimeout(() => {
        setSphereState("IDLE");
        setSphereText("JARVIS ONLINE");
      }, 2000);
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
 * Change l'état ou le mode de la sphère
 * @param {string} state - IDLE, LISTENING, SPEAKING, ERROR, WEATHER, HOME, SYSTEM, SEARCH, MATRIX
 */
export function setSphereState(state) {
  if (!isConnected || !port) return;
  try {
    // Allow both STATE and MODE keyword, but main.cpp handles both via "STATE X" or "MODE X" logic?
    // Actually main.cpp implementation I wrote handles both if line.startsWith("STATE ") || line.startsWith("MODE ")
    // Let's stick to MODE for semantic modes, but STATE is fine too.
    const cmd = `MODE ${state.toUpperCase()}\n`;
    port.write(cmd);
  } catch (error) {
    console.error("Error writing to sphere:", error);
  }
}

export function setSphereText(text) {
  if (!isConnected || !port) return;
  try {
    const cleanText = text
      .substring(0, 60)
      .replace(/[\n\r]/g, " ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    const cmd = `TEXT ${cleanText}\n`;
    port.write(cmd);
  } catch (error) {
    console.error("Error writing text to sphere:", error);
  }
}
