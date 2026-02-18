// fichier pour les widgets de l'interface
import React, { useState, useEffect } from "react";
import {
  Play,
  SkipForward,
  SkipBack,
  Disc,
  Music,
  Podcast,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const MediaWidget: React.FC = () => {
  // Mode Simulation : si vrai, simule une activité média
  // (A terme, connecter au vrai état système)
  const [isPlaying, setIsPlaying] = useState(false);

  // Simulation content
  const [simulatedTrack, setSimulatedTrack] = useState({
    title: "NEURAL SYMPHONY",
    artist: "SYSTEM AUDIO",
    cover:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop",
  });

  // Effet pour simuler une détection (ou le vide)
  // Ici on force le playing pour "simuler si rien ouvert" comme demandé
  useEffect(() => {
    // En prod, check API. Ici on simule un toggle ou permanent
    setIsPlaying(true);

    // Playlist simulée qui change
    const tracks = [
      {
        title: "NEURAL SYMPHONY",
        artist: "SYSTEM AUDIO",
        cover:
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000",
      },
      {
        title: "DEEP FOCUS ALPHA",
        artist: "BRAINWAVE SYNC",
        cover:
          "https://images.unsplash.com/photo-1478737270239-2f63b8608fea?q=80&w=1000",
      },
      {
        title: "QUANTUM FLOW",
        artist: "AI GENERATION",
        cover:
          "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1000",
      },
    ];

    const interval = setInterval(() => {
      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
      setSimulatedTrack(randomTrack);
    }, 15000); // Change every 15s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full relative overflow-hidden rounded-xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl p-4 group hover:border-cyan-400/50 transition-colors shadow-[0_0_15px_rgba(0,229,255,0.1)]">
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={simulatedTrack.cover}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            src={simulatedTrack.cover}
            alt="Media Background"
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      </div>

      <div className="flex items-center gap-4 relative z-10">
        {/* Album Art / Disc Animation */}
        <div className="relative w-12 h-12 flex-shrink-0">
          <div
            className={`absolute inset-0 rounded-full border border-cyan-500/30 ${isPlaying ? "animate-[spin_4s_linear_infinite]" : ""}`}
          />
          <div
            className={`absolute inset-1 rounded-full border border-cyan-500/50 ${isPlaying ? "animate-[spin_3s_linear_infinite_reverse]" : ""}`}
          />
          <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
            {isPlaying ? (
              <Disc size={24} className="animate-pulse" />
            ) : (
              <Music size={24} />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <motion.div
            key={simulatedTrack.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-cyan-300 text-xs font-bold tracking-widest truncate"
          >
            {simulatedTrack.title}
          </motion.div>
          <motion.div
            key={simulatedTrack.artist}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-cyan-500/70 text-[10px] truncate flex items-center gap-1"
          >
            {isPlaying ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                ACTIVE SIMULATION
              </>
            ) : (
              "IDLE"
            )}
            {" • " + simulatedTrack.artist}
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 text-cyan-400">
          <button className="p-1 hover:text-cyan-200 transition-colors">
            <SkipBack size={14} />
          </button>
          <button
            className="p-1.5 rounded-full border border-cyan-500/40 hover:bg-cyan-500/10 transition-colors"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <div className="w-3 h-3 bg-cyan-400 rounded-sm" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
          </button>
          <button className="p-1 hover:text-cyan-200 transition-colors">
            <SkipForward size={14} />
          </button>
        </div>
      </div>

      {/* Spectrum Visualizer (Fake or Real) */}
      <div className="flex items-end justify-center gap-[2px] h-3 mt-3 opacity-50">
        {isPlaying &&
          [...Array(30)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-cyan-500 rounded-t-sm"
              style={{
                height: `${Math.random() * 100}%`,
                animation: `pulse 0.${3 + (i % 5)}s infinite alternate`,
              }}
            />
          ))}
        {!isPlaying && <div className="w-full h-[1px] bg-cyan-500/30"></div>}
      </div>
    </div>
  );
};
