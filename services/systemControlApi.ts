/**
 * Client API pour contrôle système
 *
 * Interface frontend pour toutes commandes système :
 * - Volume audio
 * - Luminosité
 * - Fichiers
 * - Capture écran
 * - Session Windows
 * - Contrôle média
 *
 * @module systemControlApi
 */

const API_BASE = "http://localhost:3001/api";

// ============================================================================
// VOLUME AUDIO
// ============================================================================

/**
 * Définit le volume à une valeur spécifique
 * @param value - Volume 0-100
 */
export async function setVolume(value: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/system/volume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set", value }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Erreur setVolume:", error);
    return false;
  }
}

/**
 * Augmente le volume de ~2%
 */
export async function increaseVolume(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/system/volume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "increase" }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Erreur increaseVolume:", error);
    return false;
  }
}

/**
 * Diminue le volume de ~2%
 */
export async function decreaseVolume(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/system/volume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decrease" }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Erreur decreaseVolume:", error);
    return false;
  }
}

/**
 * Coupe/rétablit le son
 */
export async function toggleMute(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/system/volume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mute" }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Erreur toggleMute:", error);
    return false;
  }
}

// ============================================================================
// FICHIERS
// ============================================================================

/**
 * Crée un fichier ou dossier
 */
export async function createFile(
  path: string,
  type: "file" | "directory" = "file",
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/files/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", path, type }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Erreur createFile:", error);
    return false;
  }
}

/**
 * Supprime un fichier ou dossier
 */
export async function deleteFile(path: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/files/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", path }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Erreur deleteFile:", error);
    return false;
  }
}

/**
 * Recherche des fichiers
 */
export async function searchFiles(
  query: string,
  path?: string,
  maxResults: number = 50,
): Promise<string[]> {
  try {
    const params = new URLSearchParams({
      query,
      maxResults: maxResults.toString(),
    });
    if (path) params.append("path", path);

    const response = await fetch(`${API_BASE}/files/search?${params}`);
    const data = await response.json();

    return data.success ? data.results : [];
  } catch (error) {
    console.error("Erreur searchFiles:", error);
    return [];
  }
}

// ============================================================================
// CAPTURE ÉCRAN
// ============================================================================

/**
 * Prend une capture d'écran
 */
export async function takeScreenshot(
  savePath?: string,
): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/system/screenshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savePath }),
    });

    const data = await response.json();
    return data.success ? data.path : null;
  } catch (error) {
    console.error("Erreur takeScreenshot:", error);
    return null;
  }
}

// ============================================================================
// SESSION WINDOWS
// ============================================================================

/**
 * Verrouille la session Windows
 */
export async function lockSession(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/system/power`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lock" }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Erreur lockSession:", error);
    return false;
  }
}

/**
 * Éteint le PC
 */
export async function shutdownPC(delay: number = 0): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/system/power`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "shutdown", delay }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Erreur shutdownPC:", error);
    return false;
  }
}

/**
 * Redémarre le PC
 */
export async function restartPC(delay: number = 0): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/system/power`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restart", delay }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Erreur restartPC:", error);
    return false;
  }
}

/**
 * Met en veille le PC
 */
export async function sleepPC(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/system/power`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sleep" }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Erreur sleepPC:", error);
    return false;
  }
}

// ============================================================================
// CONTRÔLE MÉDIA
// ============================================================================

/**
 * Lecture/Pause média
 */
export async function toggleMediaPlayback(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/media/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "play" }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Erreur toggleMediaPlayback:", error);
    return false;
  }
}

/**
 * Piste suivante
 */
export async function nextTrack(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/media/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "next" }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Erreur nextTrack:", error);
    return false;
  }
}

/**
 * Piste précédente
 */
export async function previousTrack(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/media/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "previous" }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Erreur previousTrack:", error);
    return false;
  }
}
