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
import { Wifi, Battery, Cpu, Layers } from "lucide-react";

/**
 * Props du composant BottomHUD
 * @interface BottomHUDProps
 */
interface BottomHUDProps {
  /** Nombre de nodes mémorisés dans la mémoire applicative */
  memoryNodeCount: number;
}

/**
 * Composant affichant les métriques système en bas de l'écran
 *
 * Affiche les indicateurs de performance et de statut du système
 * avec des animations et un style holographique.
 *
 * @param {BottomHUDProps} props - Props du composant
 * @returns {JSX.Element} Barre HUD inférieure
 */
const BottomHUD: React.FC<BottomHUDProps> = ({ memoryNodeCount }) => {
  return (
    // Container principal : fixé en bas, masqué sur mobile
    <div className="absolute bottom-10 w-full px-16 flex justify-between items-end font-mono text-xs text-cyan-600/70 hidden md:flex pointer-events-none z-20">
      {/* Section gauche : Métriques système */}
      <div className="flex gap-12">
        {/* Métrique 1 : Température CPU */}
        <div className="flex flex-col gap-2">
          {/* Label avec icône */}
          <div className="flex items-center gap-2 text-cyan-400">
            <Cpu size={14} /> CORE TEMP
          </div>
          {/* Barre de progression */}
          <div className="h-1 w-32 bg-slate-800 rounded overflow-hidden">
            <div className="h-full bg-cyan-500 w-[42%] animate-pulse"></div>
          </div>
          {/* Valeur affichée */}
          <span className="text-xl text-cyan-300">42°C</span>
        </div>

        {/* Métrique 2 : Mémoire applicative */}
        <div className="flex flex-col gap-2">
          {/* Label avec icône */}
          <div className="flex items-center gap-2 text-purple-400">
            <Layers size={14} /> MEMORY BANK
          </div>
          {/* Barre de progression (65% utilisée) */}
          <div className="h-1 w-32 bg-slate-800 rounded overflow-hidden">
            <div className="h-full bg-purple-500 w-[65%]"></div>
          </div>
          {/* Nombre de nodes mémorisés */}
          <span className="text-xl text-purple-300">
            {memoryNodeCount} NODES
          </span>
        </div>
      </div>

      {/* Section droite : Statut connexion et batterie */}
      <div className="flex gap-4 items-center border border-cyan-900/50 px-4 py-2 rounded bg-black/40 backdrop-blur-sm">
        {/* Connexion réseau (secure, avec icône animée) */}
        <Wifi className="w-4 h-4 text-green-500 animate-pulse" />
        <span>UPLINK: SECURE</span>

        {/* Séparateur vertical */}
        <div className="h-4 w-[1px] bg-cyan-900 mx-2"></div>

        {/* Batterie (100%) */}
        <Battery className="w-4 h-4 text-cyan-500" />
        <span>PWR: 100%</span>
      </div>
    </div>
  );
};

export default BottomHUD;
