/**
 * StatCard - Carte statistique coin HUD
 * Affiche métriques système avec glassmorphism
 */

import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  position,
  accentColor = "#06b6d4",
}) => {
  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-20 min-w-[180px] backdrop-blur-lg bg-slate-900/40 border border-cyan-500/30 rounded-xl p-4 shadow-lg transition-all duration-300 hover:bg-slate-800/50 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]`}
    >
      {/* Header avec icon */}
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="text-cyan-400 opacity-80">{icon}</div>}
        <div className="text-xs text-cyan-500/70 uppercase tracking-wider font-semibold">
          {title}
        </div>
      </div>

      {/* Valeur principale */}
      <div
        className="text-2xl font-bold tracking-wide font-mono drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
        style={{ color: accentColor }}
      >
        {value}
      </div>

      {/* Subtitle optionnel */}
      {subtitle && (
        <div className="text-xs text-slate-400 mt-1">{subtitle}</div>
      )}

      {/* Barre décorative */}
      <div
        className="h-0.5 w-full mt-2 rounded-full"
        style={{
          background: `linear-gradient(to right, ${accentColor}40, transparent)`,
        }}
      />
    </div>
  );
};
