import React from "react";
import { Mic } from "lucide-react";
import { JarvisSettings, ThemeConfig } from "../types";
import { SettingItem } from "../SettingItem";

interface WakeWordSettingsProps {
  settings: JarvisSettings;
  setSettings: React.Dispatch<React.SetStateAction<JarvisSettings>>;
  themeConfig: ThemeConfig;
}

export const WakeWordSettings: React.FC<WakeWordSettingsProps> = ({
  settings,
  setSettings,
  themeConfig,
}) => {
  return (
    <>
      <SettingItem themeConfig={themeConfig} delay={0.1}>
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
      </SettingItem>

      <SettingItem themeConfig={themeConfig} delay={0.3}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-sm text-cyan-50">
            Sensibilité Wake Word
          </span>
          <span className={`font-mono text-xs ${themeConfig.primary}`}>
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
      </SettingItem>
    </>
  );
};
