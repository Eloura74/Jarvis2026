// fichier pour les widgets de l'interface
import React from "react";
import { Play, SkipForward, SkipBack, Disc } from "lucide-react";

export const MediaWidget: React.FC = () => {
  return (
    <div className="w-full relative overflow-hidden rounded-xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl p-4 group hover:border-cyan-400/50 transition-colors shadow-[0_0_15px_rgba(0,229,255,0.1)]">
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop"
          alt="Media Background"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      </div>

      <div className="flex items-center gap-4 relative z-10">
        {/* Album Art / Disc Animation */}
        <div className="relative w-12 h-12 flex-shrink-0">
          <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-[spin_4s_linear_infinite]" />
          <div className="absolute inset-1 rounded-full border border-cyan-500/50 animate-[spin_3s_linear_infinite_reverse]" />
          <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
            <Disc size={24} className="animate-pulse" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-cyan-300 text-xs font-bold tracking-widest truncate">
            NEURAL SYMPHONY
          </div>
          <div className="text-cyan-500/70 text-[10px] truncate">
            SYSTEM AUDIO
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 text-cyan-400">
          <button className="p-1 hover:text-cyan-200 transition-colors">
            <SkipBack size={14} />
          </button>
          <button className="p-1.5 rounded-full border border-cyan-500/40 hover:bg-cyan-500/10 transition-colors">
            <Play size={14} fill="currentColor" />
          </button>
          <button className="p-1 hover:text-cyan-200 transition-colors">
            <SkipForward size={14} />
          </button>
        </div>
      </div>

      {/* Spectrum Visualizer (Fake) */}
      <div className="flex items-end justify-center gap-[2px] h-3 mt-3 opacity-50">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-cyan-500 rounded-t-sm"
            style={{
              height: `${Math.random() * 100}%`,
              animation: `pulse 0.${5 + (i % 5)}s infinite alternate`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
