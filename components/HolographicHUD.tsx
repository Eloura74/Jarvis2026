import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  checkNeuralStatus,
  resetNeuralShield,
} from "../services/geminiService";
import { RotateCcw } from "lucide-react";
import { TechNotification } from "../types/app.types";

interface HolographicHUDProps {
  notifications: TechNotification[];
}

/**
 * Composant HolographicHUD
 * Affiche des notifications sci-fi avec des bordures tech et des lueurs.
 */
const HolographicHUD: React.FC<HolographicHUDProps> = ({ notifications }) => {
  const [neural, setNeural] = useState(checkNeuralStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      setNeural(checkNeuralStatus());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed top-10 right-10 flex flex-col gap-4 pointer-events-none z-50">
      {/* 🔮 NEURAL ENGINE STATUS */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="self-end px-3 py-1 bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-sm flex items-center gap-3 mb-2"
      >
        <div className="flex flex-col items-end">
          <span className="text-[9px] uppercase tracking-widest text-cyan-500/70 font-mono">
            Neural Core
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-tighter ${
              neural.isOverloaded
                ? "text-red-500 animate-pulse"
                : "text-cyan-400"
            }`}
          >
            {neural.isOverloaded
              ? `OVERLOADED (${neural.remainingCooldown}s)`
              : "LINK ACTIVE"}
          </span>
        </div>

        {/* Bouton Reset (visible uniquement si overloaded) */}
        {neural.isOverloaded && (
          <button
            onClick={() => {
              resetNeuralShield();
              setNeural(checkNeuralStatus());
            }}
            className="pointer-events-auto p-1.5 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded transition-all hover:scale-110 active:scale-95"
            title="Reset Neural Shield"
          >
            <RotateCcw size={12} className="text-red-400" />
          </button>
        )}
        <div
          className={`w-2 h-8 rounded-full ${
            neural.isOverloaded ? "bg-red-900/40" : "bg-cyan-900/40"
          } relative overflow-hidden`}
        >
          <motion.div
            animate={{
              y: neural.isOverloaded ? "100%" : ["0%", "80%", "0%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            className={`absolute top-0 left-0 w-full h-2 ${
              neural.isOverloaded ? "bg-red-500" : "bg-cyan-400"
            } blur-[1px]`}
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, filter: "blur(10px)" }}
            className={`relative min-w-[280px] p-4 bg-black/40 backdrop-blur-md border-l-4 ${
              notif.type === "quantum" ? "border-purple-500" : "border-cyan-500"
            } text-white shadow-[0_0_20px_rgba(6,182,212,0.2)]`}
          >
            {/* Décorations Tech */}
            <div className="absolute top-0 right-0 p-1">
              <div className="w-2 h-2 border-t border-r border-cyan-500/50" />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-widest uppercase opacity-60 font-mono">
                {notif.type === "quantum"
                  ? "🌌 Neural_Link"
                  : "⚡ System_Event"}
              </span>
              <h3 className="text-sm font-bold tracking-wider text-cyan-300">
                {notif.title}
              </h3>
              <p className="text-xs opacity-80 leading-relaxed font-mono italic">
                {notif.message}
              </p>
            </div>

            {/* Scanline simple */}
            <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
              <div className="w-full h-[1px] bg-white animate-scan" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default HolographicHUD;
