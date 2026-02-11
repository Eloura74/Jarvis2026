/**
 * @fileoverview Composant TerminalLog - Panneau latéral des logs système
 *
 * Ce composant affiche un panneau coulissant depuis la droite contenant l'historique
 * des logs système de J.A.R.V.I.S. (erreurs, warnings, succès, info).
 *
 * Fonctionnalités :
 * - Panneau latéral coulissant (animate translateX)
 * - Auto-scroll vers le bas quand nouveaux logs arrivent
 * - Limite affichage aux 100 derniers logs (anti-saturation mémoire)
 * - Couleurs différenciées par type de log (rouge=error, jaune=warning, cyan=success, gris=info)
 * - Header avec bouton fermeture (X)
 * - Footer avec message "SECURE CONNECTION ESTABLISHED"
 *
 * @module components/TerminalLog
 */

import React, { useEffect, useRef } from "react";
import { LogEntry } from "../types";
import { X } from "lucide-react";

/**
 * Props du composant TerminalLog
 * @interface TerminalLogProps
 * @property {LogEntry[]} logs - Tableau de tous les logs système
 * @property {boolean} isOpen - Indique si le panneau est ouvert (visible)
 * @property {Function} onClose - Callback appelée quand l'utilisateur ferme le panneau
 */
interface TerminalLogProps {
  logs: LogEntry[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Composant panneau latéral pour afficher les logs système
 * Affiche les 100 derniers logs avec auto-scroll et couleurs conditionnelles.
 *
 * @param {TerminalLogProps} props - Props du composant
 * @returns {JSX.Element} Panneau latéral coulissant avec logs
 */
const TerminalLog: React.FC<TerminalLogProps> = ({ logs, isOpen, onClose }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll vers le bas quand de nouveaux logs arrivent
   * Seulement si le panneau est ouvert
   */
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen]);

  /**
   * Retourne la classe CSS de couleur appropriée selon le type de log
   * @param {string} type - Type du log (error, warning, success, info, etc.)
   * @returns {string} Classe Tailwind pour la couleur du texte
   */
  const getColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-500"; // Rouge pour erreurs
      case "warning":
        return "text-yellow-400"; // Jaune pour warnings
      case "success":
        return "text-cyan-400"; // Cyan pour succès
      default:
        return "text-slate-400"; // Gris pour info/autres
    }
  };

  return (
    // Panneau latéral fixe à droite, pleine hauteur
    // Animation translateX : 0 si ouvert, 100% (hors écran) si fermé
    // backdrop-blur = effet verre flou
    <div
      className={`fixed inset-y-0 right-0 w-80 bg-[#050510]/95 backdrop-blur-xl border-l border-cyan-500/20 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      {/* HEADER : Titre "System Logs" + bouton fermeture */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-cyan-900/10">
        <div className="flex items-center gap-2">
          {/* Indicateur visuel : point cyan pulsant (connexion active) */}
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
          <h3 className="font-bold text-cyan-400 tracking-widest text-sm uppercase">
            System Logs
          </h3>
        </div>

        {/* Bouton fermeture (X) */}
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* CONTENU : Zone scrollable contenant les logs */}
      {/* Limitation aux 100 derniers logs pour éviter saturation mémoire */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-3">
        {logs.slice(-100).map((log) => (
          <div
            key={log.id}
            className="flex flex-col gap-1 border-b border-slate-800/50 pb-2"
          >
            {/* Ligne 1 : Source du log + timestamp (heure uniquement) */}
            <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider">
              <span>{log.source}</span>
              {/* Extraction heure depuis ISO timestamp : "2026-02-01T08:14:25.123Z" -> "08:14:25" */}
              <span>{log.timestamp.split("T")[1].split(".")[0]}</span>
            </div>

            {/* Ligne 2 : Message du log avec couleur selon le type */}
            <span className={`leading-relaxed ${getColor(log.type)}`}>
              {log.message}
            </span>
          </div>
        ))}

        {/* Élément invisible utilisé pour auto-scroll (scrollIntoView) */}
        <div ref={bottomRef} />
      </div>

      {/* FOOTER : Message de statut de connexion */}
      <div className="p-3 border-t border-cyan-500/20 text-[10px] text-center text-slate-600 font-mono">
        SECURE CONNECTION ESTABLISHED
      </div>
    </div>
  );
};

export default TerminalLog;
