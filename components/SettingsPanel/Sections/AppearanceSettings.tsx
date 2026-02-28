import React from "react";
import { Palette } from "lucide-react";
import { JarvisSettings, ThemeConfig } from "../types";
import { SettingItem } from "../SettingItem";
import { getThemeConfig } from "../utils";

interface AppearanceSettingsProps {
  settings: JarvisSettings;
  setSettings: React.Dispatch<React.SetStateAction<JarvisSettings>>;
  themeConfig: ThemeConfig;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  settings,
  setSettings,
  themeConfig,
}) => {
  return (
    <SettingItem themeConfig={themeConfig} delay={0.5}>
      <div className="flex items-center gap-3 mb-3">
        <Palette className={`w-5 h-5 ${themeConfig.primary}`} />
        <span className="font-mono text-sm text-cyan-50">
          Thème de couleurs
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {(["classic", "ironman", "matrix", "copper"] as const).map((theme) => {
          const config = getThemeConfig(theme);
          return (
            <button
              key={theme}
              onClick={() => setSettings((prev) => ({ ...prev, theme }))}
              className={`
                p-3 rounded border-2 transition-all
                ${settings.theme === theme ? config.border + " " + config.bg : "border-slate-700 bg-slate-800/50"}
                hover:scale-105
              `}
            >
              <p className={`font-mono text-xs ${config.primary}`}>
                {config.name}
              </p>
            </button>
          );
        })}
      </div>
    </SettingItem>
  );
};
