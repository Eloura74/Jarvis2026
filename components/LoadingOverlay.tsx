/**
 * Composant Loading Overlay Premium pour JARVIS
 *
 * Affiche un overlay fullscreen pendant les traitement Gemini AI
 * avec animation spinner et message personnalisable
 */

import React from "react";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = "🤖 JARVIS analyse votre demande...",
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-blue-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-lg">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-xl" />

        {/* Contenu */}
        <div className="relative flex flex-col items-center gap-6">
          {/* Spinner avec pulse */}
          <div className="relative">
            <div className="h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-0 h-16 w-16 border-4 border-blue-400/20 rounded-full animate-pulse" />
          </div>

          {/* Message */}
          <p className="text-blue-400 text-lg font-mono tracking-wide max-w-md text-center">
            {message}
          </p>

          {/* Dots animation */}
          <div className="flex gap-2">
            <div
              className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
