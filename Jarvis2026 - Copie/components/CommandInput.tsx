/**
 * @fileoverview Composant CommandInput - Barre de saisie de commandes avec contrôles vocaux
 *
 * Ce composant fournit l'interface principale pour interagir avec J.A.R.V.I.S. :
 * - Saisie textuelle de commandes (input + bouton send)
 * - Contrôle vocal (bouton micro pour activer/désactiver reconnaissance vocale)
 * - États visuels dynamiques selon le statut système
 *
 * Fonctionnalités :
 * - Input désactivé pendant LISTENING ou PROCESSING
 * - Auto-focus de l'input quand système devient idle
 * - Validation commande : Entrée ou clic sur bouton Send
 * - Effet visuel glow rouge pendant écoute vocale
 * - Icônes animées selon l'état (spin pour processing, pulse pour listening)
 *
 * @module components/CommandInput
 */

import React, { useState, KeyboardEvent, useEffect, useRef } from "react";
import { Mic, Send, Command, MicOff } from "lucide-react";

/**
 * Props du composant CommandInput
 * @interface CommandInputProps
 * @property {Function} onSend - Callback appelée quand l'utilisateur envoie une commande (texte)
 * @property {boolean} isProcessing - Indique si le système est en train de traiter une requête
 * @property {boolean} isListening - Indique si la reconnaissance vocale est active
 * @property {Function} onListenToggle - Callback pour activer/désactiver la reconnaissance vocale
 */
interface CommandInputProps {
  onSend: (cmd: string) => void;
  isProcessing: boolean;
  isListening: boolean;
  onListenToggle: () => void;
}

/**
 * Composant barre de saisie de commandes avec support vocal
 * Fournit une interface unifiée pour les commandes textuelles et vocales.
 *
 * @param {CommandInputProps} props - Props du composant
 * @returns {JSX.Element} Barre de saisie avec boutons micro et send
 */
const CommandInput: React.FC<CommandInputProps> = ({
  onSend,
  isProcessing,
  isListening,
  onListenToggle,
}) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Envoie la commande saisie à l'application parente via onSend
   * Réinitialise l'input après envoi
   * Conditions : texte non vide ET système non en cours de traitement
   */
  const handleSend = () => {
    if (input.trim() && !isProcessing) {
      onSend(input);
      setInput("");
    }
  };

  /**
   * Gère la touche Entrée pour envoyer la commande
   * @param {KeyboardEvent<HTMLInputElement>} e - Event clavier
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  /**
   * Auto-focus de l'input quand le système revient à l'état idle
   * (ni en processing, ni en listening)
   */
  useEffect(() => {
    if (!isProcessing && !isListening) {
      inputRef.current?.focus();
    }
  }, [isProcessing, isListening]);

  return (
    // Panneau principal avec effet verre (glass-panel)
    <div className="glass-panel p-4 rounded-lg mt-4 relative">
      {/* Effet glow rouge pendant l'écoute vocale (fond flou animé) */}
      <div
        className={`absolute inset-0 bg-cyan-500/5 blur-xl rounded-lg pointer-events-none transition-opacity duration-500 ${isListening ? "opacity-100 bg-red-500/10" : "opacity-0"}`}
      ></div>

      {/* Container flex pour aligner icône + input + boutons */}
      <div className="flex items-center gap-4 relative z-10">
        {/* Icône de statut système (gauche) */}
        {/* - LISTENING : fond rouge, pulse */}
        {/* - PROCESSING : fond violet, spin */}
        {/* - IDLE : fond dark gris */}
        <div
          className={`p-3 rounded-full transition-all duration-300 ${isListening ? "bg-red-500/20 animate-pulse" : isProcessing ? "bg-purple-500/20 animate-spin" : "bg-slate-800"}`}
        >
          <Command
            className={`w-6 h-6 ${isListening ? "text-red-400" : isProcessing ? "text-purple-400" : "text-cyan-400"}`}
          />
        </div>

        {/* Input de commande textuelle */}
        {/* Désactivé si en listening ou processing */}
        {/* Placeholder dynamique selon l'état */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing || isListening}
          placeholder={
            isListening
              ? "Listening..."
              : isProcessing
                ? "Processing neural inputs..."
                : "Enter command or speak..."
          }
          className="flex-1 bg-transparent border-b-2 border-slate-700 focus:border-cyan-400 text-lg py-2 px-2 text-white outline-none font-mono placeholder-slate-600 transition-colors disabled:opacity-50"
        />

        {/* Bouton Micro (contrôle reconnaissance vocale) */}
        {/* - Si listening : MicOff (rouge, glow), click = arrêter */}
        {/* - Sinon : Mic (gris), click = démarrer */}
        {/* Désactivé pendant processing */}
        <button
          onClick={onListenToggle}
          disabled={isProcessing}
          className={`p-3 rounded-full transition-all ${isListening ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "hover:bg-slate-700 text-slate-400 hover:text-cyan-400"}`}
          title={isListening ? "Stop Listening" : "Enable Voice Input"}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Bouton Send (envoyer la commande textuelle) */}
        {/* Désactivé si :
                - Input vide
                - En processing
                - En listening (mode vocal actif) */}
        <button
          onClick={handleSend}
          disabled={!input.trim() || isProcessing || isListening}
          className="p-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 rounded-full text-white transition-all shadow-[0_0_15px_rgba(8,145,178,0.5)]"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CommandInput;
