/**
 * @fileoverview Composant TopHUD - En-tête du système (Premium V2)
 *
 * Barre supérieure holographique avec branding néon et contrôles interactifs.
 * Utilise les nouvelles classes "btn-premium" et "text-glow".
 *
 * @module components/HUD/TopHUD
 */

import React from "react";
import { Menu, Volume2, Mic, Clock, Settings, VolumeX } from "lucide-react";
import { APP_NAME, VERSION } from "../../constants";

interface TopHUDProps {
  voiceEnabled: boolean;
  onVoiceToggle: () => void;
  onOpenLogs: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  isListening?: boolean;
  onToggleListening?: () => void;
  wakeWordEnabled?: boolean;
  onWakeWordToggle?: () => void;
}

const TopHUD: React.FC<TopHUDProps> = ({
  voiceEnabled,
  onVoiceToggle,
  onOpenLogs,
  onOpenHistory,
  onOpenSettings,
  isListening = false,
  onToggleListening,
  wakeWordEnabled = false,
  onWakeWordToggle,
}) => {
  return (
    <div className="absolute top-0 w-full p-4 z-40 pointer-events-none select-none">
      {/* Top Bar Background avec ClipPath */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"></div>

      <div className="flex justify-between items-start max-w-7xl mx-auto">
        {/* GAUCHE : LOGO & VERSIONING */}
        <div className="pointer-events-auto flex items-start gap-4">
          {/* Logo Hexagonal */}
          <div className="w-12 h-12 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-cyan-500/20 clip-tech-sm animate-pulse"></div>
            <div className="absolute inset-[2px] border border-cyan-400/50 clip-tech-sm"></div>
            <span className="font-bold text-cyan-400 font-mono text-xl">J</span>
          </div>

          <div className="mt-1">
            <h1 className="text-2xl font-bold font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 filter drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
              {APP_NAME}
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-sm shadow-[0_0_5px_emerald]" />
              <p className="text-[10px] text-cyan-500/60 tracking-[0.2em] font-mono uppercase">
                v{VERSION} | OS_ONLINE
              </p>
            </div>
          </div>
        </div>

        {/* DROITE : CONTROLS PANEL */}
        <div className="pointer-events-auto">
          <div className="tech-border-container clip-tech-sm p-[1px]">
            <div className="tech-content clip-tech-sm px-2 py-1 flex items-center gap-1 bg-black/60 backdrop-blur-md">
              {/* BOUTONS SYSTEME */}
              <div className="flex gap-1 pr-3 border-r border-cyan-500/20">
                <button
                  onClick={onOpenHistory}
                  className="p-2 hover:bg-cyan-500/20 text-cyan-400 rounded-sm transition-colors"
                  title="History"
                >
                  <Clock className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenLogs}
                  className="p-2 hover:bg-cyan-500/20 text-cyan-400 rounded-sm transition-colors"
                  title="Logs"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenSettings}
                  className="p-2 hover:bg-cyan-500/20 text-cyan-400 rounded-sm transition-colors group"
                  title="Settings"
                >
                  <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                </button>
              </div>

              {/* BOUTONS AUDIO */}
              <div className="flex gap-1 pl-3">
                {/* Toggle Voice Output */}
                <button
                  onClick={onVoiceToggle}
                  className={`p-2 rounded-sm transition-colors border border-transparent ${!voiceEnabled ? "text-slate-500 hover:text-slate-400" : "text-cyan-400 hover:bg-cyan-500/20 border-cyan-500/30"}`}
                  title={voiceEnabled ? "Mute Output" : "Enable Output"}
                >
                  {voiceEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </button>

                {/* Wake Word Status */}
                {onWakeWordToggle && (
                  <button
                    onClick={onWakeWordToggle}
                    className={`flex items-center gap-2 px-3 py-1 rounded-sm border transition-all ${
                      wakeWordEnabled
                        ? "bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                        : "bg-slate-900/50 border-slate-700 text-slate-500"
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold">
                      AI_WAKE
                    </span>
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${wakeWordEnabled ? "bg-cyan-400 animate-pulse" : "bg-slate-600"}`}
                    />
                  </button>
                )}

                {/* Manual Mic Toggle */}
                {onToggleListening && (
                  <button
                    onClick={onToggleListening}
                    className={`p-2 rounded-sm border transition-all ${
                      isListening
                        ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                        : "bg-transparent border-transparent text-slate-400 hover:text-cyan-400"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Top Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
    </div>
  );
};

export default TopHUD;
