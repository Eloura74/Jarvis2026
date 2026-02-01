/**
 * API Frontend pour contrôle des fenêtres Windows
 * Interface client pour endpoints backend /api/windows/*
 */

const API_BASE = "http://localhost:3001";

/**
 * Liste toutes les fenêtres ouvertes
 * @returns {Promise<{id: number, title: string, processId: number}[]>}
 */
export async function listWindows() {
  try {
    const response = await fetch(`${API_BASE}/api/windows`);
    const data = await response.json();
    return data.windows || [];
  } catch (error) {
    console.error("Error fetching windows:", error);
    return [];
  }
}

/**
 * Met au premier plan la fenêtre spécifiée
 * @param {string} windowTitle - Titre de la fenêtre (recherche floue)
 * @returns {Promise<boolean>} True si succès
 */
export async function focusWindow(windowTitle: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/windows/focus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ windowTitle }),
    });
    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error("Error focusing window:", error);
    return false;
  }
}

/**
 * Ferme la fenêtre spécifiée
 * @param {string} windowTitle - Titre de la fenêtre
 * @returns {Promise<boolean>} True si succès
 */
export async function closeWindow(windowTitle: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/windows/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ windowTitle }),
    });
    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error("Error closing window:", error);
    return false;
  }
}

/**
 * Minimise la fenêtre spécifiée
 * @param {string} windowTitle - Titre de la fenêtre
 * @returns {Promise<boolean>} True si succès
 */
export async function minimizeWindow(windowTitle: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/windows/minimize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ windowTitle }),
    });
    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error("Error minimizing window:", error);
    return false;
  }
}

/**
 * Agrandit la fenêtre spécifiée
 * @param {string} windowTitle - Titre de la fenêtre
 * @returns {Promise<boolean>} True si succès
 */
export async function maximizeWindow(windowTitle: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/windows/maximize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ windowTitle }),
    });
    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error("Error maximizing window:", error);
    return false;
  }
}

/**
 * Tape du texte dans la fenêtre active
 * @param {string} text - Texte à taper
 * @returns {Promise<boolean>} True si succès
 */
export async function typeText(text: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/automation/type`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error("Error typing text:", error);
    return false;
  }
}

/**
 * Envoie un raccourci clavier
 * @param {string} keys - Raccourci (ex: "ctrl+c", "ctrl+shift+n")
 * @returns {Promise<boolean>} True si succès
 */
export async function sendShortcut(keys: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/automation/shortcut`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys }),
    });
    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.error("Error sending shortcut:", error);
    return false;
  }
}
