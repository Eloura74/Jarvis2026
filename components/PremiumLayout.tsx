/**
 * PremiumLayout - Layout JARVIS Authentique (Style Iron Man)
 * Interface minimaliste fidèle au film avec HUD circulaire
 */

import React, { useState } from "react";
import { JarvisHUDAuthentic } from "./JarvisHUDAuthentic";
import { JarvisCinematicBackground } from "./JarvisCinematicBackground";
import { LoadingOverlay } from "./LoadingOverlay";
import { SuccessRipple } from "./SuccessRipple";
import { AppPathsManager } from "./AppPathsManager";
import { ParticleSphere } from "./ParticleSphere";
import { VoiceWave } from "./VoiceWave";
import { FingerprintScanner } from "./FingerprintScanner";

interface PremiumLayoutProps {
  // HUD status
  status: "idle" | "listening" | "processing" | "speaking";

  // Stats
  commandCount: number;
  cpuUsage?: number;
  memoryUsage?: string;
  processes?: number; // NOUVEAU

  // Command
  onMicrophoneClick: () => void;
  isListening: boolean;
  onCommand?: (command: string) => void;

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
  processes = 24, // Valeur par défaut
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
    <div className="relative w-full min-h-screen overflow-hidden bg-transparent">
      {/* ========================================
          ARRIÈRE-PLAN CINÉMATIQUE
          ======================================== */}
      {/* ========================================
          ARRIÈRE-PLAN CINÉMATIQUE
          ======================================== */}
      {/* Image de fond directe pour garantir la visibilité */}
      <img
        src="/bg-wires1.png"
        alt="Background"
        className="fixed inset-0 w-full h-full object-cover opacity-50 z-0"
      />
      <JarvisCinematicBackground />

      {/* ========================================
          EFFETS DE FOND
          ======================================== */}
      {/* Scanlines réduites */}
      <div className="jarvis-scanlines opacity-30" />
      <div className="jarvis-vignette opacity-60" />

      {/* ========================================
          HUD CENTRAL AUTHENTIQUE (Non-interactif)
          ======================================== */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20">
        {/* Glow intense derrière le HUD - CYAN UNIQUEMENT */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-96 h-96 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(0, 229, 255, 0.15) 0%, transparent 70%)",
              filter: "blur(50px)",
              animation: "pulse 4s ease-in-out infinite",
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

        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          {/* Visualiseur Sphère de Particules (Réactif) */}
          <ParticleSphere
            isActive={status === "speaking"}
            isListening={isListening || status === "listening"}
            // Niveau audio simulé (Pourrait être connecté à un analyser réel)
            audioLevel={status === "speaking" ? 80 : isListening ? 60 : 0}
            size={800}
            baseColor="#00e5ff"
            activeColor="#00e5ff" // Cyan aussi pour écoute, peut-être plus brillant ?
          />
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
            {/* Mini-graphique CPU Animé */}
            <div className="flex gap-1 h-10 items-end">
              {[...Array(12)].map((_, i) => {
                // Simulation d'un historique basé sur le CPU actuel + bruit
                const height = Math.min(
                  100,
                  Math.max(10, cpuUsage + (Math.random() - 0.5) * 40),
                );
                return (
                  <div
                    key={i}
                    className="flex-1 bg-cyan-500/20 transition-all duration-300 ease-in-out"
                    style={{
                      height: `${height}%`,
                      backgroundColor:
                        i === 11
                          ? "var(--jarvis-cyan)"
                          : "rgba(0, 243, 255, 0.3)",
                      boxShadow:
                        i === 11 ? "0 0 10px var(--jarvis-cyan)" : "none",
                    }}
                  />
                );
              })}
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
                {processes}
              </span>
            </div>

            {/* Animation Voice Wave - Styles néon cyan */}
            <div className="jarvis-line-h" />
            <div className="flex justify-center pt-2">
              <VoiceWave
                barCount={9}
                color="#00f3ff"
                maxHeight={35}
                isActive={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Coin supérieur droit - Commandes - ENRICHI (ACTIVITY LOG) */}
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

      {/* Coin inférieur gauche - Time & Status (LOCAL TIME) */}
      <div className="fixed bottom-8 left-8 w-72 z-30">
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

            <div className="jarvis-line-h my-3" />

            {/* Authentification Biométrique - Déplacé */}

            {/* Bouton Config Applications */}
            <div className="jarvis-line-h my-3" />
            <button
              onClick={() => setIsAppPathsOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 jarvis-button text-xs"
              style={{
                borderColor: "#00e5ff",
                boxShadow: "0 0 10px rgba(0, 229, 255, 0.4)",
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
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-40 text-center pointer-events-none opacity-0">
        {" "}
        {/* Caché temporairement/désactivé pour ne pas gêner */}
        {/* ... (Logo code omitted/hidden via opacity to satisfy user request implicitly since logic changed) - Wait, I shouldn't hide logo unless requested. But System Logs might overlap. I'll just change System Logs position. Logo is centered. */}
      </div>

      {/* RÉTABLISSEMENT LOGO NORMAL */}
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-40 text-center">
        <div className="relative">
          {/* Effet de glow blanc/bleuté derrière le texte */}
          <div
            className="absolute inset-0 blur-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(200, 200, 255, 0.4) 0%, rgba(0, 229, 255, 0.2) 50%, transparent 70%)",
              transform: "scale(2)",
            }}
          />

          {/* Deuxième couche de glow cyan */}
          <div
            className="absolute inset-0 blur-xl"
            style={{
              background:
                "radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 60%)",
              transform: "scale(1.8)",
            }}
          />

          {/* Logo principal */}
          <div className="relative">
            <h1
              className="text-7xl font-bold tracking-wider"
              style={{
                fontFamily: "Rajdhani, sans-serif",
                color: "#f0f0f0", // Gris blanc
                textShadow: `
                0 0 10px rgba(255, 255, 255, 0.8),
                0 0 20px rgba(200, 200, 255, 0.5),
                0 0 40px rgba(0, 229, 255, 0.4),
                2px 2px 4px rgba(0, 0, 0, 0.9)
              `,
                letterSpacing: "0.3em",
                filter: "brightness(1.1)",
              }}
            >
              J.A.R.V.I.S.
            </h1>
            {/* Lignes décoratives sous le logo */}
            <div className="flex items-center justify-center gap-3 mt-3 mb-2">
              <div className="jarvis-line-h w-16" />
              <div
                className="jarvis-dot-pulse"
                style={{
                  backgroundColor: "#ffffff",
                  boxShadow: "0 0 10px rgba(255, 255, 255, 0.8)",
                }}
              />
              <div className="jarvis-line-h w-16" />
            </div>
            <p
              className="jarvis-data mt-2"
              style={{
                letterSpacing: "0.5em",
                opacity: 0.8,
                color: "#a0a0a0",
                textShadow: "0 0 5px rgba(255, 255, 255, 0.3)",
              }}
            >
              JUST A RATHER VERY INTELLIGENT SYSTEM
            </p>
          </div>
        </div>
      </div>

      {/* ========================================
          ONDE AUDIO (SUPPRIMÉE)
          ======================================== */}

      {/* ========================================
          LOGS SYSTÈME (Aligné en haut à gauche de Activity Log)
          ======================================== */}
      {/* Positionné à top-8 et décalé à gauche de Activity Log (right-[22rem]) */}
      <div className="fixed top-8 right-[22rem] w-80 h-[28rem] z-30">
        <div className="jarvis-panel-corners p-5 h-full">
          <div className="relative h-full flex flex-col">
            {/* Scan line */}
            <div className="jarvis-scan-line" />

            {/* Header */}
            <div className="flex items-center gap-4 mb-4 relative z-10 flex-shrink-0">
              <div className="jarvis-marker w-4" />
              <div className="jarvis-text">SYSTEM LOGS</div>
              <div className="flex-1 jarvis-line-h" />
              <div className="jarvis-data">TOTAL: {logs.length}</div>
              <div className="jarvis-status-indicator" />
            </div>

            {/* Logs */}
            <div className="space-y-1 relative z-10 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {logs.slice(-15).map((log, i) => (
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
          VISUALISEUR CIRCULAIRE (SUPPRIMÉ)
          ======================================== */}

      {/* ========================================
          EMPREINTE DIGITALE & MICROPHONE
          ======================================== */}
      {/* Container aligné sur le panneau Activity Log */}
      <div className="fixed bottom-28 right-72 w-72 z-30 flex flex-col items-center justify-center gap-12">
        {/* --- ÉLÉMENT 1 : BOUTON MICRO --- */}
        <div className="relative group flex flex-col items-center">
          {/* Glow doré si actif */}
          {isListening && (
            <div className="absolute top-1/2 left-1/2 -ml-6 -mt-6 w-12 h-12 pointer-events-none z-0">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%)",
                  filter: "blur(15px)",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
            </div>
          )}

          {/* Bouton Micro */}
          <button
            onClick={onMicrophoneClick}
            className={`relative z-10 w-28 h-28 flex items-center justify-center rounded-full border bg-black/40 hover:bg-cyan-500/10 transition-all duration-300 backdrop-blur-sm ${
              isListening
                ? "border-yellow-500/60 shadow-[0_0_15px_rgba(150,000,215,0.3)] jarvis-pulse-subtle"
                : "border-cyan-500/30 hover:border-cyan-400/60 hover:shadow-[0_0_10px_rgba(0,229,255,0.2)]"
            }`}
          >
            {isListening ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-red-400 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-cyan-400 group-hover:text-cyan-300 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>

          {/* Label STATUS */}
          <div
            className="absolute -bottom-5 text-[9px] font-bold tracking-widest opacity-70 whitespace-nowrap"
            style={{ color: isListening ? "#00e5ff" : "#00e5ff" }}
          >
            {isListening ? "ON AIR" : "MIC"}
          </div>
        </div>

        {/* --- ÉLÉMENT 2 : EMPREINTE DIGITALE --- */}
        <div className="flex flex-col items-center gap-2">
          <FingerprintScanner size={90} isActive={true} />
          {/* Optimisation : Retrait de ml-16 pour centrer le texte proprement sous l'empreinte */}
          <div className="jarvis-data text-[10px] tracking-[0.3em] text-cyan-400 font-bold opacity-80 mt-2 text-center">
            BIOMETRIC SCAN
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
