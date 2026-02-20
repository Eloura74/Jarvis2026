/**
 * Service MQTT Bambu Labs - Backend Node.js
 *
 * Connexion MQTT TCP à l'imprimante Bambu A1 mini
 * Expose les données au frontend via REST API
 */

import mqtt from "mqtt";
import dotenv from "dotenv";
import { broadcastEvent } from "../routes/events.js";

// Charger les env vars AVANT d'utiliser process.env (chemin relatif au CWD!)
dotenv.config({ path: "../.env.local" });

// Configuration Bambu depuis .env
const BAMBU_CONFIG = {
  ip: process.env.VITE_BAMBU_IP || "192.168.1.37",
  accessCode: process.env.VITE_BAMBU_ACCESS_CODE || "",
  serial: process.env.VITE_BAMBU_SERIAL || "",
  port: 8883,
};

/* console.log("🔍 DEBUG Bambu Config:", {
  ip: BAMBU_CONFIG.ip,
  code: BAMBU_CONFIG.accessCode ? "****" : "MISSING",
  serial: BAMBU_CONFIG.serial,
}); */

// État actuel (cache en mémoire)
let currentStatus = {
  connected: false,
  printing: false,
  progress: 0,
  fileName: "",
  temps: {
    bed: 0,
    nozzle: 0,
  },
  speed: 0,
  layer: {
    current: 0,
    total: 0,
  },
  eta: 0,
  lastUpdate: null,
};

let mqttClient = null;

/**
 * Initialise la connexion MQTT au Bambu
 */
export function initBambuMqtt() {
  if (!BAMBU_CONFIG.ip || !BAMBU_CONFIG.accessCode || !BAMBU_CONFIG.serial) {
    console.warn("⚠️ Bambu MQTT config incomplète - Vérifiez .env.local");
    return;
  }

  console.log(
    `🔌 Backend MQTT Bambu: ${BAMBU_CONFIG.serial} @ ${BAMBU_CONFIG.ip}`,
  );

  // Connexion MQTT MQTTS (Secure)
  mqttClient = mqtt.connect(`mqtts://${BAMBU_CONFIG.ip}:${BAMBU_CONFIG.port}`, {
    username: "bblp",
    password: BAMBU_CONFIG.accessCode,
    clientId: `jarvis_backend_${BAMBU_CONFIG.serial}_${Date.now()}`,
    reconnectPeriod: 5000,
    keepalive: 60,
    rejectUnauthorized: false, // IGNORER ERREURS SSL (IMPORTANT POUR BAMBU)
  });

  // Event: Connexion établie
  mqttClient.on("connect", () => {
    console.log("✅ MQTT Bambu connecté (backend)");
    currentStatus.connected = true;
    currentStatus.lastUpdate = new Date().toISOString();

    // Subscribe au topic Bambu
    mqttClient.subscribe(`device/${BAMBU_CONFIG.serial}/report`, (err) => {
      if (err) {
        console.error("❌ Erreur subscription MQTT:", err);
      } else {
        console.log(
          "📡 Subscribe OK: device/" + BAMBU_CONFIG.serial + "/report",
        );
      }
    });
  });

  // Event: Message reçu
  mqttClient.on("message", (topic, payload) => {
    try {
      const data = JSON.parse(payload.toString());
      const print = data.print || {};
      const temps = print.temp || {};

      // Détection des changements d'état pour Notifications Proactives (Push)
      const isNowPrinting = print.gcode_state === "RUNNING";
      if (
        currentStatus.printing === true &&
        isNowPrinting === false &&
        print.mc_percent === 100
      ) {
        broadcastEvent(
          "PRINTER_BAMBU",
          { event: "PRINT_FINISHED", printer: "Bambu A1 Mini" },
          "Monsieur, l'impression sur la Bambu Lab A1 Mini est terminée avec succès.",
        );
      } else if (
        print.gcode_state === "FAILED" ||
        print.gcode_state === "PAUSED"
      ) {
        // Optionnel : Alerte si erreur
        if (currentStatus.printing === true) {
          broadcastEvent(
            "PRINTER_BAMBU",
            {
              event: "PRINT_INTERRUPTED",
              state: print.gcode_state,
              printer: "Bambu A1 Mini",
            },
            `Monsieur, attention, l'impression sur la Bambu A1 Mini est actuellement en état ${print.gcode_state}.`,
          );
        }
      }

      currentStatus.connected = true;
      currentStatus.printing = isNowPrinting;
      currentStatus.progress = print.mc_percent || 0;
      currentStatus.fileName = print.subtask_name || "";
      currentStatus.temps.bed = temps.bed_temp || 0;
      currentStatus.temps.nozzle = temps.nozzle_temp || 0;
      currentStatus.speed = print.spd_mag || 0;
      currentStatus.layer.current = print.layer_num || 0;
      currentStatus.layer.total = print.total_layer_num || 0;
      currentStatus.eta = print.mc_remaining_time || 0;
      currentStatus.lastUpdate = new Date().toISOString();

      /* console.log(
        `📊 Bambu update: ${currentStatus.printing ? "PRINTING" : "IDLE"} ${currentStatus.progress}%`,
      ); */
    } catch (error) {
      console.error("❌ Erreur parse MQTT Bambu:", error);
    }
  });

  // Event: Erreur
  mqttClient.on("error", (err) => {
    console.error("❌ MQTT Bambu error:", err.message);
    if (err.stack) console.error(err.stack);
  });

  // Event: Déconnexion
  mqttClient.on("close", () => {
    console.warn(
      "🔌 MQTT Bambu déconnecté (backend) - Tentative de reconnexion...",
    );
    currentStatus.connected = false;
  });

  // Event: Offline
  mqttClient.on("offline", () => {
    console.warn("🔌 MQTT Bambu OFFLINE (backend)");
  });

  // Event: Reconnexion
  mqttClient.on("reconnect", () => {
    console.log("🔄 MQTT Bambu reconnecting...");
  });
}

/**
 * Récupère l'état actuel du Bambu
 */
export function getBambuStatus() {
  return currentStatus;
}

/**
 * Ferme la connexion MQTT proprement
 */
export function closeBambuMqtt() {
  if (mqttClient) {
    mqttClient.end();
    mqttClient = null;
    console.log("🔌 MQTT Bambu fermé");
  }
}
