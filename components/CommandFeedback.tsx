/**
 * Composant de Feedback Visuel des Commandes
 *
 * Affiche une timeline animée de l'exécution des commandes avec :
 * - États visuels par étape (Écoute, Traitement, Exécution, Succès/Erreur)
 * - Animations fluides et particules réactives
 * - Historique des 5 dernières commandes
 * - Temps d'exécution affiché
 *
 * Design inspiré d'Iron Man / JARVIS avec effets holographiques
 */

import React from "react";
import "./CommandFeedback.css";

/** États possibles d'une commande */
export type CommandState =
  | "listening" //  Écoute en cours
  | "processing" //  Traitement IA
  | "searching" //  Recherche app
  | "executing" //  Exécution
  | "success" //  Succès
  | "error"; //  Erreur

/** Informations d'une commande */
export interface CommandInfo {
  id: string;
  text: string;
  state: CommandState;
  startTime: number;
  endTime?: number;
  error?: string;
}

interface CommandFeedbackProps {
  /** Commande en cours d'exécution */
  currentCommand: CommandInfo | null;
  /** Historique des commandes (max 5) */
  history: CommandInfo[];
}

/**
 * Icône et texte selon l'état de la commande
 */
const getStateDisplay = (state: CommandState) => {
  switch (state) {
    case "listening":
      return { icon: "🎤", label: "Écoute...", color: "#00d9ff" };
    case "processing":
      return { icon: "🧠", label: "Traitement IA", color: "#ff00ff" };
    case "searching":
      return { icon: "🔍", label: "Recherche", color: "#ffaa00" };
    case "executing":
      return { icon: "🚀", label: "Exécution", color: "#00ff88" };
    case "success":
      return { icon: "✅", label: "Terminé", color: "#00ff00" };
    case "error":
      return { icon: "❌", label: "Erreur", color: "#ff0000" };
  }
};

/**
 * Calcule le temps d'exécution en ms
 */
const getExecutionTime = (cmd: CommandInfo): number => {
  if (!cmd.endTime) {
    return Date.now() - cmd.startTime;
  }
  return cmd.endTime - cmd.startTime;
};

/**
 * Formate le temps d'exécution
 */
const formatTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

export default function CommandFeedback({
  currentCommand,
  history,
}: CommandFeedbackProps) {
  // Pas de rendu si aucune commande
  if (!currentCommand && history.length === 0) {
    return null;
  }

  return (
    <div className="command-feedback">
      {/* COMMANDE EN COURS */}
      {currentCommand && (
        <div className="current-command">
          <div className="command-header">
            <span className="command-icon">
              {getStateDisplay(currentCommand.state).icon}
            </span>
            <span className="command-text">{currentCommand.text}</span>
          </div>

          <div className="command-timeline">
            {/* États de la timeline */}
            <div
              className={`timeline-step ${currentCommand.state === "listening" ? "active" : "done"}`}
            >
              <div className="step-dot"></div>
              <span className="step-label">Écoute</span>
            </div>

            <div
              className={`timeline-step ${currentCommand.state === "processing" ? "active" : currentCommand.state !== "listening" ? "done" : ""}`}
            >
              <div className="step-dot"></div>
              <span className="step-label">Traitement</span>
            </div>

            <div
              className={`timeline-step ${currentCommand.state === "executing" || currentCommand.state === "searching" ? "active" : currentCommand.state === "success" || currentCommand.state === "error" ? "done" : ""}`}
            >
              <div className="step-dot"></div>
              <span className="step-label">Exécution</span>
            </div>

            <div
              className={`timeline-step ${currentCommand.state === "success" || currentCommand.state === "error" ? "active" : ""}`}
            >
              <div className="step-dot"></div>
              <span className="step-label">
                {currentCommand.state === "error" ? "Erreur" : "Succès"}
              </span>
            </div>
          </div>

          {/* Temps d'exécution */}
          <div className="execution-time">
            {formatTime(getExecutionTime(currentCommand))}
          </div>

          {/* Message d'erreur si applicable */}
          {currentCommand.error && (
            <div className="command-error">{currentCommand.error}</div>
          )}
        </div>
      )}

      {/* HISTORIQUE (collapsed) */}
      {history.length > 0 && (
        <div className="command-history">
          <div className="history-header">Historique récent</div>
          <div className="history-list">
            {history
              .slice(-5)
              .reverse()
              .map((cmd) => {
                const display = getStateDisplay(cmd.state);
                return (
                  <div key={cmd.id} className={`history-item ${cmd.state}`}>
                    <span className="history-icon">{display.icon}</span>
                    <span className="history-text">{cmd.text}</span>
                    <span className="history-time">
                      {formatTime(getExecutionTime(cmd))}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
