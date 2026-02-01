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
export async function searchAppOnBackend(query: string): Promise<any[]> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/search?q=${encodeURIComponent(query)}`,
    );

    if (!response.ok) {
      throw new Error("Backend search failed");
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Backend search error:", error);
    return [];
  }
}

/**
 * Lance une application via le backend
 */
export async function launchAppOnBackend(path: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/launch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      throw new Error("Backend launch failed");
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Backend launch error:", error);
    return false;
  }
}
