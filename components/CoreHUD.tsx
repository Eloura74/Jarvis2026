/**
 * CoreHUD - Cercle central animé style Iron Man
 * HUD futuriste avec arcs rotatifs et indicateurs
 */

import React from "react";

interface CoreHUDProps {
  status?: "idle" | "listening" | "processing" | "speaking";
}

export const CoreHUD: React.FC<CoreHUDProps> = ({ status = "idle" }) => {
  const statusColors = {
    idle: "#06b6d4", // cyan
    listening: "#22d3ee", // cyan bright
    processing: "#a855f7", // purple
    speaking: "#10b981", // green
  };

  const currentColor = statusColors[status];

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* SVG HUD */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
        {/* Définitions gradients */}
        <defs>
          <linearGradient
            id="gradient-cyan"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={currentColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={currentColor} stopOpacity="0.2" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Cercle extérieur rotatif */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="url(#gradient-cyan)"
          strokeWidth="2"
          strokeDasharray="565"
          strokeDashoffset="100"
          className="animate-spin-slow origin-center"
          style={{ transformOrigin: "50% 50%" }}
          filter="url(#glow)"
        />

        {/* Cercle milieu */}
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke={currentColor}
          strokeWidth="1"
          strokeDasharray="440"
          strokeDashoffset="220"
          className="animate-spin-reverse origin-center"
          style={{ transformOrigin: "50% 50%" }}
          opacity="0.5"
        />

        {/* Arcs indicateurs */}
        <path
          d="M 100 30 A 70 70 0 0 1 170 100"
          fill="none"
          stroke={currentColor}
          strokeWidth="3"
          className="animate-pulse"
          opacity="0.7"
        />

        {/* Segments décoratifs */}
        <line
          x1="100"
          y1="20"
          x2="100"
          y2="40"
          stroke={currentColor}
          strokeWidth="2"
          opacity="0.8"
        />
        <line
          x1="180"
          y1="100"
          x2="160"
          y2="100"
          stroke={currentColor}
          strokeWidth="2"
          opacity="0.8"
        />
        <line
          x1="100"
          y1="180"
          x2="100"
          y2="160"
          stroke={currentColor}
          strokeWidth="2"
          opacity="0.8"
        />
        <line
          x1="20"
          y1="100"
          x2="40"
          y2="100"
          stroke={currentColor}
          strokeWidth="2"
          opacity="0.8"
        />

        {/* Coins tech */}
        <polyline
          points="30,30 30,40 40,40"
          fill="none"
          stroke={currentColor}
          strokeWidth="1"
          opacity="0.6"
        />
        <polyline
          points="170,30 170,40 160,40"
          fill="none"
          stroke={currentColor}
          strokeWidth="1"
          opacity="0.6"
        />
        <polyline
          points="30,170 30,160 40,160"
          fill="none"
          stroke={currentColor}
          strokeWidth="1"
          opacity="0.6"
        />
        <polyline
          points="170,170 170,160 160,160"
          fill="none"
          stroke={currentColor}
          strokeWidth="1"
          opacity="0.6"
        />
      </svg>

      {/* Centre texte */}
      <div className="relative z-10 text-center">
        <div className="text-2xl font-bold tracking-wider text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
          J.A.R.V.I.S
        </div>
        <div className="text-xs text-cyan-500/60 uppercase tracking-widest mt-1">
          {status}
        </div>
      </div>

      {/* Pulse effect si listening/processing */}
      {(status === "listening" || status === "processing") && (
        <div className="absolute inset-0 rounded-full border-4 border-cyan-400/30 animate-ping" />
      )}
    </div>
  );
};
