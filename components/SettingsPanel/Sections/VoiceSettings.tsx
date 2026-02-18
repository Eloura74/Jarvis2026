import React from "react";
import { Globe } from "lucide-react";
import { JarvisSettings, ThemeConfig } from "../types";
import { SettingItem } from "../SettingItem";

interface VoiceSettingsProps {
  settings: JarvisSettings;
  setSettings: React.Dispatch<React.SetStateAction<JarvisSettings>>;
  themeConfig: ThemeConfig;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  settings,
  setSettings,
  themeConfig,
}) => {
  return (
    <SettingItem themeConfig={themeConfig} delay={0.2}>
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
            voiceLanguage: e.target.value as JarvisSettings["voiceLanguage"],
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
    </SettingItem>
  );
};
