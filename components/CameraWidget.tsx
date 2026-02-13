import React, { useState, useEffect } from "react";
import {
  Video,
  Maximize2,
  Activity,
  Wifi,
  BatteryCharging,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const CameraWidget: React.FC = () => {
  const [activeCamera, setActiveCamera] = useState<
    "FRONT" | "LIVING" | "GARDEN"
  >("FRONT");
  const [isRecording] = useState(true);

  // Simulation d'un effet de glitch aléatoire pour le "réalisme"
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 150);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const cameras = [
    { id: "FRONT", label: "FRONT DOOR" },
    { id: "LIVING", label: "LIVING ROOM" },
    { id: "GARDEN", label: "BACKYARD" },
  ] as const;

  return (
    <div className="w-full relative overflow-hidden rounded-xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl group hover:border-cyan-400/50 transition-all duration-500 shadow-[0_0_15px_rgba(0,229,255,0.1)] flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center p-3 border-b border-cyan-400/20 bg-cyan-900/10">
        <div className="flex items-center gap-2 text-cyan-300">
          <Video size={14} />
          <span className="text-xs font-bold tracking-widest">VIDEO FEED</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] text-cyan-400/70">
            <Wifi size={10} />
            <span>5G</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-cyan-400/70">
            <BatteryCharging size={10} />
            <span>100%</span>
          </div>
          <Maximize2
            size={12}
            className="text-cyan-400/50 hover:text-cyan-300 cursor-pointer"
          />
        </div>
      </div>

      {/* VIDEO PREVIEW AREA */}
      <div className="relative aspect-video bg-black/50 overflow-hidden group-hover:brightness-110 transition-all">
        {/* Placeholder Image Logic (Gradient for now) */}
        <div
          className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 ${
            activeCamera === "FRONT"
              ? "from-slate-800 to-slate-900"
              : activeCamera === "LIVING"
                ? "from-stone-800 to-stone-900"
                : "from-green-900/20 to-slate-900"
          }`}
        />

        {/* Grid Overlay */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0, 229, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.1) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Glitch Effect */}
        <AnimatePresence>
          {glitch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-cyan-500/20 mix-blend-color-dodge z-10"
              style={{ transform: `translateX(${Math.random() * 10 - 5}px)` }}
            />
          )}
        </AnimatePresence>

        {/* Scan Line */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-full w-full animate-[scan_4s_linear_infinite] pointer-events-none" />

        {/* Status Overlays */}
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 border ${isRecording ? "border-red-500/50 text-red-500" : "border-gray-500 text-gray-400"}`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-gray-500"}`}
            />
            <span className="text-[9px] font-bold tracking-wider">REC</span>
          </div>
          <div className="px-1.5 py-0.5 rounded bg-black/60 border border-cyan-500/30 text-cyan-300 text-[9px] font-mono">
            {new Date().toLocaleTimeString([], { hour12: false })}
          </div>
        </div>

        <div className="absolute bottom-2 left-2">
          <div className="text-xs font-bold text-cyan-100 tracking-wider flex items-center gap-2 drop-shadow-md">
            <Activity size={12} className="text-cyan-400" />
            CAM_0
            {activeCamera === "FRONT"
              ? "1"
              : activeCamera === "LIVING"
                ? "2"
                : "3"}{" "}
            :{" "}
            {activeCamera === "FRONT"
              ? "FRONT_DOOR"
              : activeCamera === "LIVING"
                ? "LIVING_ROOM"
                : "BACKYARD"}
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="p-2 flex gap-1 bg-black/30">
        {cameras.map((cam) => (
          <button
            key={cam.id}
            onClick={() => setActiveCamera(cam.id)}
            className={`flex-1 py-1.5 text-[9px] font-bold tracking-wider rounded border transition-all ${
              activeCamera === cam.id
                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                : "bg-transparent border-transparent text-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400"
            }`}
          >
            {cam.label}
          </button>
        ))}
      </div>
    </div>
  );
};
