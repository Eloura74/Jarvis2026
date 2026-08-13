import fetch from "node-fetch";

/**
 * Fetch the state of a Home Assistant entity
 * @param {string} entityId 
 * @returns {Promise<any>}
 */
export async function getHAEntityState(entityId) {
  const HA_BASE_URL = process.env.HA_BASE_URL;
  const HA_TOKEN = process.env.HA_TOKEN;

  if (!HA_BASE_URL || !HA_TOKEN) {
    throw new Error("HA_BASE_URL or HA_TOKEN not configured");
  }

  const url = `${HA_BASE_URL}/api/states/${entityId}`;
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${HA_TOKEN}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch HA entity ${entityId}: ${response.statusText}`);
  }

  return await response.json();
}
