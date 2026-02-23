import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { StatusOverlayData } from "../types/app.types";

interface HolographicFleetOverlayProps {
  data: StatusOverlayData | null;
  isVisible: boolean;
  onClose: () => void;
}

export const HolographicFleetOverlay: React.FC<
  HolographicFleetOverlayProps
> = ({ data, isVisible, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Evite le SSR match error, petit délai pour s'assurer qu'on est au client
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Fermeture sur Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isVisible, onClose]);

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {isVisible && data && data.items && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {/* Backdrop Blur Global */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              onClose();
            }}
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at center, rgba(0,243,255,0.05), rgba(0,0,0,0.8))",
              backdropFilter: "blur(12px)",
              pointerEvents: "auto",
            }}
          />

          {/* Grille de flotte */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            style={{
              pointerEvents: "auto",
              position: "relative",
              width: "90vw",
              maxWidth: "1400px",
              height: "80vh",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-4 mb-4 bg-black/40 p-6 rounded-t-xl backdrop-blur-md">
              <h2 className="text-2xl font-bold text-cyan-400 tracking-widest font-mono">
                // SYSTEM_FLEET_OVERVIEW //
              </h2>
              <button
                onClick={onClose}
                className="text-cyan-500/60 hover:text-cyan-400 font-mono tracking-wider transition-colors"
              >
                [CLOSE_SYSTEM]
              </button>
            </div>

            {/* Grid Container */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto p-6 scrollbar-hide"
              style={{
                perspective: "1000px",
              }}
            >
              {data.items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative group"
                >
                  {/* Réutilisation de la logique de carte individuelle via une version simplifiée ou le composant complet en mode "embarqué" si possible.
                      Ici on va tricher un peu en créant une "HolographicStatusOverlay" mais statique/embarquée n'est pas prévu.
                      On va refaire une carte simple ici pour l'instant.
                   */}
                  <FleetCard item={item} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(content, document.body);
};

// Sous-composant pour l'affichage d'une carte dans la grille
const FleetCard = ({ item }: { item: StatusOverlayData }) => {
  return (
    <div className="bg-black/60 border border-cyan-500/30 rounded-lg overflow-hidden backdrop-blur-sm hover:border-cyan-400 transition-colors duration-300 shadow-[0_0_15px_rgba(0,243,255,0.1)] group-hover:shadow-[0_0_25px_rgba(0,243,255,0.2)]">
      {/* Header Image */}
      <div className="h-48 relative overflow-hidden bg-gray-900/50">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-500"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent h-16" />
        <div className="absolute bottom-2 left-3 flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-400 font-mono text-sm font-bold tracking-wider">
            {item.title}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {item.stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-cyan-900/10 p-2 rounded border border-cyan-500/10"
          >
            <div className="text-[10px] text-cyan-500/60 font-mono mb-1">
              {stat.label}
            </div>
            <div
              className={`font-mono font-bold ${
                stat.status === "warning"
                  ? "text-orange-400"
                  : stat.status === "error"
                    ? "text-red-400"
                    : "text-cyan-100"
              }`}
            >
              {stat.value} {stat.unit}
            </div>
            {stat.progress !== undefined && (
              <div className="w-full h-1 bg-cyan-900/30 mt-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500"
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
