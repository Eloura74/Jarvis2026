/**
 * PremiumLayout - Layout JARVIS Authentique (Style Iron Man)
 * Interface minimaliste fidèle au film avec HUD circulaire
 */

import React from "react";
import { JarvisHUDAuthentic } from "./JarvisHUDAuthentic";
import { JarvisCinematicBackground } from "./JarvisCinematicBackground";
import { AudioWave } from "./AudioWave";
import { LoadingOverlay } from "./LoadingOverlay";
import { SuccessRipple } from "./SuccessRipple";

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
        {/* Glow intense derrière le HUD */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-96 h-96 rounded-full" style={{
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, rgba(0, 229, 255, 0.1) 40%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'pulse 3s ease-in-out infinite'
          }} />
        </div>
        
        <JarvisHUDAuthentic
          status={status}
          size={550}
          showDetails={true}
        />
      </div>

      {/* ========================================
          STATS PÉRIPHÉRIQUES (Style authentique)
          ======================================== */}
      
      {/* Coin supérieur gauche - Système */}
      <div className="fixed top-8 left-8 w-64 z-30">
        <div className="jarvis-panel-corners p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="jarvis-marker w-4" />
            <div className="jarvis-label">SYSTEM STATUS</div>
            <div className="flex-1" />
            <div className="jarvis-dot-pulse" />
          </div>
          
          <div className="flex items-baseline gap-2 mb-3">
            <span className="jarvis-text" style={{ fontSize: '36px', fontWeight: 300 }}>
              {cpuUsage}
            </span>
            <span className="jarvis-data">%</span>
          </div>
          
          <div className="jarvis-progress mb-4">
            <div
              className="jarvis-progress-bar"
              style={{ width: `${cpuUsage}%` }}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="jarvis-data">CPU LOAD</span>
              <span className="jarvis-text" style={{ fontSize: '11px' }}>{cpuUsage}%</span>
            </div>
            <div className="jarvis-line-h" />
            <div className="flex justify-between items-center">
              <span className="jarvis-data">MEMORY</span>
              <span className="jarvis-text" style={{ fontSize: '11px' }}>{memoryUsage}</span>
            </div>
            <div className="jarvis-line-h" />
            <div className="flex justify-between items-center">
              <span className="jarvis-data">PROCESSES</span>
              <span className="jarvis-text" style={{ fontSize: '11px' }}>24</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coin supérieur droit - Commandes */}
      <div className="fixed top-8 right-8 w-64 z-30">
        <div className="jarvis-panel-corners p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="jarvis-marker w-4" />
            <div className="jarvis-label">ACTIVITY LOG</div>
          </div>
          
          <div className="jarvis-text mb-2" style={{ fontSize: '36px', fontWeight: 300 }}>
            {commandCount}
          </div>
          
          <div className="jarvis-data mb-4">TOTAL COMMANDS</div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="jarvis-dot" />
                <span className="jarvis-data">VOICE</span>
              </div>
              <span className="jarvis-text" style={{ fontSize: '11px' }}>ACTIVE</span>
            </div>
            <div className="jarvis-line-h" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={status !== 'idle' ? 'jarvis-dot-pulse' : 'jarvis-dot'} />
                <span className="jarvis-data">STATUS</span>
              </div>
              <span className="jarvis-text" style={{ fontSize: '11px' }}>{status.toUpperCase()}</span>
            </div>
            <div className="jarvis-line-h" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="jarvis-dot" />
                <span className="jarvis-data">AI MODEL</span>
              </div>
              <span className="jarvis-text" style={{ fontSize: '11px' }}>GEMINI</span>
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
          <div className="jarvis-text mb-2" style={{ fontSize: '28px', fontWeight: 300 }}>
            {currentTime}
          </div>
          <div className="jarvis-data mb-4">{currentDate.toUpperCase()}</div>
          
          <div className="jarvis-line-h mb-3" />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="jarvis-data">TIMEZONE</span>
              <span className="jarvis-text" style={{ fontSize: '11px' }}>UTC+1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="jarvis-data">UPTIME</span>
              <span className="jarvis-text" style={{ fontSize: '11px' }}>24H 37M</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          LOGO J.A.R.V.I.S 3D EN HAUT
          ======================================== */}
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-40 text-center">
        <div className="relative">
          {/* Effet de glow doré derrière le texte */}
          <div className="absolute inset-0 blur-xl" style={{
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%)',
            transform: 'scale(1.5)'
          }} />
          
          {/* Logo principal */}
          <div className="relative">
            <h1 className="text-6xl font-bold tracking-wider" style={{
              fontFamily: 'Rajdhani, sans-serif',
              color: '#ffd700',
              textShadow: `
                0 0 20px rgba(255, 215, 0, 0.8),
                0 0 40px rgba(255, 215, 0, 0.6),
                0 0 60px rgba(255, 215, 0, 0.4),
                0 0 80px rgba(0, 229, 255, 0.3),
                2px 2px 4px rgba(0, 0, 0, 0.8)
              `,
              letterSpacing: '0.3em'
            }}>
              J.A.R.V.I.S.
            </h1>
            <p className="jarvis-data mt-2" style={{ letterSpacing: '0.5em', opacity: 0.7 }}>
              JUST A RATHER VERY INTELLIGENT SYSTEM
            </p>
          </div>
        </div>
      </div>

      {/* ========================================
          ONDE AUDIO (Quand on parle)
          ======================================== */}
      {isListening && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 translate-y-32 w-full max-w-3xl h-24 z-25 pointer-events-none">
          <AudioWave isActive={isListening} color="#ffd700" />
        </div>
      )}

      {/* ========================================
          LOGS SYSTÈME (Déplacé sur la droite, milieu de l'écran)
          ======================================== */}
      <div className="fixed top-1/2 right-8 transform -translate-y-1/2 w-96 max-h-72 z-30">
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
            <div className="space-y-2 relative z-10 max-h-48 overflow-y-auto">
              {logs.slice(-10).map((log, i) => (
                <div key={i} className="flex items-start gap-3 animate-slideInUp" style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="jarvis-marker w-2 mt-0.5" />
                  <span className="jarvis-data w-20 flex-shrink-0 opacity-60">
                    {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="jarvis-data w-28 flex-shrink-0 opacity-40">{log.source}</span>
                  <span className="jarvis-data flex-1">{log.message}</span>
                  <div className="jarvis-dot" style={{ opacity: 0.3 }} />
                </div>
              ))}
            </div>
          </div>
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
              <div className="w-full h-full rounded-full" style={{
                background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 60%)',
                filter: 'blur(30px)',
                animation: 'pulse 2s ease-in-out infinite'
              }} />
            </div>
          )}
          
          {/* Cercles décoratifs autour du bouton */}
          <div className="absolute inset-0 -m-8 pointer-events-none">
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
          </div>

          {/* Bouton micro */}
          <button
            onClick={onMicrophoneClick}
            className={`jarvis-button relative z-10 ${
              isListening ? 'jarvis-pulse-subtle' : ''
            }`}
            style={{ 
              padding: '18px 36px',
              borderColor: isListening ? '#ffd700' : '#00e5ff',
              boxShadow: isListening 
                ? '0 0 30px rgba(255, 215, 0, 0.6), inset 0 0 20px rgba(255, 215, 0, 0.1)' 
                : '0 0 15px rgba(0, 229, 255, 0.4)',
              color: isListening ? '#ffd700' : '#00e5ff'
            }}
          >
            {/* Indicateur statut */}
            <div className={`absolute -top-2 -right-2 ${
              isListening ? 'jarvis-dot-pulse' : 'jarvis-dot'
            }`} style={{
              background: isListening ? '#ffd700' : '#00e5ff',
              boxShadow: isListening 
                ? '0 0 10px rgba(255, 215, 0, 0.8)' 
                : '0 0 8px rgba(0, 229, 255, 0.6)'
            }} />

            <div className="flex items-center gap-3">
              {/* Icône micro */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
              </svg>

              {/* Label */}
              <div>
                <div className="jarvis-text" style={{ 
                  fontSize: '13px',
                  color: isListening ? '#ffd700' : '#00e5ff',
                  textShadow: isListening 
                    ? '0 0 10px rgba(255, 215, 0, 0.8)' 
                    : '0 0 8px rgba(0, 229, 255, 0.6)'
                }}>
                  {isListening ? 'LISTENING' : 'ACTIVATE'}
                </div>
                <div className="jarvis-data text-left" style={{ fontSize: '10px' }}>
                  {status === 'idle' && 'STANDBY'}
                  {status === 'listening' && 'RECEIVING'}
                  {status === 'processing' && 'ANALYZING'}
                  {status === 'speaking' && 'TRANSMITTING'}
                </div>
              </div>
            </div>
          </button>

          {/* Info sous le bouton */}
          <div className="mt-5 text-center space-y-2">
            <div className="jarvis-data">
              VOICE INTERFACE v3.0
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="jarvis-line-h w-8" />
              <div className="jarvis-status-indicator" style={{
                background: isListening ? '#ffd700' : '#00e5ff',
                boxShadow: isListening 
                  ? '0 0 10px rgba(255, 215, 0, 0.8)' 
                  : '0 0 8px rgba(0, 229, 255, 0.6)'
              }} />
              <div className="jarvis-line-h w-8" />
            </div>
          </div>

        </div>
      </div>


      {/* Overlays */}
      <LoadingOverlay isVisible={isProcessing} message={processingMessage} />

      <SuccessRipple trigger={successTrigger} />
    </div>
  );
};
