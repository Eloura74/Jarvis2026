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
import {
  Mic,
  Send,
  Command,
  MicOff,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { getPredictionsWithScore } from "../services/predictionEngine";

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
  const [predictions, setPredictions] = useState<
    Array<{ command: string; score: number }>
  >([]);
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

  /**
   * Charger prédictions contextuelles au montage et actualiser périodiquement
   */
  useEffect(() => {
    // Chargement initial
    const loadPredictions = () => {
      const preds = getPredictionsWithScore(3); // Top 3 suggestions avec scores
      setPredictions(preds);
    };

    loadPredictions();

    // Actualiser toutes les minutes (prédictions changent selon l'heure)
    const interval = setInterval(loadPredictions, 60000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Exécute une suggestion prédictive
   */
  const executeSuggestion = (command: string) => {
    onSend(command);
    setInput(""); // Clear input
  };

  return (
    // Panneau Tech UI
    <div className="relative w-full max-w-3xl mt-8">
      {/* Connecteurs Latéraux G/D */}
      <div className="absolute top-1/2 -left-4 w-4 h-[2px] bg-cyan-500/30"></div>
      <div className="absolute top-1/2 -right-4 w-4 h-[2px] bg-cyan-500/30"></div>

      {/* Conteneur principal avec Clip-Path */}
      <div className="tech-border-container clip-tech p-[1px]">
        <div className="tech-content clip-tech p-4 relative flex items-center gap-4">
          {/* Background avec texture Hex */}
          <div className="absolute inset-0 bg-hex-pattern opacity-10 pointer-events-none"></div>

          {/* Effet glow rouge pendant l'écoute */}
          <div
            className={`absolute inset-0 bg-red-500/10 transition-opacity duration-500 ${isListening ? "opacity-100" : "opacity-0"}`}
          ></div>

          {/* Icône Statut */}
          <div
            className={`p-3 clip-tech-sm transition-all duration-300 ${isListening ? "bg-red-500/20 animate-pulse" : isProcessing ? "bg-purple-500/20 animate-spin" : "bg-cyan-900/20 border border-cyan-500/30"}`}
          >
            <Command
              className={`w-6 h-6 ${isListening ? "text-red-400" : isProcessing ? "text-purple-400" : "text-cyan-400"}`}
            />
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing || isListening}
            placeholder={
              isListening
                ? "ANALYZING AUDIO INPUT..."
                : isProcessing
                  ? "PROCESSING DATA STREAMS..."
                  : "ENTER COMMAND OR AUTH_KEY..."
            }
            className="flex-1 bg-transparent border-b border-cyan-500/30 focus:border-cyan-400 text-lg py-2 px-2 text-cyan-50 outline-none font-mono placeholder-cyan-800/50 transition-colors disabled:opacity-50 tracking-wider"
          />

          {/* Boutons Actions */}
          <div className="flex gap-2">
            <button
              onClick={onListenToggle}
              disabled={isProcessing}
              className={`p-3 clip-tech-sm transition-all border ${isListening ? "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-cyan-900/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:text-white"}`}
              title="Toggle Voice"
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing || isListening}
              className="p-3 clip-tech-sm bg-cyan-600/80 hover:bg-cyan-500 border border-cyan-400 text-white transition-all shadow-[0_0_15px_rgba(8,145,178,0.5)] disabled:opacity-50 disabled:grayscale"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Indicateur inférieur (ligne décorative) */}
      <div className="absolute -bottom-2 left-10 right-10 h-[2px] bg-cyan-500/20 flex justify-between">
        <div className="w-2 h-2 bg-cyan-500 -mt-[3px]"></div>
        <div className="w-2 h-2 bg-cyan-500 -mt-[3px]"></div>
      </div>

      {/* Panneau Suggestions Prédictives */}
      {predictions.length > 0 && !isProcessing && !isListening && (
        <div className="absolute top-full mt-4 left-0 right-0 animate-fade-in">
          <div className="flex items-center gap-2 mb-2 px-2">
            <Lightbulb className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span className="text-xs text-cyan-400 font-mono tracking-wide">
              SUGGESTIONS CONTEXTUELLES
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {predictions.map((pred, index) => (
              <button
                key={pred.command}
                onClick={() => executeSuggestion(pred.command)}
                className="group flex items-center justify-between p-3 bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border border-cyan-500/30 hover:border-cyan-400 hover:from-cyan-900/40 hover:to-purple-900/40 transition-all duration-300 clip-tech-sm"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  <span className="text-cyan-100 font-mono text-sm tracking-wide">
                    {pred.command}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Score Badge */}
                  <div className="px-2 py-1 bg-cyan-500/20 border border-cyan-400/50 clip-tech-sm">
                    <span className="text-xs text-cyan-300 font-bold">
                      {pred.score}%
                    </span>
                  </div>

                  {/* Indicateur visuel confiance */}
                  <div className="flex gap-0.5">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-3 ${
                          i < Math.ceil(pred.score / 33.3)
                            ? "bg-cyan-400"
                            : "bg-cyan-900/50"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandInput;
