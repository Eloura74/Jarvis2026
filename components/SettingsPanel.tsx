/**
 * SettingsPanel.tsx
 *
 * Panel de configuration de JARVIS permettant de personnaliser l'expérience.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { JarvisSettings, DEFAULT_SETTINGS } from "./SettingsPanel/types";
import { getThemeConfig } from "./SettingsPanel/utils";
import { Header } from "./SettingsPanel/Header";
import { WakeWordSettings } from "./SettingsPanel/Sections/WakeWordSettings";
import { VoiceSettings } from "./SettingsPanel/Sections/VoiceSettings";
import { AudioSettings } from "./SettingsPanel/Sections/AudioSettings";
import { AppearanceSettings } from "./SettingsPanel/Sections/AppearanceSettings";
import { ResetSection } from "./SettingsPanel/Sections/ResetSection";

// Re-export type for compatibility
export type { JarvisSettings } from "./SettingsPanel/types";

/** Props du composant */
interface SettingsPanelProps {
  /** Panel visible */
  isOpen: boolean;
  /** Callback fermeture */
  onClose: () => void;
  /** Callback changement settings */
  onSettingsChange: (settings: JarvisSettings) => void;
  /** Settings actuels */
  currentSettings?: JarvisSettings;
}

/**
 * Panel de configuration JARVIS
 */
const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  onSettingsChange,
  currentSettings,
}) => {
  const [settings, setSettings] = useState<JarvisSettings>(
    currentSettings || DEFAULT_SETTINGS,
  );

  // Charger settings depuis localStorage au montage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("jarvis_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        onSettingsChange(parsed);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }, []);

  // Sauvegarder settings dans localStorage à chaque modification
  useEffect(() => {
    try {
      localStorage.setItem("jarvis_settings", JSON.stringify(settings));
      onSettingsChange(settings);
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  }, [settings, onSettingsChange]);

  /**
   * Réinitialiser tous les paramètres
   */
  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem("jarvis_settings");
  };

  const themeConfig = getThemeConfig(settings.theme);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Panel Modal Style Tech UI */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none"
          >
            <div className="w-full max-w-lg pointer-events-auto">
              <div className="tech-border-container clip-tech p-[1px]">
                <div className="tech-content clip-tech max-h-[80vh] overflow-y-auto bg-black/90">
                  {/* Header */}
                  <Header themeConfig={themeConfig} onClose={onClose} />

                  {/* Settings Content */}
                  <div className="p-6 space-y-6">
                    <WakeWordSettings
                      settings={settings}
                      setSettings={setSettings}
                      themeConfig={themeConfig}
                    />

                    <VoiceSettings
                      settings={settings}
                      setSettings={setSettings}
                      themeConfig={themeConfig}
                    />

                    <AudioSettings
                      settings={settings}
                      setSettings={setSettings}
                      themeConfig={themeConfig}
                    />

                    <AppearanceSettings
                      settings={settings}
                      setSettings={setSettings}
                      themeConfig={themeConfig}
                    />

                    <ResetSection
                      onReset={handleReset}
                      themeConfig={themeConfig}
                    />
                  </div>

                  {/* Footer Info */}
                  <div className="px-6 py-4 border-t border-cyan-500/20">
                    <p className="text-xs text-cyan-500/40 font-mono text-center">
                      Paramètres sauvegardés automatiquement
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
