/**
 * @fileoverview Composant BottomHUD - Métriques système et statut
 *
 * Affiche la barre inférieure du HUD J.A.R.V.I.S. contenant :
 * - Les métriques système (température CPU, mémoire utilisée)
 * - Le statut de connexion réseau
 * - Le niveau de batterie
 *
 * @module components/HUD/BottomHUD
 */

import React from "react";
import { Cpu, Wifi, Activity, Zap } from "lucide-react";

/**
 * Composant Helper pour les barres de progression segmentées "Tech"
 */
const TechBar: React.FC<{ value: number; color: string; count?: number }> = ({
  value,
  color,
  count = 10,
}) => {
  return (
    <div className="flex gap-[2px] h-1.5 mt-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 rounded-[1px] ${
            i / count < value / 100 ? color : "bg-slate-800"
          }`}
        />
      ))}
    </div>
  );
};

const BottomHUD: React.FC = () => {
  return (
    <div className="absolute bottom-0 w-full p-6 flex justify-between items-end z-40 pointer-events-none select-none">
      {/* GAUCHE : SYSTEM STATUS */}
      <div className="pointer-events-auto flex items-end gap-2">
        <div className="tech-border-container clip-tech-sm p-[1px]">
          <div className="tech-content clip-tech-sm px-6 py-3 flex gap-8">
            {/* CPU */}
            <div className="flex flex-col min-w-[100px]">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Cpu size={14} />
                  <span className="text-[10px] tracking-widest font-mono">
                    CPU_CORE
                  </span>
                </div>
                <span className="text-sm font-bold font-mono text-cyan-300">
                  34%
                </span>
              </div>
              <TechBar value={34} color="bg-cyan-400 shadow-[0_0_5px_cyan]" />
            </div>

            {/* MEMORY */}
            <div className="flex flex-col min-w-[100px]">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 text-purple-400">
                  <Activity size={14} />
                  <span className="text-[10px] tracking-widest font-mono">
                    MEM_ALLOC
                  </span>
                </div>
                <span className="text-sm font-bold font-mono text-purple-300">
                  12.4G
                </span>
              </div>
              <TechBar
                value={60}
                color="bg-purple-400 shadow-[0_0_5px_purple]"
              />
            </div>
          </div>
        </div>
        {/* Decoration Ligne Connecteur */}
        <div className="h-[2px] w-12 bg-cyan-500/20 mb-4"></div>
      </div>

      {/* CENTRE : SCAN LINE DECO (Non intrusive) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
        <div className="w-64 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        <div className="text-[8px] tracking-[1em] text-cyan-500 font-mono">
          SYSTEM_READY
        </div>
      </div>

      {/* DROITE : NETWORK & POWER */}
      <div className="pointer-events-auto flex items-end gap-2">
        {/* Decoration Ligne Connecteur */}
        <div className="h-[2px] w-12 bg-cyan-500/20 mb-4"></div>

        <div className="tech-border-container clip-tech-sm p-[1px]">
          <div className="tech-content clip-tech-sm px-6 py-3 flex gap-8">
            {/* NETWORK */}
            <div className="flex flex-col min-w-[100px] items-end">
              <div className="flex justify-between items-center gap-4 mb-1 w-full">
                <span className="text-sm font-bold font-mono text-emerald-300">
                  540 MB/s
                </span>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="text-[10px] tracking-widest font-mono">
                    NET_LINK
                  </span>
                  <Wifi size={14} />
                </div>
              </div>
              <TechBar
                value={85}
                color="bg-emerald-400 shadow-[0_0_5px_emerald]"
              />
            </div>

            {/* POWER */}
            <div className="flex flex-col min-w-[100px] items-end">
              <div className="flex justify-between items-center gap-4 mb-1 w-full">
                <span className="text-sm font-bold font-mono text-yellow-300">
                  98%
                </span>
                <div className="flex items-center gap-2 text-yellow-400">
                  <span className="text-[10px] tracking-widest font-mono">
                    PWR_LVL
                  </span>
                  <Zap size={14} />
                </div>
              </div>
              <TechBar
                value={98}
                color="bg-yellow-400 shadow-[0_0_5px_yellow]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomHUD;
