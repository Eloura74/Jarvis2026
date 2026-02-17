/**
 * Service de Persistance Configuration
 * Backend JSON + fallback localStorage
 */

export interface JarvisSettings {
  // Wake Word
  wakeWordEnabled: boolean;
  wakeWordThreshold: number;

  // Voice
  voiceLanguage: "fr-FR" | "en-US" | "en-GB";
  voiceVolume: number;

  // UI
  theme: "classic" | "ironman" | "matrix";

  // Features
  ghostModeEnabled: boolean;
  psychProfileEnabled: boolean;

  // Navigation
  savedLocations?: Record<string, string>;
}

const DEFAULT_SETTINGS: JarvisSettings = {
  wakeWordEnabled: true,
  wakeWordThreshold: 0.8,
  voiceLanguage: "fr-FR",
  voiceVolume: 1.0,
  theme: "ironman",
  ghostModeEnabled: false,
  psychProfileEnabled: true,
  savedLocations: {},
};

// FORCE HARDCODED URL - DO NOT CHANGE WITHOUT CHECKING PROXY
const API_BASE = "http://localhost:3001/api/config";

/**
 * Charge settings depuis backend (source of truth)
 * Fallback localStorage si backend fail
 */
export async function loadSettings(): Promise<JarvisSettings> {
  console.log("⚙️ Charge des paramètres depuis:", API_BASE);
  try {
    const response = await fetch(`${API_BASE}/settings`);
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Paramètres chargés du backend:", data);
      return { ...DEFAULT_SETTINGS, ...data };
    } else {
      console.error(
        "❌ Erreur chargement backend:",
        response.status,
        response.statusText,
      );
    }
  } catch (error) {
    console.warn("⚠️ Backend settings unavailable, using localStorage", error);
  }

  // Fallback localStorage
  const stored = localStorage.getItem("jarvis-settings");
  if (stored) {
    try {
      console.log("⚠️ Utilisation du cache localStorage");
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  return DEFAULT_SETTINGS;
}

/**
 * Sauvegarde settings (backend + localStorage)
 * Double persistance pour sécurité
 */
export async function saveSettings(
  settings: Partial<JarvisSettings>,
): Promise<void> {
  const fullSettings = { ...DEFAULT_SETTINGS, ...settings };

  // 1. Backend (prioritaire)
  try {
    const response = await fetch(`${API_BASE}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullSettings),
    });

    if (response.ok) {
      console.log("✅ Settings saved to backend");
    } else {
      throw new Error("Backend save failed");
    }
  } catch (error) {
    console.error("❌ Failed to save to backend:", error);
  }

  // 2. LocalStorage (backup)
  try {
    localStorage.setItem("jarvis-settings", JSON.stringify(fullSettings));
    console.log("💾 Settings backed up to localStorage");
  } catch (error) {
    console.error("❌ Failed to save to localStorage:", error);
  }
}

/**
 * Reset settings (backend + localStorage)
 */
export async function resetSettings(): Promise<void> {
  try {
    await fetch(`${API_BASE}/settings/reset`, { method: "POST" });
    localStorage.removeItem("jarvis-settings");
    console.log("🔄 Settings reset");
  } catch (error) {
    console.error("❌ Failed to reset settings:", error);
  }
}
