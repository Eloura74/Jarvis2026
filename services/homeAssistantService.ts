// Configuration HA
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN || "";

// Types
export interface HAEntity {
  id: string;
  label: string;
  type?: "light" | "switch" | "sensor" | "binary_sensor" | "button";
  unit?: string;
  attributes?: Record<string, unknown>;
}

export type HAPrinter = {
  name: string;
  bed: string;
  ext: string;
  progress: string;
  ip?: string;
  webcamUrl?: string;
};

// Base de données des entités (Centralisée ici)
export const HA_ENTITIES = {
  LIGHTS: [
    { id: "light.canape", label: "Canapé", type: "light" },
    { id: "light.cheminee", label: "Cheminée", type: "light" },
    { id: "light.led_switchwire", label: "Switchwire LED", type: "light" },
    {
      id: "light.a1mini_0309da452500192_lumiere_de_la_chambre",
      label: "A1 Mini Light",
      type: "light",
    },
  ] as HAEntity[],

  SENSORS: [
    {
      id: "sensor.capteur_bureau_temperature",
      label: "Bureau Temp",
      unit: "°C",
      type: "sensor",
    },
    {
      id: "sensor.capteur_bureau_humidite",
      label: "Bureau Hum",
      unit: "%",
      type: "sensor",
    },
    {
      id: "sensor.capteur_etage_temperature",
      label: "Etage Temp",
      unit: "°C",
      type: "sensor",
    },
    {
      id: "sensor.capteur_etage_humidite",
      label: "Etage Hum",
      unit: "%",
      type: "sensor",
    },
    {
      id: "sensor.capteur_salon_temperature",
      label: "Salon Temp",
      unit: "°C",
      type: "sensor",
    },
    {
      id: "sensor.capteur_salon_humidite",
      label: "Salon Hum",
      unit: "%",
      type: "sensor",
    },
  ] as HAEntity[],

  PRINTERS: [
    {
      name: "VZ330",
      bed: "sensor.vz330_bed_temperature",
      ext: "sensor.vz330_extruder_temperature",
      progress: "sensor.vz330_progress",
      ip: "192.168.1.130",
      webcamUrl: "http://192.168.1.130/webcam/?action=stream",
    },
    {
      name: "SWITCHWIRE",
      bed: "sensor.mainsail_bed_temperature",
      ext: "sensor.mainsail_extruder_temperature",
      progress: "sensor.mainsail_progress",
      ip: "192.168.1.128",
      webcamUrl: "http://192.168.1.128/webcam/?action=stream",
    },
    {
      name: "A1 MINI",
      bed: "sensor.a1mini_0309da452500192_temperature_du_lit",
      ext: "sensor.a1mini_0309da452500192_temperature_de_la_buse",
      progress: "sensor.a1mini_0309da452500192_progression_de_l_impression",
    },
  ] as HAPrinter[],

  DOORS: [
    {
      id: "binary_sensor.bureau_prive_porte_porte",
      label: "Porte Bureau",
      type: "binary_sensor",
    },
    {
      id: "binary_sensor.capteur_chambre_aaron_porte",
      label: "Porte Aaron",
      type: "binary_sensor",
    },
    {
      id: "binary_sensor.capteur_garage_porte",
      label: "Porte Garage",
      type: "binary_sensor",
    },
    {
      id: "binary_sensor.portail_porte",
      label: "Portail",
      type: "binary_sensor",
    },
    {
      id: "binary_sensor.porte_chambre_parentale_porte",
      label: "Porte Parents",
      type: "binary_sensor",
    },
  ] as HAEntity[],
};

// --- SERVICES ---

/**
 * Récupère l'état de toutes les entités
 */
export const fetchHAStates = async (): Promise<Record<string, any>> => {
  try {
    const res = await fetch("/api/states");
    if (!res.ok) return {};
    const data = await res.json();

    if (!Array.isArray(data)) return {};

    const states: Record<string, unknown> = {};
    data.forEach((ent: { entity_id: string; [key: string]: unknown }) => {
      if (ent && ent.entity_id) {
        states[ent.entity_id] = ent;
      }
    });
    return states;
  } catch {
    return {};
  }
};

/**
 * Appelle un service HA (ex: light.turn_on)
 */
export const callHAService = async (
  domain: string,
  service: string,
  entityId: string,
  data: Record<string, unknown> = {},
) => {
  if (!HA_TOKEN) return;
  try {
    await fetch(`/api/services/${domain}/${service}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ entity_id: entityId, ...data }),
    });
    return true;
  } catch (e) {
    console.error(`HA Service Error (${domain}.${service}):`, e);
    return false;
  }
};

/**
 * Bascule une lumière ou un switch
 */
export const toggleEntity = async (entityId: string, currentState: string) => {
  const domain = entityId.split(".")[0];
  const service = currentState === "on" ? "turn_off" : "turn_on";
  return await callHAService(domain, service, entityId);
};

/**
 * Définit la couleur d'une lumière (RGB)
 */
export const setLightColor = async (
  entityId: string,
  rgb: [number, number, number],
) => {
  return await callHAService("light", "turn_on", entityId, { rgb_color: rgb });
};

/**
 * Définit la luminosité (0-255)
 */
export const setLightBrightness = async (
  entityId: string,
  brightness: number,
) => {
  return await callHAService("light", "turn_on", entityId, { brightness });
};

// Cache mémoire pour getHAContext — TTL 30 secondes
// Évite une requête HTTP HA à chaque commande Gemini (gain 1-3s de latence)
let haContextCache: { data: string; ts: number } | null = null;
const HA_CACHE_TTL_MS = 30_000;

/** Invalide manuellement le cache HA (ex: après une action domotique) */
export const invalidateHACache = (): void => {
  haContextCache = null;
};

/**
 * Récupère le contexte complet des appareils pour Gemini
 * Résultat mis en cache 30s pour éviter les requêtes répétées
 */
export const getHAContext = async (): Promise<string> => {
  // Retourner le cache si encore valide
  if (haContextCache && Date.now() - haContextCache.ts < HA_CACHE_TTL_MS) {
    return haContextCache.data;
  }

  const states = await fetchHAStates();

  const lights = HA_ENTITIES.LIGHTS.map((l) => {
    const s = states[l.id];
    return `- ${l.label}: ${s?.state || "unknown"} (ID: ${l.id})`;
  }).join("\n");

  const sensors = HA_ENTITIES.SENSORS.map((s) => {
    const st = states[s.id];
    return `- ${s.label}: ${st?.state || "?"}${s.unit || ""} (ID: ${s.id})`;
  }).join("\n");

  const doors = HA_ENTITIES.DOORS.map((d) => {
    const st = states[d.id];
    return `- ${d.label}: ${st?.state === "on" ? "OPEN" : "CLOSED"} (ID: ${d.id})`;
  }).join("\n");

  const printers = HA_ENTITIES.PRINTERS.map((p) => {
    const bed = states[p.bed]?.state || "?";
    const ext = states[p.ext]?.state || "?";
    const prog = states[p.progress]?.state || "?";
    return `- ${p.name}: Progress ${prog}%, Bed ${bed}°C, Extruder ${ext}°C`;
  }).join("\n");

  const result = `
**HOME AUTOMATION STATUS (LIVE DATA):**
[INSTRUCTIONS]
- When replying, use the device LABEL.
- NEVER read the entity ID (e.g., "light.canape") out loud.
- Be natural: "The office light is on" instead of "Office Light: on".

[LIGHTS]
${lights}

[SENSORS]
${sensors}

[DOORS/SECURITY]
${doors}

[3D PRINTERS]
${printers}
`;

  // Mettre en cache le résultat avec timestamp
  haContextCache = { data: result, ts: Date.now() };
  return result;
};
