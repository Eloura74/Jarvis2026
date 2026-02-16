/**
 * Service MQTT Bambulab pour A1 mini
 * Connexion temps réel via MQTT (plus fluide que polling)
 */

import mqtt from "mqtt";

export interface BambuStatus {
  connected: boolean;
  printing: boolean;
  progress: number; // 0-100
  fileName: string;
  temps: {
    bed: number;
    nozzle: number;
  };
  speed: number; // mm/s
  layer: {
    current: number;
    total: number;
  };
  eta: number; // secondes restantes
}

// Config Bambu A1 mini (à mettre dans .env.local)
const BAMBU_CONFIG = {
  ip: import.meta.env.VITE_BAMBU_IP || "192.168.1.XXX",
  accessCode: import.meta.env.VITE_BAMBU_ACCESS_CODE || "",
  serial: import.meta.env.VITE_BAMBU_SERIAL || "0309DA452500192",
  port: 8883, // Port MQTT Bambu
};

// État actuel (singleton)
let currentStatus: BambuStatus = {
  connected: false,
  printing: false,
  progress: 0,
  fileName: "",
  temps: { bed: 0, nozzle: 0 },
  speed: 0,
  layer: { current: 0, total: 0 },
  eta: 0,
};

// Client MQTT
let mqttClient: mqtt.MqttClient | null = null;

// Callback listeners
const listeners: ((status: BambuStatus) => void)[] = [];

/**
 * Initialise connexion MQTT Bambu
 */
export function initBambuMqtt(
  ip?: string,
  accessCode?: string,
  serial?: string,
): void {
  const finalIp = ip || BAMBU_CONFIG.ip;
  const finalCode = accessCode || BAMBU_CONFIG.accessCode;
  const finalSerial = serial || BAMBU_CONFIG.serial;

  if (!finalIp || !finalCode || finalSerial === "0309DA452500192") {
    console.warn(
      "⚠️ Config Bambu incomplète - Utilisez .env.local ou passez les credentials",
    );
    return;
  }

  console.log(`🔌 Connexion MQTT Bambu - ${finalSerial} @ ${finalIp}`);

  // Connexion MQTT
  mqttClient = mqtt.connect(`mqtt://${finalIp}:${BAMBU_CONFIG.port}`, {
    username: "bblp", // Username standard Bambu
    password: finalCode,
    clientId: `jarvis_${finalSerial}_${Date.now()}`,
    reconnectPeriod: 5000,
    keepalive: 60,
  });

  // Event: Connexion établie
  mqttClient.on("connect", () => {
    console.log("✅ MQTT Bambu connecté");
    currentStatus.connected = true;
    notifyListeners();

    // S'abonner au topic de status
    mqttClient?.subscribe(`device/${finalSerial}/report`, (err) => {
      if (err) {
        console.error("❌ Erreur subscription MQTT:", err);
      } else {
        console.log("📡 Abonné au feed Bambu");
      }
    });
  });

  // Event: Message reçu
  mqttClient.on("message", (_topic, payload) => {
    try {
      const data = JSON.parse(payload.toString());

      // Parser les données Bambu
      const print = data.print || {};
      const temps = print.temp || {};

      currentStatus.printing = print.gcode_state === "RUNNING";
      currentStatus.progress = print.mc_percent || 0;
      currentStatus.fileName = print.subtask_name || "";
      currentStatus.temps.bed = temps.bed_temp || 0;
      currentStatus.temps.nozzle = temps.nozzle_temp || 0;
      currentStatus.speed = print.spd_mag || 0;
      currentStatus.layer.current = print.layer_num || 0;
      currentStatus.layer.total = print.total_layer_num || 0;
      currentStatus.eta = print.mc_remaining_time || 0;

      notifyListeners();
    } catch (error) {
      console.error("❌ Erreur parsing MQTT Bambu:", error);
    }
  });

  // Event: Erreur
  mqttClient.on("error", (error) => {
    console.error("❌ Erreur MQTT Bambu:", error);
    currentStatus.connected = false;
    notifyListeners();
  });

  // Event: Déconnexion
  mqttClient.on("close", () => {
    console.log("🔌 MQTT Bambu déconnecté");
    currentStatus.connected = false;
    notifyListeners();
  });
}

/**
 * Notifie tous les listeners
 */
function notifyListeners(): void {
  listeners.forEach((listener) => listener({ ...currentStatus }));
}

/**
 * Met à jour le status manuellement (pour tests)
 */
export function updateBambuStatus(data: Partial<BambuStatus>): void {
  currentStatus = {
    ...currentStatus,
    ...data,
  };
  notifyListeners();
}

/**
 * Récupère le status actuel
 */
export function getBambuStatus(): BambuStatus {
  return { ...currentStatus };
}

/**
 * Subscribe aux changements de status
 */
export function subscribeBambuStatus(
  callback: (status: BambuStatus) => void,
): () => void {
  listeners.push(callback);

  // Retourner fonction unsubscribe
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Déconnexion MQTT
 */
export function disconnectBambuMqtt(): void {
  console.log("🔌 Déconnexion MQTT Bambu");
  mqttClient?.end();
  mqttClient = null;
  currentStatus.connected = false;
  listeners.length = 0;
}

// Auto-init au chargement (si credentials présents)
if (BAMBU_CONFIG.accessCode && BAMBU_CONFIG.ip !== "192.168.1.XXX") {
  initBambuMqtt();
}
