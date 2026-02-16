/**
 * Hook React pour config persistante
 * Sync backend + localStorage
 */

import { useState, useEffect } from "react";
import {
  loadSettings,
  saveSettings,
  JarvisSettings,
} from "../services/configService";

export function usePersistedConfig() {
  const [settings, setSettings] = useState<JarvisSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chargement initial
  useEffect(() => {
    loadSettings()
      .then((data) => {
        setSettings(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  // Fonction update (auto-save)
  const updateSettings = async (updates: Partial<JarvisSettings>) => {
    if (!settings) return;

    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    try {
      await saveSettings(newSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  return {
    settings,
    updateSettings,
    isLoading,
    error,
  };
}
