import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface TechNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "alert" | "quantum";
}

interface HolographicHUDProps {
  notifications: TechNotification[];
}

/**
 * Composant HolographicHUD
 * Affiche des notifications sci-fi avec des bordures tech et des lueurs.
 */
const HolographicHUD: React.FC<HolographicHUDProps> = ({ notifications }) => {
  return (
    <div className="fixed top-10 right-10 flex flex-col gap-4 pointer-events-none z-50">
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
