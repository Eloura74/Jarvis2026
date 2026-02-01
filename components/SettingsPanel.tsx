/**
 * SettingsPanel.tsx
 *
 * Panel de configuration de JARVIS permettant de personnaliser l'expérience.
 *
 * Fonctionnalités :
 * - Toggle wake word activation
 * - Sélection langue reconnaissance vocale
 * - Seuil de confiance wake word (slider)
 * - Volume synthèse vocale (slider)
 * - Thèmes de couleurs (présets)
 * - Réinitialisation paramètres
 * - Persistance localStorage
 */

import React, { useState, useEffect } from "react";
import {
  Settings,
  X,
  Volume2,
  Mic,
  Palette,
  Globe,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/** Configuration utilisateur persistante */
export interface JarvisSettings {
  /** Wake word activé */
  wakeWordEnabled: boolean;
  /** Langue reconnaissance vocale */
  voiceLanguage: "fr-FR" | "en-US" | "en-GB";
  /** Seuil confiance wake word (0-1) */
  wakeWordThreshold: number;
  /** Volume synthèse vocale (0-1) */
  voiceVolume: number;
  /** Thème de couleurs */
  theme: "classic" | "ironman" | "matrix";
}

/** Paramètres par défaut */
const DEFAULT_SETTINGS: JarvisSettings = {
  wakeWordEnabled: false,
  voiceLanguage: "fr-FR",
  wakeWordThreshold: 0.6,
  voiceVolume: 1.0,
  theme: "classic",
};

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

  /**
   * Obtenir configuration thème
   */
  const getThemeConfig = (theme: JarvisSettings["theme"]) => {
    switch (theme) {
      case "ironman":
        return {
          name: "Iron Man",
          primary: "text-yellow-400",
          border: "border-yellow-500/30",
          bg: "bg-yellow-500/10",
        };
      case "matrix":
        return {
          name: "Matrix",
          primary: "text-green-400",
          border: "border-green-500/30",
          bg: "bg-green-500/10",
        };
      default:
        return {
          name: "Classic",
          primary: "text-cyan-400",
          border: "border-cyan-500/30",
          bg: "bg-cyan-500/10",
        };
    }
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
                  <div
                    className={`flex items-center justify-between px-6 py-4 border-b ${themeConfig.border}`}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className={`w-6 h-6 ${themeConfig.primary}`} />
                      <h2
                        className={`text-xl font-mono ${themeConfig.primary} tracking-wider`}
                      >
                        PARAMÈTRES
                      </h2>
                    </div>

                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors group"
                      aria-label="Fermer"
                    >
                      <X
                        className={`w-5 h-5 ${themeConfig.primary} group-hover:text-cyan-300`}
                      />
                    </button>
                  </div>

                  {/* Settings Content */}
                  <div className="p-6 space-y-6">
                    {/* Wake Word */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className={`p-4 rounded-lg border ${themeConfig.border} ${themeConfig.bg}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Mic className={`w-5 h-5 ${themeConfig.primary}`} />
                          <span className="font-mono text-sm text-cyan-50">
                            Wake Word "JARVIS"
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              wakeWordEnabled: !prev.wakeWordEnabled,
                            }))
                          }
                          className={`
                      relative w-12 h-6 rounded-full transition-colors
                      ${settings.wakeWordEnabled ? "bg-cyan-500" : "bg-slate-600"}
                    `}
                        >
                          <span
                            className={`
                        absolute top-1 left-1 w-4 h-4 rounded-full bg-white
                        transition-transform duration-200
                        ${settings.wakeWordEnabled ? "translate-x-6" : "translate-x-0"}
                      `}
                          />
                        </button>
                      </div>
                      <p className="text-xs text-cyan-500/60 font-mono">
                        Activer l'écoute continue pour "Hey JARVIS"
                      </p>
                    </motion.div>

                    {/* Langue */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className={`p-4 rounded-lg border ${themeConfig.border} ${themeConfig.bg}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Globe className={`w-5 h-5 ${themeConfig.primary}`} />
                        <span className="font-mono text-sm text-cyan-50">
                          Langue de reconnaissance
                        </span>
                      </div>
                      <select
                        value={settings.voiceLanguage}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            voiceLanguage: e.target
                              .value as JarvisSettings["voiceLanguage"],
                          }))
                        }
                        className={`
                    w-full px-3 py-2 rounded
                    bg-black/50 border ${themeConfig.border}
                    text-cyan-50 font-mono text-sm
                    focus:outline-none focus:border-cyan-400
                    transition-colors
                  `}
                      >
                        <option value="fr-FR">🇫🇷 Français</option>
                        <option value="en-US">🇺🇸 English (US)</option>
                        <option value="en-GB">🇬🇧 English (UK)</option>
                      </select>
                    </motion.div>

                    {/* Seuil Confiance Wake Word */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className={`p-4 rounded-lg border ${themeConfig.border} ${themeConfig.bg}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-sm text-cyan-50">
                          Sensibilité Wake Word
                        </span>
                        <span
                          className={`font-mono text-xs ${themeConfig.primary}`}
                        >
                          {Math.round(settings.wakeWordThreshold * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={settings.wakeWordThreshold}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            wakeWordThreshold: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full accent-cyan-500"
                      />
                      <p className="text-xs text-cyan-500/60 font-mono mt-2">
                        Plus élevé = plus précis, moins de faux positifs
                      </p>
                    </motion.div>

                    {/* Volume */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className={`p-4 rounded-lg border ${themeConfig.border} ${themeConfig.bg}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Volume2
                            className={`w-5 h-5 ${themeConfig.primary}`}
                          />
                          <span className="font-mono text-sm text-cyan-50">
                            Volume Vocal
                          </span>
                        </div>
                        <span
                          className={`font-mono text-xs ${themeConfig.primary}`}
                        >
                          {Math.round(settings.voiceVolume * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.voiceVolume}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            voiceVolume: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full accent-cyan-500"
                      />
                    </motion.div>

                    {/* Thème */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className={`p-4 rounded-lg border ${themeConfig.border} ${themeConfig.bg}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Palette className={`w-5 h-5 ${themeConfig.primary}`} />
                        <span className="font-mono text-sm text-cyan-50">
                          Thème de couleurs
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(["classic", "ironman", "matrix"] as const).map(
                          (theme) => {
                            const config = getThemeConfig(theme);
                            return (
                              <button
                                key={theme}
                                onClick={() =>
                                  setSettings((prev) => ({ ...prev, theme }))
                                }
                                className={`
                          p-3 rounded border-2 transition-all
                          ${settings.theme === theme ? config.border + " " + config.bg : "border-slate-700 bg-slate-800/50"}
                          hover:scale-105
                        `}
                              >
                                <p
                                  className={`font-mono text-xs ${config.primary}`}
                                >
                                  {config.name}
                                </p>
                              </button>
                            );
                          },
                        )}
                      </div>
                    </motion.div>

                    {/* Bouton Reset */}
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      onClick={handleReset}
                      className={`
                  w-full flex items-center justify-center gap-2
                  px-4 py-3 rounded-lg border ${themeConfig.border}
                  bg-red-500/10 hover:bg-red-500/20
                  text-red-400 hover:text-red-300
                  font-mono text-sm
                  transition-all duration-200
                  group
                `}
                    >
                      <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                      RÉINITIALISER PARAMÈTRES
                    </motion.button>
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
