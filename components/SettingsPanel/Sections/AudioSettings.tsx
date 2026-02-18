import React from "react";
import { Volume2 } from "lucide-react";
import { JarvisSettings, ThemeConfig } from "../types";
import { SettingItem } from "../SettingItem";

interface AudioSettingsProps {
  settings: JarvisSettings;
  setSettings: React.Dispatch<React.SetStateAction<JarvisSettings>>;
  themeConfig: ThemeConfig;
}

export const AudioSettings: React.FC<AudioSettingsProps> = ({
  settings,
  setSettings,
  themeConfig,
}) => {
  return (
    <SettingItem themeConfig={themeConfig} delay={0.4}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Volume2 className={`w-5 h-5 ${themeConfig.primary}`} />
          <span className="font-mono text-sm text-cyan-50">Volume Vocal</span>
        </div>
        <span className={`font-mono text-xs ${themeConfig.primary}`}>
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
    </SettingItem>
  );
};
