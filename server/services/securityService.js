/**
 * Service Sécurité Home Assistant
 * - État système sécurité (portes, fenêtres, mouvement)
 * - Contrôle alarme
 * - Caméras (snapshots, liste)
 * - Historique détections mouvement
 */

import fetch from "node-fetch";

const HA_URL = process.env.HOME_ASSISTANT_URL || "http://homeassistant.local:8123";
const HA_TOKEN = process.env.HOME_ASSISTANT_TOKEN || "";

/**
 * Headers pour requêtes Home Assistant API
 */
function getHeaders() {
  return {
    Authorization: `Bearer ${HA_TOKEN}`,
    "Content-Type": "application/json",
  };
}

/**
 * Récupère l'état du système de sécurité
 * Retourne portes, fenêtres, capteurs mouvement, état alarme
 */
export async function getSecurityStatus() {
  try {
    if (!HA_TOKEN) {
      throw new Error("HOME_ASSISTANT_TOKEN non configuré");
    }

    // Récupérer tous les états des entités
    const response = await fetch(`${HA_URL}/api/states`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erreur Home Assistant API: ${response.status}`);
    }

    const states = await response.json();

    // Filtrer portes (binary_sensor.door_*)
    const doors = states
      .filter((s) => s.entity_id.includes("door") && s.entity_id.startsWith("binary_sensor"))
      .map((s) => ({
        name: s.attributes.friendly_name || s.entity_id,
        state: s.state,
        entityId: s.entity_id,
      }));

    // Filtrer fenêtres (binary_sensor.window_*)
    const windows = states
      .filter((s) => s.entity_id.includes("window") && s.entity_id.startsWith("binary_sensor"))
      .map((s) => ({
        name: s.attributes.friendly_name || s.entity_id,
        state: s.state,
        entityId: s.entity_id,
      }));

    // Filtrer capteurs mouvement (binary_sensor.motion_*)
    const motionSensors = states
      .filter((s) => s.entity_id.includes("motion") && s.entity_id.startsWith("binary_sensor"))
      .map((s) => ({
        name: s.attributes.friendly_name || s.entity_id,
        state: s.state,
        entityId: s.entity_id,
        lastChanged: s.last_changed,
      }));

    // État alarme (alarm_control_panel.*)
    const alarmEntity = states.find((s) => s.entity_id.startsWith("alarm_control_panel"));
    const alarmArmed = alarmEntity ? alarmEntity.state !== "disarmed" : false;

    // Alertes actives (détections récentes < 5 min)
    const now = new Date();
    const alerts = motionSensors
      .filter((m) => {
        const lastChanged = new Date(m.lastChanged);
        const diffMinutes = (now - lastChanged) / 1000 / 60;
        return m.state === "on" && diffMinutes < 5;
      })
      .map((m) => ({
        type: "motion",
        sensor: m.name,
        timestamp: m.lastChanged,
      }));

    return {
      doors,
      windows,
      motionSensors,
      alarmArmed,
      alarmState: alarmEntity?.state || "unknown",
      alerts,
    };
  } catch (error) {
    console.error("Erreur getSecurityStatus:", error.message);
    throw new Error(`Impossible de récupérer l'état sécurité: ${error.message}`);
  }
}

/**
 * Active ou désactive l'alarme
 */
export async function controlAlarm(action, mode = "away") {
  try {
    if (!HA_TOKEN) {
      throw new Error("HOME_ASSISTANT_TOKEN non configuré");
    }

    // Trouver l'entité alarme
    const statesResponse = await fetch(`${HA_URL}/api/states`, {
      headers: getHeaders(),
    });
    const states = await statesResponse.json();
    const alarmEntity = states.find((s) => s.entity_id.startsWith("alarm_control_panel"));

    if (!alarmEntity) {
      throw new Error("Aucune alarme trouvée dans Home Assistant");
    }

    const entityId = alarmEntity.entity_id;
    let service = "";

    if (action === "arm") {
      service = mode === "home" ? "alarm_arm_home" : "alarm_arm_away";
    } else if (action === "disarm") {
      service = "alarm_disarm";
    } else {
      throw new Error(`Action invalide: ${action}`);
    }

    // Appeler le service
    const response = await fetch(`${HA_URL}/api/services/alarm_control_panel/${service}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        entity_id: entityId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur appel service: ${response.status}`);
    }

    return {
      success: true,
      action,
      mode,
      entityId,
    };
  } catch (error) {
    console.error("Erreur controlAlarm:", error.message);
    throw new Error(`Impossible de contrôler l'alarme: ${error.message}`);
  }
}

/**
 * Capture un snapshot depuis une caméra
 */
export async function getCameraSnapshot(cameraName) {
  try {
    if (!HA_TOKEN) {
      throw new Error("HOME_ASSISTANT_TOKEN non configuré");
    }

    // Trouver l'entité caméra
    const statesResponse = await fetch(`${HA_URL}/api/states`, {
      headers: getHeaders(),
    });
    const states = await statesResponse.json();
    const cameraEntity = states.find(
      (s) =>
        s.entity_id.startsWith("camera") &&
        (s.entity_id.includes(cameraName.toLowerCase()) ||
          s.attributes.friendly_name?.toLowerCase().includes(cameraName.toLowerCase()))
    );

    if (!cameraEntity) {
      throw new Error(`Caméra "${cameraName}" non trouvée`);
    }

    const entityId = cameraEntity.entity_id;

    // URL snapshot
    const snapshotUrl = `${HA_URL}/api/camera_proxy/${entityId}`;

    return {
      success: true,
      cameraName: cameraEntity.attributes.friendly_name || entityId,
      imageUrl: snapshotUrl,
      timestamp: new Date().toISOString(),
      entityId,
    };
  } catch (error) {
    console.error("Erreur getCameraSnapshot:", error.message);
    throw new Error(`Impossible de capturer snapshot: ${error.message}`);
  }
}

/**
 * Liste toutes les caméras disponibles
 */
export async function listCameras() {
  try {
    if (!HA_TOKEN) {
      throw new Error("HOME_ASSISTANT_TOKEN non configuré");
    }

    const response = await fetch(`${HA_URL}/api/states`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Erreur Home Assistant API: ${response.status}`);
    }

    const states = await response.json();

    const cameras = states
      .filter((s) => s.entity_id.startsWith("camera"))
      .map((s) => ({
        name: s.attributes.friendly_name || s.entity_id,
        entityId: s.entity_id,
        state: s.state,
        model: s.attributes.model_name || "Unknown",
      }));

    return cameras;
  } catch (error) {
    console.error("Erreur listCameras:", error.message);
    throw new Error(`Impossible de lister les caméras: ${error.message}`);
  }
}

/**
 * Récupère l'historique des détections de mouvement
 */
export async function getMotionHistory(hours = 24) {
  try {
    if (!HA_TOKEN) {
      throw new Error("HOME_ASSISTANT_TOKEN non configuré");
    }

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    // Récupérer historique via API
    const response = await fetch(
      `${HA_URL}/api/history/period/${startTime.toISOString()}?filter_entity_id=binary_sensor.motion`,
      {
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur Home Assistant API: ${response.status}`);
    }

    const history = await response.json();

    // Extraire détections (state = "on")
    const detections = [];
    history.forEach((entityHistory) => {
      entityHistory.forEach((event) => {
        if (event.state === "on") {
          detections.push({
            sensor: event.attributes.friendly_name || event.entity_id,
            location: event.attributes.device_class || "unknown",
            timestamp: event.last_changed,
            entityId: event.entity_id,
          });
        }
      });
    });

    // Trier par date décroissante
    detections.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return detections;
  } catch (error) {
    console.error("Erreur getMotionHistory:", error.message);
    throw new Error(`Impossible de récupérer l'historique: ${error.message}`);
  }
}
