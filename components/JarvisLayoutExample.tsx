/**
 * JarvisLayoutExample - Exemple complet de layout authentique JARVIS
 * 
 * Démontre :
 * - Structure minimaliste fidèle au film
 * - Placement des éléments
 * - Utilisation des classes authentiques
 * - HUD central avec UI périphérique
 */

import React from 'react';
import { JarvisHUDAuthentic } from './JarvisHUDAuthentic';

interface JarvisLayoutExampleProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking';
  isListening: boolean;
  commandCount: number;
  cpuUsage: number;
  memoryUsage: string;
  logs: Array<{
    time: string;
    source: string;
    message: string;
  }>;
  onMicrophoneClick: () => void;
}

export const JarvisLayoutExample: React.FC<JarvisLayoutExampleProps> = ({
  status,
  isListening,
  commandCount,
  cpuUsage,
  memoryUsage,
  logs,
  onMicrophoneClick,
}) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      
      {/* ========================================
          EFFETS DE FOND (Subtils)
          ======================================== */}
      <div className="jarvis-scanlines" />
      <div className="jarvis-vignette" />
      <div className="jarvis-grid" style={{ opacity: 0.12 }} />

      {/* ========================================
          HUD CENTRAL (Non-interactif)
          ======================================== */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20">
        <JarvisHUDAuthentic
          status={status}
          size={550}
          showDetails={true}
        />
      </div>

      {/* ========================================
          INTERFACE UTILISATEUR (Interactif)
          ======================================== */}
      <div className="relative z-30">
        
        {/* Header Supérieur */}
        <header className="fixed top-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="jarvis-panel-corners p-6">
              <div className="flex items-center justify-between">
                
                {/* Logo et titre */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="jarvis-dot-pulse" />
                    <div className="jarvis-text" style={{ fontSize: '14px', letterSpacing: '3px' }}>
                      J.A.R.V.I.S.
                    </div>
                  </div>
                  <div className="jarvis-label">
                    JUST A RATHER VERY INTELLIGENT SYSTEM
                  </div>
                </div>

                {/* Info système */}
                <div className="flex items-center gap-6">
                  <div className="jarvis-data-segment">
                    <span className="jarvis-label">VERSION</span>
                    <span className="jarvis-data ml-2">v3.0.1</span>
                  </div>
                  <div className="jarvis-line-v h-6" />
                  <div className="jarvis-data-segment">
                    <span className="jarvis-label">STATUS</span>
                    <div className="jarvis-status-indicator ml-2" />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </header>

        {/* ========================================
            STATS PÉRIPHÉRIQUES (Coins)
            ======================================== */}
        
        {/* Coin supérieur gauche - Système */}
        <div className="fixed top-32 left-8 w-56">
          <div className="jarvis-panel-corners p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="jarvis-marker w-4" />
              <div className="jarvis-label">SYSTEM</div>
            </div>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className="jarvis-text" style={{ fontSize: '32px', fontWeight: 300 }}>
                {cpuUsage}
              </span>
              <span className="jarvis-data">%</span>
            </div>
            
            <div className="jarvis-progress mb-3">
              <div
                className="jarvis-progress-bar"
                style={{ width: `${cpuUsage}%` }}
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="jarvis-data">CPU LOAD</span>
                <span className="jarvis-data">{cpuUsage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="jarvis-data">MEMORY</span>
                <span className="jarvis-data">{memoryUsage}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coin supérieur droit - Commandes */}
        <div className="fixed top-32 right-8 w-56">
          <div className="jarvis-panel-corners p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="jarvis-marker w-4" />
              <div className="jarvis-label">ACTIVITY</div>
            </div>
            
            <div className="jarvis-text mb-3" style={{ fontSize: '32px', fontWeight: 300 }}>
              {commandCount}
            </div>
            
            <div className="jarvis-data mb-1">COMMANDS EXECUTED</div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="jarvis-dot" />
                <span className="jarvis-data">VOICE RECOGNITION</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="jarvis-dot" />
                <span className="jarvis-data">NATURAL LANGUAGE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="jarvis-dot" />
                <span className="jarvis-data">TOOL EXECUTION</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================
            LOGS SYSTÈME (Bas gauche)
            ======================================== */}
        <div className="fixed bottom-8 left-8 w-96 max-h-64 overflow-hidden">
          <div className="jarvis-panel-corners p-4">
            <div className="relative">
              {/* Scan line */}
              <div className="jarvis-scan-line" />
              
              {/* Header */}
              <div className="flex items-center gap-4 mb-3 relative z-10">
                <div className="jarvis-text">SYSTEM LOGS</div>
                <div className="flex-1 jarvis-line-h" />
                <div className="jarvis-data">{logs.length}</div>
              </div>

              {/* Logs */}
              <div className="space-y-1 relative z-10">
                {logs.slice(0, 8).map((log, i) => (
                  <div key={i} className="flex items-start gap-2 animate-slideInUp" style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="jarvis-marker w-2 mt-0.5" />
                    <span className="jarvis-data w-16 flex-shrink-0 opacity-60">{log.time}</span>
                    <span className="jarvis-data w-20 flex-shrink-0 opacity-40">{log.source}</span>
                    <span className="jarvis-data flex-1 truncate">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================
            CONTRÔLES (Bas droit)
            ======================================== */}
        <div className="fixed bottom-8 right-8">
          <div className="relative">
            
            {/* Cercles décoratifs autour du bouton */}
            <div className="absolute inset-0 -m-8 pointer-events-none">
              <div className="jarvis-circle w-full h-full" />
            </div>
            <div className="absolute inset-0 -m-12 pointer-events-none">
              <div className="jarvis-circle w-full h-full jarvis-rotate-slow" style={{ opacity: 0.3 }} />
            </div>

            {/* Bouton micro */}
            <button
              onClick={onMicrophoneClick}
              className={`jarvis-button relative z-10 ${
                isListening ? 'jarvis-pulse-subtle' : ''
              }`}
              style={{ padding: '16px 32px' }}
            >
              {/* Indicateur statut */}
              <div className={`absolute -top-2 -right-2 ${
                isListening ? 'jarvis-dot-pulse' : 'jarvis-dot'
              }`} />

              <div className="flex items-center gap-3">
                {/* Icône micro */}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                  <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                </svg>

                {/* Label */}
                <div>
                  <div className="jarvis-text" style={{ fontSize: '12px' }}>
                    {isListening ? 'LISTENING' : 'ACTIVATE'}
                  </div>
                  <div className="jarvis-data text-left">
                    {status === 'idle' && 'STANDBY'}
                    {status === 'listening' && 'RECEIVING'}
                    {status === 'processing' && 'ANALYZING'}
                    {status === 'speaking' && 'TRANSMITTING'}
                  </div>
                </div>
              </div>
            </button>

            {/* Info sous le bouton */}
            <div className="mt-4 text-center">
              <div className="jarvis-data">
                VOICE INTERFACE v3.0
              </div>
            </div>

          </div>
        </div>

        {/* ========================================
            INDICATEURS TEMPS (Coins extrêmes)
            ======================================== */}
        
        {/* Heure */}
        <div className="fixed top-8 right-8 jarvis-data">
          {new Date().toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>

        {/* Date */}
        <div className="fixed top-8 left-8 jarvis-data">
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
          }).toUpperCase()}
        </div>

      </div>

    </div>
  );
};
