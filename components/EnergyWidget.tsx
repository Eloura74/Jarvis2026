import React from "react";
import { Zap, Activity, Info, Settings } from "lucide-react";

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
  const getPowerColor = (power: number) => {
    if (power < 1000) return "text-emerald-400";
    if (power < 3000) return "text-amber-400";
    return "text-red-500 animate-pulse";
  };

  const loadPercentage = Math.min((currentPower / 9000) * 100, 100);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/60 p-5 transition-all hover:bg-black/70 group h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Zap className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block mb-0.5">
              GRID STATUS
            </span>
            <div
              className={`text-2xl font-black font-display tracking-tight ${getPowerColor(currentPower)} drop-shadow-md`}
            >
              {currentPower}{" "}
              <span className="text-sm font-medium opacity-70">W</span>
            </div>
          </div>
        </div>

        {/* Boutons Gestion (Info / Settings) */}
        <div className="flex gap-2">
          <button
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Détails"
          >
            <Info size={14} />
          </button>
          <button
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Configuration"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Jauge Centrale */}
      <div className="my-4 relative">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] text-gray-500 font-mono">LINKY LOAD</span>
          <span className="text-[9px] text-amber-500 font-mono font-bold">
            {loadPercentage.toFixed(1)}%
          </span>
        </div>
        {/* Jauge Background */}
        <div className="h-2 w-full bg-gray-800/50 rounded-full overflow-hidden border border-white/5 relative">
          {/* Segments décoratifs */}
          <div className="absolute inset-0 flex justify-between px-1 opacity-20">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-[1px] h-full bg-white"></div>
            ))}
          </div>

          {/* Bar */}
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out relative z-10 ${
              loadPercentage > 80
                ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                : "bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500"
            }`}
            style={{ width: `${loadPercentage}%` }}
          >
            {/* Shine effect */}
            <div className="absolute top-0 right-0 bottom-0 w-[5px] bg-white/50 blur-[2px]"></div>
          </div>
        </div>

        {/* HP/HC Badge sous la jauge */}
        <div className="flex justify-end mt-2">
          <div
            className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider border flex items-center gap-1 ${
              isPeakHours
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-blue-500/10 border-blue-500/30 text-blue-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isPeakHours ? "bg-red-500" : "bg-blue-500"} animate-pulse`}
            ></span>
            {isPeakHours ? "HEURES PLEINES" : "HEURES CREUSES"}
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
        <div className="bg-white/5 rounded p-2 flex flex-col">
          <span className="text-[9px] text-gray-500 uppercase">
            Aujourd'hui
          </span>
          <span className="text-white font-mono font-bold">
            {dailyConsumption}{" "}
            <span className="text-[9px] opacity-50">kWh</span>
          </span>
        </div>
        <div className="bg-white/5 rounded p-2 flex flex-col">
          <span className="text-[9px] text-gray-500 uppercase">Coût Est.</span>
          <span className="text-white font-mono font-bold">
            {(dailyConsumption * 0.22).toFixed(2)}{" "}
            <span className="text-[9px] opacity-50">€</span>
          </span>
        </div>
      </div>

      {/* Glow Effect Ambient */}
      <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
    </div>
  );
}
