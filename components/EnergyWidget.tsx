import React from "react";
import { Zap, Activity } from "lucide-react";

interface EnergyWidgetProps {
  currentPower: number; // En Watts
  dailyConsumption: number; // En kWh
  isPeakHours: boolean;
}

export function EnergyWidget({
  currentPower = 450,
  dailyConsumption = 12.5,
  isPeakHours = false,
}: EnergyWidgetProps) {
  // Calculer la couleur de la jauge (vert < 1000W, orange < 3000W, rouge > 3000W)
  const getPowerColor = (power: number) => {
    if (power < 1000) return "text-green-400";
    if (power < 3000) return "text-orange-400";
    return "text-red-500";
  };

  // Pourcentage de la jauge (max 9000W pour un abo standard 9kVA)
  const loadPercentage = Math.min((currentPower / 9000) * 100, 100);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-4 transition-all hover:bg-black/50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/20">
            <Zap className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <span className="text-xs font-medium text-cyan-300/60 uppercase tracking-wider">
              LINKY
            </span>
            <div className={`text-lg font-bold ${getPowerColor(currentPower)}`}>
              {currentPower} <span className="text-sm">W</span>
            </div>
          </div>
        </div>

        {/* Heures Pleines/Creuses Badge */}
        <div
          className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider border ${
            isPeakHours
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-blue-500/10 border-blue-500/30 text-blue-400"
          }`}
        >
          {isPeakHours ? "HP" : "HC"}
        </div>
      </div>

      {/* Jauge de charge */}
      <div className="mt-4">
        <div className="flex justify-between text-[10px] text-cyan-400/50 mb-1">
          <span>CHARGE</span>
          <span>{Math.round(loadPercentage)}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              loadPercentage > 80
                ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                : "bg-gradient-to-r from-cyan-400 to-blue-500"
            }`}
            style={{ width: `${loadPercentage}%` }}
          />
        </div>
      </div>

      {/* Conso Journalière */}
      <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-cyan-200/60">
          <Activity className="h-3.5 w-3.5" />
          <span>Aujourd'hui</span>
        </div>
        <span className="font-mono text-cyan-100 font-bold">
          {dailyConsumption.toFixed(1)} kWh
        </span>
      </div>

      {/* Glow Effect */}
      <div className="absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-yellow-500/10 blur-xl" />
    </div>
  );
}
