/**
 * useAppSettings — Hook centralisé de persistance des paramètres
 *
 * Source of truth : backend JSON (via configService)
 * Fallback : localStorage si le backend est indisponible
 * Expose les settings et une fonction de mise à jour partielle.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  JarvisSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from "../services/configService";

interface UseAppSettingsReturn {
  settings: JarvisSettings;
  isLoaded: boolean;
  updateSettings: (patch: Partial<JarvisSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

export function useAppSettings(): UseAppSettingsReturn {
  const [settings, setSettings] = useState<JarvisSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Ref pour éviter les sauvegardes pendant le chargement initial
  const isInitialLoad = useRef(true);

  // Chargement initial depuis le backend au montage
  useEffect(() => {
    loadSettings()
      .then((loaded) => {
        setSettings(loaded);
        setIsLoaded(true);
        isInitialLoad.current = false;
      })
      .catch(() => {
        setSettings(DEFAULT_SETTINGS);
        setIsLoaded(true);
        isInitialLoad.current = false;
      });
  }, []);

  /**
   * Met à jour partiellement les settings et persiste en backend.
   * @param patch - Champs à modifier (merge avec l'état courant)
   */
  const updateSettings = useCallback(
    async (patch: Partial<JarvisSettings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      await saveSettings(next);
    },
    [settings],
  );

  /**
   * Remet tous les paramètres aux valeurs par défaut.
   */
  const resetToDefaults = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    await saveSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, isLoaded, updateSettings, resetToDefaults };
}
