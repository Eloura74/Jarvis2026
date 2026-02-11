/**
 * PremiumLayout - Layout JARVIS Authentique (Style Iron Man)
 * Interface minimaliste fidèle au film avec HUD circulaire
 */

import React, { useState } from "react";
import { JarvisHUDAuthentic } from "./JarvisHUDAuthentic";
import { JarvisCinematicBackground } from "./JarvisCinematicBackground";
import { AudioWave } from "./AudioWave";
import { CircularVisualizer } from "./CircularVisualizer";
import { LoadingOverlay } from "./LoadingOverlay";
import { SuccessRipple } from "./SuccessRipple";
import { AppPathsManager } from "./AppPathsManager";

interface PremiumLayoutProps {
  // HUD status
  status: "idle" | "listening" | "processing" | "speaking";

  // Stats
  commandCount: number;
  cpuUsage?: number;
  memoryUsage?: string;

  // Command
  onMicrophoneClick: () => void;
  isListening: boolean;

  // Logs
  logs: Array<{
    source: string;
    message: string;
    type: "info" | "success" | "error" | "warning";
  }>;

  // Loading/Success
  isProcessing: boolean;
  processingMessage?: string;
  successTrigger: number;
}

export const PremiumLayout: React.FC<PremiumLayoutProps> = ({
  status,
  commandCount,
  cpuUsage = 0,
  memoryUsage = "0 GB",
  onMicrophoneClick,
  isListening,
  logs,
  isProcessing,
  processingMessage,
  successTrigger,
}) => {
  // État pour gérer l'ouverture du panneau de configuration des applications
  const [isAppPathsOpen, setIsAppPathsOpen] = useState(false);
  const currentTime = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const currentDate = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-black">
      {/* ========================================
          ARRIÈRE-PLAN CINÉMATIQUE
          ======================================== */}
      <JarvisCinematicBackground />

      {/* ========================================
          EFFETS DE FOND
          ======================================== */}
      <div className="jarvis-scanlines" />
      <div className="jarvis-vignette" />

      {/* ========================================
          HUD CENTRAL AUTHENTIQUE (Non-interactif)
          ======================================== */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20">
        {/* Glow intense derrière le HUD - AMÉLIORÉ */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-96 h-96 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255, 215, 0, 0.25) 0%, rgba(0, 229, 255, 0.15) 40%, transparent 70%)",
              filter: "blur(50px)",
              animation: "pulse 3s ease-in-out infinite",
            }}
          />
        </div>

        {/* Mini-cercles décoratifs autour du HUD - Plus éloignés */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[45, 135, 225, 315].map((angle) => (
            <div
              key={angle}
              className="absolute"
              style={{
                transform: `rotate(${angle}deg) translateY(-360px)`,
                width: "30px",
                height: "30px",
              }}
            >
              <div
                className="jarvis-circle w-full h-full"
                style={{
                  borderColor: "#00e5ff",
                  boxShadow: "0 0 10px rgba(0, 229, 255, 0.5)",
                  opacity: 0.5,
                }}
              />
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 jarvis-dot"
                style={{ width: "4px", height: "4px" }}
              />
            </div>
          ))}
        </div>

        <JarvisHUDAuthentic status={status} size={550} showDetails={true} />
      </div>

      {/* ========================================
          STATS PÉRIPHÉRIQUES (Style authentique)
          ======================================== */}

      {/* Coin supérieur gauche - Système - ENRICHI */}
      <div className="fixed top-8 left-8 w-72 z-30">
        <div
          className="jarvis-panel-corners p-5"
          style={{
            boxShadow: "0 0 20px rgba(0, 229, 255, 0.3)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="jarvis-marker w-4" />
            <div className="jarvis-label">SYSTEM STATUS</div>
            <div className="flex-1" />
            <div className="jarvis-dot-pulse" />
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span
              className="jarvis-text"
              style={{
                fontSize: "42px",
                fontWeight: 300,
                textShadow: "0 0 10px rgba(0, 229, 255, 0.6)",
              }}
            >
              {cpuUsage}
            </span>
            <span className="jarvis-data">%</span>
          </div>

          <div className="jarvis-progress mb-4" style={{ height: "6px" }}>
            <div
              className="jarvis-progress-bar"
              style={{
                width: `${cpuUsage}%`,
                boxShadow: "0 0 10px rgba(0, 229, 255, 0.8)",
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="jarvis-data">CPU LOAD</span>
              <span className="jarvis-text" style={{ fontSize: "12px" }}>
                {cpuUsage}%
              </span>
            </div>
            {/* Mini-graphique CPU */}
            <div className="flex gap-1 h-8">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-cyan-500/20"
                  style={{
                    height: `${Math.random() * 100}%`,
                    alignSelf: "flex-end",
                    boxShadow: "0 0 5px rgba(0, 229, 255, 0.4)",
                  }}
                />
              ))}
            </div>

            <div className="jarvis-line-h" />
            <div className="flex justify-between items-center">
              <span className="jarvis-data">MEMORY</span>
              <span className="jarvis-text" style={{ fontSize: "12px" }}>
                {memoryUsage}
              </span>
            </div>
            <div className="jarvis-line-h" />
            <div className="flex justify-between items-center">
              <span className="jarvis-data">PROCESSES</span>
              <span className="jarvis-text" style={{ fontSize: "12px" }}>
                24
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Coin supérieur droit - Commandes - ENRICHI */}
      <div className="fixed top-8 right-8 w-72 z-30">
        <div
          className="jarvis-panel-corners p-5"
          style={{
            boxShadow: "0 0 20px rgba(0, 229, 255, 0.3)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="jarvis-marker w-4" />
            <div className="jarvis-label">ACTIVITY LOG</div>
          </div>

          <div
            className="jarvis-text mb-2"
            style={{
              fontSize: "42px",
              fontWeight: 300,
              textShadow: "0 0 10px rgba(0, 229, 255, 0.6)",
            }}
          >
            {commandCount}
          </div>

          <div className="jarvis-data mb-4">TOTAL COMMANDS</div>

          {/* Cercles de progression */}
          <div className="flex gap-4 mb-4 justify-center">
            {[60, 80, 45].map((percent, i) => (
              <div key={i} className="relative w-12 h-12">
                <svg className="transform -rotate-90 w-full h-full">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="rgba(0, 229, 255, 0.2)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#00e5ff"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 20 * (1 - percent / 100)
                    }`}
                    style={{
                      filter: "drop-shadow(0 0 5px rgba(0, 229, 255, 0.8))",
                    }}
                  />
                </svg>
                <div
                  className="absolute inset-0 flex items-center justify-center jarvis-data"
                  style={{ fontSize: "9px" }}
                >
                  {percent}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="jarvis-dot" />
                <span className="jarvis-data">VOICE</span>
              </div>
              <span className="jarvis-text" style={{ fontSize: "12px" }}>
                ACTIVE
              </span>
            </div>
            <div className="jarvis-line-h" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={
                    status !== "idle" ? "jarvis-dot-pulse" : "jarvis-dot"
                  }
                />
                <span className="jarvis-data">STATUS</span>
              </div>
              <span className="jarvis-text" style={{ fontSize: "12px" }}>
                {status.toUpperCase()}
              </span>
            </div>
            <div className="jarvis-line-h" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="jarvis-dot" />
                <span className="jarvis-data">AI MODEL</span>
              </div>
              <span className="jarvis-text" style={{ fontSize: "12px" }}>
                GEMINI
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Coin inférieur gauche - Time & Status */}
      <div className="fixed bottom-8 left-8 w-64 z-30">
        <div className="jarvis-panel-corners p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="jarvis-marker w-4" />
            <div className="jarvis-label">LOCAL TIME</div>
          </div>
          <div
            className="jarvis-text mb-2"
            style={{ fontSize: "28px", fontWeight: 300 }}
          >
            {currentTime}
          </div>
          <div className="jarvis-data mb-4">{currentDate.toUpperCase()}</div>

          <div className="jarvis-line-h mb-3" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="jarvis-data">TIMEZONE</span>
              <span className="jarvis-text" style={{ fontSize: "11px" }}>
                UTC+1
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="jarvis-data">UPTIME</span>
              <span className="jarvis-text" style={{ fontSize: "11px" }}>
                24H 37M
              </span>
            </div>
            
            {/* Bouton Config Applications */}
            <div className="jarvis-line-h my-3" />
            <button
              onClick={() => setIsAppPathsOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 jarvis-button text-xs"
              style={{
                borderColor: '#00e5ff',
                boxShadow: '0 0 10px rgba(0, 229, 255, 0.4)'
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              <span>CONFIG APPS</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================
          LOGO J.A.R.V.I.S 3D EN HAUT - AMÉLIORÉ
          ======================================== */}
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-40 text-center">
        <div className="relative">
          {/* Effet de glow doré derrière le texte - RENFORCÉ */}
          <div
            className="absolute inset-0 blur-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, rgba(255, 215, 0, 0.3) 50%, transparent 70%)",
              transform: "scale(2)",
            }}
          />

          {/* Deuxième couche de glow cyan */}
          <div
            className="absolute inset-0 blur-xl"
            style={{
              background:
                "radial-gradient(circle, rgba(0, 229, 255, 0.3) 0%, transparent 60%)",
              transform: "scale(1.8)",
            }}
          />

          {/* Logo principal */}
          <div className="relative">
            <h1
              className="text-7xl font-bold tracking-wider"
              style={{
                fontFamily: "Rajdhani, sans-serif",
                color: "#ffd700",
                textShadow: `
                0 0 30px rgba(255, 215, 0, 1),
                0 0 50px rgba(255, 215, 0, 0.8),
                0 0 70px rgba(255, 215, 0, 0.6),
                0 0 100px rgba(0, 229, 255, 0.4),
                2px 2px 6px rgba(0, 0, 0, 0.9)
              `,
                letterSpacing: "0.3em",
                filter: "brightness(1.2)",
              }}
            >
              J.A.R.V.I.S.
            </h1>
            {/* Lignes décoratives sous le logo */}
            <div className="flex items-center justify-center gap-3 mt-3 mb-2">
              <div className="jarvis-line-h w-16" />
              <div
                className="jarvis-dot-pulse"
                style={{ boxShadow: "0 0 10px rgba(255, 215, 0, 0.8)" }}
              />
              <div className="jarvis-line-h w-16" />
            </div>
            <p
              className="jarvis-data mt-2"
              style={{
                letterSpacing: "0.5em",
                opacity: 0.8,
                textShadow: "0 0 10px rgba(0, 229, 255, 0.6)",
              }}
            >
              JUST A RATHER VERY INTELLIGENT SYSTEM
            </p>
          </div>
        </div>
      </div>

      {/* ========================================
          ONDE AUDIO (Quand on parle) - CENTRÉE
          ======================================== */}
      {isListening && (
        <div className="fixed top-3/4 left-1/3 w-2/3 max-w-2xl h-24 z-15 pointer-events-none">
          <AudioWave isActive={isListening} color="#ffd700" />
        </div>
      )}

      {/* ========================================
          LOGS SYSTÈME (Centre droite)
          ======================================== */}
      <div className="fixed top-32 right-1/6 w-80 max-h-56 z-30">
        <div className="jarvis-panel-corners p-5">
          <div className="relative">
            {/* Scan line */}
            <div className="jarvis-scan-line" />

            {/* Header */}
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="jarvis-marker w-4" />
              <div className="jarvis-text">SYSTEM LOGS</div>
              <div className="flex-1 jarvis-line-h" />
              <div className="jarvis-data">TOTAL: {logs.length}</div>
              <div className="jarvis-status-indicator" />
            </div>

            {/* Logs */}
            <div className="space-y-1 relative z-10 max-h-40 overflow-y-auto">
              {logs.slice(-6).map((log, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 animate-slideInUp"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="jarvis-marker w-2 mt-0.5" />
                  <span className="jarvis-data w-20 flex-shrink-0 opacity-60">
                    {new Date().toLocaleTimeString("en-US", {
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span className="jarvis-data w-28 flex-shrink-0 opacity-40">
                    {log.source}
                  </span>
                  <span className="jarvis-data flex-1">{log.message}</span>
                  <div className="jarvis-dot" style={{ opacity: 0.3 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          VISUALISEUR CIRCULAIRE (Droite milieu)
          ======================================== */}
      <div className="fixed bottom-48 right-8 z-30">
        <div className="relative w-32 h-32">
          <CircularVisualizer
            isActive={isListening || status === "speaking"}
            size={130}
          />
        </div>
      </div>

      {/* ========================================
          CONTRÔLES MICRO (Bas droit) - Style Cinématique
          ======================================== */}
      <div className="fixed bottom-8 right-8 z-30">
        <div className="relative">
          {/* Glow doré si actif */}
          {isListening && (
            <div className="absolute inset-0 -m-24 pointer-events-none">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 60%)",
                  filter: "blur(30px)",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
            </div>
          )}

          {/* Cercles décoratifs autour du bouton */}
          {/* <div className="absolute inset-0 -m-8 pointer-events-none">
            <div className="jarvis-circle w-full h-full" style={{
              borderColor: isListening ? '#ffd700' : '#00e5ff',
              boxShadow: isListening ? '0 0 20px rgba(255, 215, 0, 0.6)' : '0 0 10px rgba(0, 229, 255, 0.4)'
            }} />
          </div>
          <div className="absolute inset-0 -m-12 pointer-events-none">
            <div className="jarvis-circle w-full h-full jarvis-rotate-slow" style={{ 
              opacity: 0.4,
              borderColor: isListening ? '#ffd700' : '#00e5ff'
            }} />
          </div>
          <div className="absolute inset-0 -m-16 pointer-events-none">
            <div className="jarvis-circle w-full h-full jarvis-rotate-slow" style={{ 
              opacity: 0.2,
              borderColor: isListening ? '#ffcc00' : '#00e5ff'
            }} />
          </div> */}

          {/* Bouton micro */}
          <button
            onClick={onMicrophoneClick}
            className={`jarvis-button relative z-10 ${
              isListening ? "jarvis-pulse-subtle" : ""
            }`}
            style={{
              padding: "18px 36px",
              borderColor: isListening ? "#ffd700" : "#00e5ff",
              boxShadow: isListening
                ? "0 0 30px rgba(255, 215, 0, 0.6), inset 0 0 20px rgba(255, 215, 0, 0.1)"
                : "0 0 15px rgba(0, 229, 255, 0.4)",
              color: isListening ? "#ffd700" : "#00e5ff",
            }}
          >
            {/* Indicateur statut */}
            <div
              className={`absolute -top-2 -right-2 ${
                isListening ? "jarvis-dot-pulse" : "jarvis-dot"
              }`}
              style={{
                background: isListening ? "#ffd700" : "#00e5ff",
                boxShadow: isListening
                  ? "0 0 10px rgba(255, 215, 0, 0.8)"
                  : "0 0 8px rgba(0, 229, 255, 0.6)",
              }}
            />

            <div className="flex items-center gap-3">
              {/* Icône micro */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
              </svg>

              {/* Label */}
              <div>
                <div
                  className="jarvis-text"
                  style={{
                    fontSize: "13px",
                    color: isListening ? "#ffd700" : "#00e5ff",
                    textShadow: isListening
                      ? "0 0 10px rgba(255, 215, 0, 0.8)"
                      : "0 0 8px rgba(0, 229, 255, 0.6)",
                  }}
                >
                  {isListening ? "LISTENING" : "ACTIVATE"}
                </div>
                <div
                  className="jarvis-data text-left"
                  style={{ fontSize: "10px" }}
                >
                  {status === "idle" && "STANDBY"}
                  {status === "listening" && "RECEIVING"}
                  {status === "processing" && "ANALYZING"}
                  {status === "speaking" && "TRANSMITTING"}
                </div>
              </div>
            </div>
          </button>

          {/* Info sous le bouton */}
          <div className="mt-5 text-center space-y-2">
            <div className="jarvis-data">VOICE INTERFACE v3.0</div>
            <div className="flex items-center justify-center gap-2">
              <div className="jarvis-line-h w-8" />
              <div
                className="jarvis-status-indicator"
                style={{
                  background: isListening ? "#ffd700" : "#00e5ff",
                  boxShadow: isListening
                    ? "0 0 10px rgba(255, 215, 0, 0.8)"
                    : "0 0 8px rgba(0, 229, 255, 0.6)",
                }}
              />
              <div className="jarvis-line-h w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Gestionnaire Chemins Applications */}
      <AppPathsManager
        isOpen={isAppPathsOpen}
        onClose={() => setIsAppPathsOpen(false)}
      />

      {/* Overlays */}
      <LoadingOverlay isVisible={isProcessing} message={processingMessage} />

      <SuccessRipple trigger={successTrigger} />
    </div>
  );
};
