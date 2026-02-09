/**
 * @fileoverview Composant TopHUD - En-tête du système
 *
 * Affiche la barre supérieure de l'interface J.A.R.V.I.S. contenant :
 * - Le nom du système et la version
 * - Le bouton toggle vocal
 * - Le bouton d'ouverture des logs système
 *
 * @module components/HUD/TopHUD
 */

import React from "react";
import { Menu, Volume2, Mic, Clock } from "lucide-react";
import { APP_NAME, VERSION } from "../../constants";

/**
 * Props du composant TopHUD
 * @interface TopHUDProps
 */
interface TopHUDProps {
  /** État actuel de l'audio vocal (activé/désactivé) */
  voiceEnabled: boolean;
  /** Callback appelée quand l'utilisateur toggle le son */
  onVoiceToggle: () => void;
  /** Callback appelée quand l'utilisateur ouvre le panneau de logs */
  onOpenLogs: () => void;
  /** Callback appelée quand l'utilisateur ouvre l'historique des commandes */
  onOpenHistory: () => void;
  /** État du wake word (activé/désactivé) */
  wakeWordEnabled?: boolean;
  /** Callback appelée quand l'utilisateur toggle le wake word */
  onWakeWordToggle?: () => void;
}

/**
 * Composant affichant la barre supérieure du HUD
 *
 * Contient le branding, les contrôles audio et l'accès aux logs système.
 *
 * @param {TopHUDProps} props - Props du composant
 * @returns {JSX.Element} Barre HUD supérieure
 */
const TopHUD: React.FC<TopHUDProps> = ({
  voiceEnabled,
  onVoiceToggle,
  onOpenLogs,
  onOpenHistory,
  wakeWordEnabled = false,
  onWakeWordToggle,
}) => {
  return (
    // Container principal : flex horizontal, espacement entre les éléments
    <div className="absolute top-0 w-full p-6 flex justify-between items-start z-40">
      {/* Section gauche : Nom du système + version */}
      <div>
        <h1 className="text-4xl font-bold font-mono tracking-tighter text-cyan-500 neon-text mix-blend-screen">
          {APP_NAME}
        </h1>
        <p className="text-[10px] text-cyan-700 tracking-[0.5em] font-mono mt-1 ml-1">
          {VERSION} // ONLINE
        </p>
      </div>

      {/* Section droite : Boutons de contrôle */}
      <div className="flex gap-4">
        {/* Toggle vocal : change d'apparence selon l'état */}
        <button
          onClick={onVoiceToggle}
          className={`p-3 border border-cyan-500/30 rounded-full transition-all backdrop-blur-md ${
            voiceEnabled
              ? "bg-cyan-500/20 text-cyan-400"
              : "bg-transparent text-slate-600"
          }`}
          aria-label={voiceEnabled ? "Désactiver audio" : "Activer audio"}
        >
          <Volume2 className="w-5 h-5" />
        </button>

        {/* Bouton ouverture logs système */}
        <button
          onClick={onOpenLogs}
          className="p-3 border border-cyan-500/30 bg-cyan-900/10 rounded-full hover:bg-cyan-500/20 transition-all text-cyan-400 backdrop-blur-md"
          aria-label="Ouvrir logs système"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Bouton historique des commandes */}
        <button
          onClick={onOpenHistory}
          className="p-3 border border-cyan-500/30 bg-cyan-900/10 rounded-full hover:bg-cyan-500/20 transition-all text-cyan-400 backdrop-blur-md"
          aria-label="Ouvrir historique commandes"
          title="Historique des commandes"
        >
          <Clock className="w-5 h-5" />
        </button>

        {/* Toggle Wake Word : "Hey JARVIS" */}
        {onWakeWordToggle && (
          <button
            onClick={onWakeWordToggle}
            className={`p-3 border rounded-full transition-all backdrop-blur-md relative ${
              wakeWordEnabled
                ? "bg-cyan-500/30 text-cyan-300 border-cyan-400 animate-pulse"
                : "bg-transparent text-slate-600 border-cyan-500/30"
            }`}
            aria-label={
              wakeWordEnabled ? "Désactiver wake word" : "Activer wake word"
            }
            title={
              wakeWordEnabled ? '"Hey JARVIS" activé' : "Activer wake word"
            }
          >
            <Mic className="w-5 h-5" />
            {wakeWordEnabled && (
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] text-cyan-400 whitespace-nowrap uppercase tracking-wider">
                Listening
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default TopHUD;
