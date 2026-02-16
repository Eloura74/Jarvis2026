import React from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DraggablePanel } from "./ui/DraggablePanel";
import { Activity, Shield, Thermometer, Cpu, Gauge, Radio } from "lucide-react";
import { useKlipperMoonraker } from "../hooks/useKlipperMoonraker";

import { StatusOverlayData, StatusStat } from "../types/app.types";

interface HolographicStatusOverlayProps {
  data: StatusOverlayData | null;
  isVisible: boolean;
  onClose: () => void;
}

// --- DESIGN TOKENS (Enhanced) ---
const THEME = {
  cyan: "#00f3ff",
  cyanDim: "rgba(0, 243, 255, 0.15)",
  cyanGlow: "rgba(0, 243, 255, 0.4)",
  bg: "rgba(3, 7, 15, 0.92)",
  bgLight: "rgba(10, 20, 35, 0.6)",
  alert: "#ff3333",
  warning: "#ffaa00",
  gold: "#ffd700",
};

/**
 * Composant d'affichage holographique - Version Production Grade avec Support Temps Réel
 */
export const HolographicStatusOverlay: React.FC<
  HolographicStatusOverlayProps
> = ({ data, isVisible, onClose }) => {
  const [mounted, setMounted] = React.useState(false);

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
                {/* Effets de Fond Globaux */}
                <div className="holo-scanline" />
                <div className="holo-flicker" />

                {/* Badge Live Status - Enhanced */}
                {klipper.isConnected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 60,
                      zIndex: 100,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: `linear-gradient(135deg, ${THEME.cyanDim}, rgba(0, 243, 255, 0.05))`,
                      padding: "5px 10px",
                      borderRadius: "6px",
                      border: `1.5px solid ${THEME.cyan}`,
                      boxShadow: `0 0 15px ${THEME.cyanGlow}, inset 0 0 10px rgba(0, 243, 255, 0.1)`,
                    }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Radio size={11} color={THEME.cyan} strokeWidth={3} />
                    </motion.div>
                    <span
                      style={{
                        color: THEME.cyan,
                        fontSize: "9px",
                        fontWeight: 700,
                        fontFamily: '"JetBrains Mono", monospace',
                        letterSpacing: "0.5px",
                        textShadow: `0 0 8px ${THEME.cyanGlow}`,
                      }}
                    >
                      LIVE LINK ACTIVE
                    </span>
                  </motion.div>
                )}

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
                    gap: "16px", // Plus d'espace
                  }}
                >
                  {displayData.stats.map((stat: StatusStat, idx: number) => (
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
                  <span>
                    ENC: {Math.random().toString(36).substring(7).toUpperCase()}
                  </span>
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

// --- SOUS-COMPOSANTS ---

const HolographicContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    style={{
      width: "550px", // Plus large
      maxWidth: "95vw",
      backgroundColor: THEME.bg,
      border: `1px solid ${THEME.cyanDim}`,
      boxShadow: `0 20px 50px rgba(0,0,0,0.8), inset 0 0 30px ${THEME.cyanDim}`,
      padding: "20px",
      position: "relative",
      overflow: "hidden",
      fontFamily: '"Rajdhani", sans-serif',
      color: "#fff",
    }}
  >
    <style>{`
      @keyframes scanline {
        0% { transform: translateY(-100%); opacity: 0; }
        50% { opacity: 0.4; }
        100% { transform: translateY(100vh); opacity: 0; }
      }
      @keyframes flicker {
        0% { opacity: 0.97; }
        5% { opacity: 0.92; }
        10% { opacity: 0.98; }
        15% { opacity: 0.95; }
        20% { opacity: 0.99; }
        100% { opacity: 1; }
      }
      .holo-scanline {
        position: absolute; top: 0; left: 0; right: 0; height: 3px;
        background: ${THEME.cyan};
        opacity: 0.15;
        box-shadow: 0 0 15px ${THEME.cyan};
        animation: scanline 4s linear infinite;
        pointer-events: none;
        z-index: 10;
      }
      .holo-flicker {
        position: absolute; inset: 0; pointer-events: none; z-index: 5;
        animation: flicker 0.1s infinite;
        background: rgba(0, 243, 255, 0.01);
      }
      .holo-grid-overlay {
        position: absolute; inset: 0; pointer-events: none; z-index: 2;
        background-image: linear-gradient(${THEME.cyanDim} 1px, transparent 1px),
                          linear-gradient(90deg, ${THEME.cyanDim} 1px, transparent 1px);
        background-size: 25px 25px;
        opacity: 0.1;
      }
    `}</style>

    <Corner pos="tl" />
    <Corner pos="tr" />
    <Corner pos="bl" />
    <Corner pos="br" />

    {children}
  </div>
);

const StatCard: React.FC<{ stat: StatusStat; index: number }> = ({
  stat,
  index,
}) => {
  const getStatusColor = () => {
    if (stat.status === "critical") return THEME.alert;
    if (stat.status === "warning") return THEME.warning;
    return THEME.cyan;
  };

  const color = getStatusColor();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: `1px solid rgba(0, 243, 255, 0.08)`,
        borderLeft: `3px solid ${color}`,
        padding: "12px",
        position: "relative",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          color: "rgba(255,255,255,0.4)",
          marginBottom: "6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {stat.label}
        {stat.icon || getAutoIcon(stat.label)}
      </div>

      <div
        style={{
          fontSize: "22px",
          fontWeight: 700,
          color: color,
          textShadow: `0 0 10px ${color}50`,
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        {stat.value}{" "}
        <span style={{ fontSize: "12px", opacity: 0.6, fontWeight: 400 }}>
          {stat.unit}
        </span>
      </div>

      {stat.progress !== undefined && (
        <div
          style={{
            width: "100%",
            height: "3px",
            background: "rgba(0,0,0,0.4)",
            marginTop: "10px",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stat.progress}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              height: "100%",
              background: color,
              boxShadow: `0 0 10px ${color}`,
            }}
          />
        </div>
      )}
    </motion.div>
  );
};

const getAutoIcon = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes("temp")) return <Thermometer size={12} opacity={0.5} />;
  if (l.includes("prog")) return <Gauge size={12} opacity={0.5} />;
  if (l.includes("sys")) return <Cpu size={12} opacity={0.5} />;
  return <Shield size={12} opacity={0.5} />;
};

const Corner: React.FC<{ pos: "tl" | "tr" | "bl" | "br" }> = ({ pos }) => {
  const base: React.CSSProperties = {
    position: "absolute",
    width: "12px",
    height: "12px",
    borderColor: THEME.cyan,
    borderStyle: "solid",
    opacity: 0.6,
  };

  if (pos === "tl") {
    base.top = 0;
    base.left = 0;
    base.borderWidth = "2px 0 0 2px";
  }
  if (pos === "tr") {
    base.top = 0;
    base.right = 0;
    base.borderWidth = "2px 2px 0 0";
  }
  if (pos === "bl") {
    base.bottom = 0;
    base.left = 0;
    base.borderWidth = "0 0 2px 2px";
  }
  if (pos === "br") {
    base.bottom = 0;
    base.right = 0;
    base.borderWidth = "0 2px 2px 0";
  }

  return <div style={base} />;
};

export default HolographicStatusOverlay;
