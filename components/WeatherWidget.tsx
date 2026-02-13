// fichier pour les widgets
import React from "react";
import { CloudRain, Sun, Wind } from "lucide-react";

export const WeatherWidget: React.FC = () => {
  return (
    <div className="w-full relative overflow-hidden rounded-xl border border-cyan-500/20 bg-black/40 backdrop-blur-xl p-4 flex items-center justify-between group hover:border-cyan-500/40 transition-colors">
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="text-cyan-400 filter drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
          <Sun size={32} />
        </div>

        <div>
          <div className="text-2xl font-light text-white tracking-tighter">
            24°
          </div>
          <div className="text-[10px] text-cyan-400 tracking-widest uppercase opacity-80">
            Sunny • Malibu
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-[10px] text-cyan-500/70 text-right">
        <div className="flex items-center justify-end gap-1">
          <Wind size={10} />
          <span>12 km/h</span>
        </div>
        <div className="flex items-center justify-end gap-1">
          <CloudRain size={10} />
          <span>0%</span>
        </div>
      </div>
    </div>
  );
};
