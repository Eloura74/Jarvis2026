import React from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Activity } from "lucide-react";
import { DraggablePanel } from "./ui/DraggablePanel";
import { useKlipperMoonraker } from "../hooks/useKlipperMoonraker";
import { StatusOverlayData } from "../types/app.types";

// Composants extraits
import { THEME } from "./HolographicOverlay/theme";
import { HolographicContainer } from "./HolographicOverlay/HolographicContainer";
import { StatCard } from "./HolographicOverlay/StatCard";
import { LiveBadge } from "./HolographicOverlay/LiveBadge";

interface HolographicStatusOverlayProps {
  data: StatusOverlayData | null;
  isVisible: boolean;
  onClose: () => void;
}

/**
 * Composant d'affichage holographique - Version Production Grade avec Support Temps Réel
 */
export const HolographicStatusOverlay: React.FC<
  HolographicStatusOverlayProps
> = ({ data, isVisible, onClose }) => {
  const [mounted, setMounted] = React.useState(false);

  // ID de chiffrement stable pour l'affichage
  const [encId] = React.useState(() =>
    Math.random().toString(36).substring(7).toUpperCase(),
  );

  // Connection Temps Réel (si IP disponible)
  const klipper = useKlipperMoonraker(
    isVisible ? data?.ip : undefined,
    data?.webcamUrl,
  );

  // On priorise les données temps réel si connectées
  const displayData = klipper.isConnected && klipper.data ? klipper.data : data;

  React.useEffect(() => {
    setMounted(true);
    if (isVisible && displayData) {
      console.log(
        `🌌 [OVERLAY_PRO] Rendering instance: ${displayData.id} (${klipper.isConnected ? "LIVE" : "STATIC"})`,
      );
    }
  }, [isVisible, displayData, klipper.isConnected]);

  // Fermeture sur Escape
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isVisible, onClose]);

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {isVisible && displayData && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999, // Priorité absolue
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {/* Backdrop Blur Global avec gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at center, rgba(0,243,255,0.05), rgba(0,0,0,0.7))",
              backdropFilter: "blur(12px)",
              pointerEvents: "auto",
            }}
          />

          {/* Panneau de Données avec Centrage Dynamique */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 40, rotateX: 15 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              rotateX: 0,
            }}
            exit={{ scale: 0.9, opacity: 0, y: 30, filter: "blur(20px)" }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 250,
              opacity: { duration: 0.2 },
            }}
            style={{
              pointerEvents: "auto",
              position: "relative",
              perspective: "1200px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "auto",
              filter: "drop-shadow(0 0 40px rgba(0, 243, 255, 0.3))",
            }}
          >
            <DraggablePanel
              title={`// SYS_MONITOR // ${displayData.type.toUpperCase()}`}
              onClose={onClose}
              className="!relative !inset-auto !m-0" // Utilise le flux Flex du parent
            >
              <HolographicContainer>
                {/* Badge Live Status */}
                {klipper.isConnected && <LiveBadge />}

                {/* Header Image Section */}
                <div style={{ position: "relative", marginBottom: "24px" }}>
                  <div
                    style={{
                      height: "320px",
                      overflow: "hidden",
                      border: `1px solid ${THEME.cyanDim}`,
                      position: "relative",
                      backgroundColor: "rgba(0, 5, 10, 0.8)",
                      borderRadius: "4px",
                      boxShadow: `0 0 20px ${THEME.cyan}30`,
                    }}
                  >
                    <div className="holo-grid-overlay" />

                    <img
                      src={displayData.image}
                      alt={displayData.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        opacity: 0.95,
                        filter:
                          "contrast(1.2) brightness(1.2) saturate(1.1) drop-shadow(0 0 15px rgba(0, 243, 255, 0.4))",
                      }}
                      onError={(e) => {
                        console.error(
                          "Failed to load overlay image:",
                          displayData.image,
                        );
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800";
                      }}
                    />

                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: `linear-gradient(to top, rgba(5, 10, 20, 0.95), transparent)`,
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        borderBottom: `1px solid ${THEME.cyanDim}`,
                      }}
                    >
                      <Activity
                        size={16}
                        color={THEME.cyan}
                        className="animate-pulse"
                      />
                      <span
                        style={{
                          color: THEME.cyan,
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: "12px",
                          fontWeight: 600,
                          letterSpacing: "2px",
                        }}
                      >
                        REAL_TIME_LINK :: {displayData.title.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "16px",
                  }}
                >
                  {displayData.stats.map((stat, idx) => (
                    <StatCard
                      key={`${displayData.id}-stat-${idx}`}
                      stat={stat}
                      index={idx}
                    />
                  ))}
                </div>

                {/* System Metadata Footer */}
                <div
                  style={{
                    marginTop: "20px",
                    borderTop: `1px dashed ${THEME.cyanDim}`,
                    paddingTop: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "9px",
                    fontFamily: '"JetBrains Mono", monospace',
                    color: "rgba(0, 243, 255, 0.4)",
                    letterSpacing: "1px",
                  }}
                >
                  <span>
                    ID:{" "}
                    {displayData.id?.split("-")[0].toUpperCase() || "UNKNOWN"}
                  </span>
                  <span>ENC: {encId}</span>
                  <span style={{ color: THEME.cyan }}>
                    SYNC: {displayData.lastUpdate}
                  </span>
                </div>
              </HolographicContainer>
            </DraggablePanel>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default HolographicStatusOverlay;
