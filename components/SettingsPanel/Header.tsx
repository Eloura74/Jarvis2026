import React from "react";
import { Settings, X } from "lucide-react";
import { ThemeConfig } from "./types";

interface HeaderProps {
  themeConfig: ThemeConfig;
  onClose: () => void;
}

export const Header: React.FC<HeaderProps> = ({ themeConfig, onClose }) => {
  return (
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
  );
};
