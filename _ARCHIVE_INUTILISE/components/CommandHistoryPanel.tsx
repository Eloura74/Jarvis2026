/**
 * CommandHistoryPanel.tsx
 *
 * Panel latéral affichant l'historique des commandes JARVIS.
 * Permet de ré-exécuter, copier ou supprimer des commandes passées.
 *
 * Fonctionnalités :
 * - Liste scrollable des 50 dernières commandes
 * - Détails par commande : texte, statut, temps d'exécution
 * - Bouton "Ré-exécuter" au hover
 * - Animation slide-in depuis la droite
 * - Fermeture avec bouton X ou clic extérieur
 * - Persistance localStorage
 */

import React, { useEffect, useRef } from "react";
import { CommandInfo } from "./CommandFeedback";
import { X, RotateCcw, Copy, Trash2, Clock } from "lucide-react";

interface CommandHistoryPanelProps {
  /** Historique des commandes (max 50) */
  history: CommandInfo[];
  /** Panel est visible ou caché */
  isOpen: boolean;
  /** Callback fermeture panel */
  onClose: () => void;
  /** Callback ré-exécution commande */
  onReExecute: (commandText: string) => void;
  /** Callback suppression historique complet */
  onClearHistory: () => void;
}

/**
 * Panel historique des commandes avec interactions
 */
const CommandHistoryPanel: React.FC<CommandHistoryPanelProps> = ({
  history,
  isOpen,
  onClose,
  onReExecute,
  onClearHistory,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Fermeture au clic extérieur
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Délai pour éviter fermeture immédiate lors ouverture
    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Fermeture avec touche Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  /**
   * Copier texte commande dans le presse-papier
   */
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // TODO: Afficher toast "Copied!" (V2)
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  /**
   * Formater durée d'exécution
   */
  const formatDuration = (startTime: number, endTime?: number): string => {
    if (!endTime) return "En cours...";
    const duration = endTime - startTime;
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  /**
   * Obtenir couleur selon état commande
   */
  const getStateColor = (
    state: CommandInfo["state"],
  ): { bg: string; text: string; border: string } => {
    switch (state) {
      case "listening":
        return {
          bg: "bg-blue-500/10",
          text: "text-blue-400",
          border: "border-blue-500/30",
        };
      case "processing":
        return {
          bg: "bg-yellow-500/10",
          text: "text-yellow-400",
          border: "border-yellow-500/30",
        };
      case "executing":
        return {
          bg: "bg-purple-500/10",
          text: "text-purple-400",
          border: "border-purple-500/30",
        };
      case "success":
        return {
          bg: "bg-green-500/10",
          text: "text-green-400",
          border: "border-green-500/30",
        };
      case "error":
        return {
          bg: "bg-red-500/10",
          text: "text-red-400",
          border: "border-red-500/30",
        };
      default:
        return {
          bg: "bg-slate-500/10",
          text: "text-slate-400",
          border: "border-slate-500/30",
        };
    }
  };

  /**
   * Obtenir icône selon état
   */
  const getStateLabel = (state: CommandInfo["state"]): string => {
    switch (state) {
      case "listening":
        return "Écoute";
      case "processing":
        return "Traitement";
      case "executing":
        return "Exécution";
      case "success":
        return "Succès";
      case "error":
        return "Erreur";
      default:
        return "Inconnu";
    }
  };

  return (
    <>
      {/* Backdrop sombre semi-transparent */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity duration-300" />
      )}

      {/* Panel principal */}
      <div
        ref={panelRef}
        className={`
          fixed top-0 right-0 h-screen w-full max-w-md
          bg-gradient-to-b from-slate-900/95 to-black/95
          backdrop-blur-md border-l border-cyan-500/30
          shadow-2xl shadow-cyan-500/20
          transform transition-transform duration-500 ease-out
          z-[101]
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-mono text-cyan-400 tracking-wider">
              COMMAND HISTORY
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors group"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
          </button>
        </div>

        {/* Stats Header */}
        <div className="px-6 py-3 bg-black/30 border-b border-cyan-500/20">
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono text-cyan-300">
              {history.length} commande(s)
            </span>
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors group"
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="font-mono text-xs">EFFACER TOUT</span>
              </button>
            )}
          </div>
        </div>

        {/* Liste des commandes */}
        <div className="overflow-y-auto h-[calc(100vh-140px)] custom-scrollbar">
          {history.length === 0 ? (
            // État vide
            <div className="flex flex-col items-center justify-center h-full text-cyan-500/50">
              <Clock className="w-16 h-16 mb-4 opacity-30" />
              <p className="font-mono text-sm">Aucune commande enregistrée</p>
            </div>
          ) : (
            // Liste des commandes
            <div className="space-y-3 p-4">
              {history.map((cmd, index) => {
                const colors = getStateColor(cmd.state);

                return (
                  <div
                    key={cmd.id}
                    className={`
                      group relative
                      ${colors.bg} ${colors.border}
                      border rounded-lg p-4
                      transform transition-all duration-300
                      hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10
                      animate-slide-in
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* État et durée */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`${colors.text} font-mono text-xs uppercase tracking-wide`}
                      >
                        {getStateLabel(cmd.state)}
                      </span>
                      <span className="text-cyan-300/60 font-mono text-xs">
                        {formatDuration(cmd.startTime, cmd.endTime)}
                      </span>
                    </div>

                    {/* Texte commande */}
                    <p className="text-cyan-50 font-mono text-sm mb-3 break-words">
                      {cmd.text}
                    </p>

                    {/* Message d'erreur si présent */}
                    {cmd.error && (
                      <p className="text-red-400 font-mono text-xs mb-3 border-l-2 border-red-500 pl-2">
                        {cmd.error}
                      </p>
                    )}

                    {/* Actions (visibles au hover) */}
                    <div
                      className="
                        flex gap-2
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-200
                      "
                    >
                      {/* Ré-exécuter */}
                      {cmd.state !== "listening" && (
                        <button
                          onClick={() => onReExecute(cmd.text)}
                          className="
                            flex items-center gap-1.5 px-3 py-1.5
                            bg-cyan-500/20 hover:bg-cyan-500/30
                            border border-cyan-500/40
                            rounded text-cyan-300 hover:text-cyan-200
                            font-mono text-xs
                            transition-all duration-200
                            hover:scale-105
                          "
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Ré-exécuter
                        </button>
                      )}

                      {/* Copier */}
                      <button
                        onClick={() => handleCopy(cmd.text)}
                        className="
                          flex items-center gap-1.5 px-3 py-1.5
                          bg-slate-700/50 hover:bg-slate-700/70
                          border border-slate-600/50
                          rounded text-slate-300 hover:text-slate-200
                          font-mono text-xs
                          transition-all duration-200
                          hover:scale-105
                        "
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copier
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Styles personnalisés */}
      <style>
        {`
          @keyframes slide-in {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .animate-slide-in {
            animation: slide-in 0.3s ease-out;
          }

          /* Scrollbar personnalisée */
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.3);
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0, 217, 255, 0.3);
            border-radius: 4px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 217, 255, 0.5);
          }
        `}
      </style>
    </>
  );
};

export default CommandHistoryPanel;
