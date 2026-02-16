import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Brain,
  Eye,
  Workflow,
  Printer,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

interface OrbitalMenuProps {
  onToggleHome: () => void;
  onTogglePsych: () => void;
  onToggleGhost: () => void;
  onToggleWorkflow: () => void;
  onTogglePrinter: () => void;
  onToggleGemini: () => void;
}

export const OrbitalMenu: React.FC<OrbitalMenuProps> = ({
  onToggleHome,
  onTogglePsych,
  onToggleGhost,
  onToggleWorkflow,
  onTogglePrinter,
  onToggleGemini,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Configuration des items du menu
  const menuItems = [
    {
      id: "home",
      icon: <Zap size={24} />,
      label: "ENERGY",
      action: onToggleHome,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]",
    },
    {
      id: "psych",
      icon: <Brain size={24} />,
      label: "PSYCH",
      action: onTogglePsych,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/50 shadow-[0_0_10px_rgba(129,140,248,0.3)]",
    },
    {
      id: "ghost",
      icon: <Eye size={24} />,
      label: "GHOST",
      action: onToggleGhost,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/50 shadow-[0_0_10px_rgba(192,132,252,0.3)]",
    },
    {
      id: "workflow",
      icon: <Workflow size={24} />,
      label: "FLOW",
      action: onToggleWorkflow,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/50 shadow-[0_0_10px_rgba(74,222,128,0.3)]",
    },
    {
      id: "printer",
      icon: <Printer size={24} />,
      label: "FLEET",
      action: onTogglePrinter,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/50 shadow-[0_0_10px_rgba(251,146,60,0.3)]",
    },
    {
      id: "gemini",
      icon: <Sparkles size={24} />,
      label: "GEMINI",
      action: onToggleGemini,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.3)]",
    },
  ];

  // Rayon du menu (distance des items au centre)
  const radius = 160;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[60]">
      {/* Container interactif au centre */}
      <div className="relative pointer-events-auto flex items-center justify-center">
        {/* Cercles décoratifs orbitaux permanents */}
        <div className="absolute w-[300px] h-[300px] rounded-full border border-cyan-500/5 border-dashed animate-[spin_60s_linear_infinite]" />
        <div className="absolute w-[250px] h-[250px] rounded-full border border-cyan-500/5 animate-[spin_40s_linear_infinite_reverse]" />

        {/* Toggle Central Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative z-50 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 backdrop-blur-sm ${
            isOpen
              ? "bg-black/80 border border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
              : "bg-black/20 border border-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:bg-cyan-900/20"
          }`}
        >
          {/* Animated Rings inside button */}
          <div
            className={`absolute inset-0 rounded-full border border-dashed border-cyan-500/30 animate-[spin_4s_linear_infinite] ${isOpen ? "opacity-0" : "opacity-100"}`}
          />

          {isOpen ? (
            <X
              size={24}
              className="text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]"
            />
          ) : (
            <Menu
              size={24}
              className="text-cyan-400 drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]"
            />
          )}
        </button>

        {/* Menu Items */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Overlay léger pour focus */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] -z-10 pointer-events-auto"
                onClick={() => setIsOpen(false)}
              />

              <div className="absolute inset-0 flex items-center justify-center">
                {menuItems.map((item, index) => {
                  // Calcul de la position trigonométrique
                  // On répartit sur 360 deg, en commençant à -90 (haut)
                  const total = menuItems.length;
                  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;

                  // Coordonnées finales
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                      animate={{
                        x,
                        y,
                        scale: 1,
                        opacity: 1,
                        transition: {
                          type: "spring",
                          stiffness: 260,
                          damping: 20,
                          delay: index * 0.05,
                        },
                      }}
                      exit={{
                        x: 0,
                        y: 0,
                        scale: 0,
                        opacity: 0,
                        transition: {
                          duration: 0.2,
                          delay: (total - index) * 0.03,
                        },
                      }}
                      className="absolute w-20 h-20 flex items-center justify-center"
                    >
                      {/* Ligne connectrice animée */}
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: radius - 40, opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          delay: 0.2 + index * 0.05,
                          duration: 0.3,
                        }}
                        className="absolute w-[1px] bg-gradient-to-t from-transparent via-cyan-500/30 to-transparent origin-bottom"
                        style={{
                          bottom: "50%",
                          rotate: `${(angle * 180) / Math.PI + 90}deg`,
                          transformOrigin: "bottom center",
                        }}
                      />

                      {/* Bouton Item */}
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          item.action();
                          setIsOpen(false);
                        }}
                        className={`relative z-20 w-16 h-16 rounded-full flex flex-col items-center justify-center backdrop-blur-md border bg-black/60 transition-colors ${item.border} hover:bg-white/10`}
                      >
                        <div
                          className={`${item.color} mb-1 drop-shadow-[0_0_8px_currentColor]`}
                        >
                          {item.icon}
                        </div>
                        <span
                          className={`text-[8px] font-bold tracking-widest ${item.color} opacity-80 uppercase`}
                        >
                          {item.label}
                        </span>
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
