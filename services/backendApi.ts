/**
 * Service d'API Backend pour J.A.R.V.I.S.
 *
 * Communique avec le serveur Node.js local pour :
 * - Rechercher des applications sur le système
 * - Lancer des applications
 *
 * @module backendApi
 */

const BACKEND_URL = "http://localhost:3001";

/**
 * Vérifie si le backend est disponible
 */
export async function checkBackendStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/status`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Recherche une application via le backend
 */
export async function searchAppOnBackend(
  query: string,
): Promise<Record<string, unknown>[]> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/search?q=${encodeURIComponent(query)}`,
    );

    if (!response.ok) {
      throw new Error("Backend search failed");
    }

    const data = await response.json();
    return data.results || [];
  } catch (error: unknown) {
    console.error("Backend search error:", error);
    return [];
  }
}

/**
 * Lance une application via le backend
 * @param path - Chemin de l'application
 * @param args - Arguments optionnels (ex: URL pour navigateur)
 */
export async function launchAppOnBackend(
  path: string,
  args?: string[],
): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/launch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path, args }),
    });

    if (!response.ok) {
      throw new Error("Backend launch failed");
    }

    const data = await response.json();
    return data.success;
  } catch (error: unknown) {
    console.error("Backend launch error:", error);
    return false;
  }
}

/**
 * Contrôle le volume système via le backend
 * @param action - 'increase', 'decrease', 'set', 'mute', 'unmute'
 * @param value - Valeur optionnelle (0-100)
 */
export async function controlVolumeOnBackend(
  action: string,
  value?: number,
): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/system/volume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, value }),
    });
    return response.ok;
  } catch (error: unknown) {
    console.error("Backend volume error:", error);
    return false;
  }
}

/**
 * Prend une capture d'écran via le backend
 */
export async function takeScreenshotOnBackend(): Promise<string | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/system/screenshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    return data.success ? data.path : null;
  } catch (error: unknown) {
    console.error("Backend screenshot error:", error);
    return null;
  }
}

/**
 * Contrôle l'alimentation/session via le backend
 */
export async function controlPowerOnBackend(
  action: string,
  delay?: number,
): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/system/power`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, delay }),
    });
    return response.ok;
  } catch (error: unknown) {
    console.error("Backend power error:", error);
    return false;
  }
}
