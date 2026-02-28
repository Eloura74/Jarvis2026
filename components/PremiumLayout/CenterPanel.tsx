import React from "react";
import { motion } from "framer-motion";
import { JarvisHUDAuthentic } from "../JarvisHUDAuthentic";
import { RealSphere } from "../RealSphere";
import { useAppSettings } from "../../hooks/useAppSettings";

interface CenterPanelProps {
  status: "idle" | "listening" | "processing" | "speaking";
  isListening: boolean;
  onMicrophoneClick: () => void;
}

export const CenterPanel: React.FC<CenterPanelProps> = ({
  status,
  isListening,
  onMicrophoneClick,
}) => {
  const { settings } = useAppSettings();

  // Helper pour avoir des couleurs adaptées à la 3D
  const getSphereColors = (theme: string) => {
    switch (theme) {
      case "ironman":
        return { base: "#b48b00", active: "#ff3300", listen: "#ff0000" }; // Or/Rouge sombre
      case "matrix":
        return { base: "#006600", active: "#00ff00", listen: "#00cc00" }; // Vert sombre
      case "copper":
        return { base: "#b46d29", active: "#f59e0b", listen: "#ef4444" }; // Cuivre / Bois (Teintes dorées/brunes)
      case "wood":
        return { base: "#4a332a", active: "#8c6241", listen: "#ef4444" }; // Bois Élégant
      case "classic":
      default:
        return { base: "#006080", active: "#8a0000", listen: "#8a0000" }; // Cyan sombre
    }
  };

  const sphereColors = getSphereColors(settings.theme);

  // Pour le HUD 2D
  const getHUDColor = (theme: string, componentStatus: string) => {
    if (componentStatus === "processing") return "#ffd700"; // Toujours jaune quand ça charge

    switch (theme) {
      case "ironman":
        return "#facc15"; // Jaune/Or
      case "matrix":
        return "#4ade80"; // Vert
      case "copper":
        return "#f59e0b"; // Ambre
      case "wood":
        return "#8c6241"; // Bois
      case "classic":
      default:
        return "#00e5ff"; // Cyan
    }
  };

  const hudColor = getHUDColor(settings.theme, status);

  return (
    <div
      className="relative flex items-center justify-center 
                    order-1 md:order-2
                    min-h-[400px] md:min-h-[500px] xl:min-h-0"
    >
      {/* CENTRAL HUD - Taille adaptative */}
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <JarvisHUDAuthentic
          status={status}
          size={
            typeof window !== "undefined" && window.innerWidth < 768
              ? 300
              : window.innerWidth < 1280
                ? 400
                : 600
          }
          showDetails={true}
          themeColor={hudColor}
        />
      </div>

      {/* REAL SPHERE OVERLAY - Responsive */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none -translate-y-16">
        <RealSphere
          isActive={status === "speaking" || status === "processing"}
          isListening={isListening || status === "listening"}
          audioLevel={status === "speaking" ? 0.8 : 0}
          size={
            typeof window !== "undefined" && window.innerWidth < 768
              ? 320
              : window.innerWidth < 1280
                ? 450
                : 600
          }
          baseColor={sphereColors.base}
          activeColor={sphereColors.active}
          listeningColor={sphereColors.listen}
        />
      </div>

      {/* DATA TRANSFER OVERLAY (Fils.png) */}
      {/*
      <motion.div
        initial={{ opacity: 0 }}
        animate={
          status === "speaking"
            ? {
                opacity: [0.2, 0.5, 0.3, 0.7, 0.2], // Flicker aléatoire
                filter: [
                  "brightness(1.2) contrast(1.1)",
                  "brightness(2.2) contrast(1.6)", // Flash intense
                  "brightness(1.4) contrast(1.2)",
                  "brightness(1.8) contrast(1.4)",
                  "brightness(1.2) contrast(1.1)",
                ],
              }
            : { opacity: 0 }
        }
        transition={{
          duration: 2, // Cycle plus long pour effet "courant" qui passe
          repeat: Infinity,
          ease: "linear",
          times: [0, 0.3, 0.4, 0.7, 1],
        }}
        className="fixed inset-0 z-0 pointer-events-none mix-blend-screen"
        style={{
          backgroundImage: "url('/Fils.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      */}

      {/* LOGO - Responsive */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-4 md:top-8 xl:top-12 text-center z-0"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-24 blur-[50px] -z-10 rounded-full"
          style={{ backgroundColor: `var(--cyan-primary)`, opacity: 0.2 }}
        />

        <h1
          className="text-3xl md:text-5xl xl:text-6xl font-bold tracking-[0.3em] md:tracking-[0.5em] text-white border-b border-transparent"
          style={{ filter: `drop-shadow(0 0 10px var(--cyan-glow))` }}
        >
          J.A.R.V.I.S
        </h1>
        <div
          className="text-[8px] md:text-[10px] tracking-[0.5em] md:tracking-[1em] opacity-80 mt-1 md:mt-2 hidden md:block font-light"
          style={{
            color: `var(--cyan-primary)`,
            filter: `drop-shadow(0 0 2px var(--cyan-primary))`,
          }}
        >
          JUST A RATHER VERY INTELLIGENT SYSTEM
        </div>
      </motion.div>

      {/* MICROPHONE BUTTON - Responsive - CLEAN & SLEEK DESIGN */}
      <motion.div
        className="absolute bottom-8 md:bottom-16 pointer-events-auto z-50 py-4 md:py-10"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative group flex flex-col items-center justify-center">
          {/* Sleek Rotating Rings */}
          {/*
          <div className="hidden md:block absolute inset-0 rounded-full border border-cyan-400/20 w-32 md:w-36 h-32 md:h-36 -ml-[16px] md:-ml-[18px] -mt-[16px] md:-mt-[18px] animate-[spin_8s_linear_infinite]" />
          <div className="hidden md:block absolute inset-0 rounded-full border border-cyan-500/10 w-40 md:w-44 h-40 md:h-44 -ml-[32px] md:-ml-[34px] -mt-[32px] md:-mt-[34px] animate-[spin_12s_linear_infinite_reverse]" />
          */}

          {/* Pulse Effect */}
          <div
            className={`absolute inset-0 rounded-full blur-2xl transition-all duration-300 w-24 md:w-28 h-24 md:h-28 -ml-[4px] md:-ml-[4px] -mt-[4px] md:-mt-[4px]`}
            style={{
              backgroundColor: isListening
                ? "rgba(239, 68, 68, 0.4)"
                : "var(--cyan-primary)",
              opacity: isListening ? 1 : 0.2,
            }}
          />

          <button
            onClick={onMicrophoneClick}
            className={`relative w-24 md:w-28 h-24 md:h-28 rounded-full border flex items-center justify-center transition-all duration-300 backdrop-blur-xl z-10 shadow-[0_0_20px_rgba(0,0,0,0.5)]`}
            style={{
              backgroundColor: isListening
                ? "rgba(69, 10, 10, 0.4)"
                : "rgba(0, 0, 0, 0.4)",
              color: isListening ? "#ef4444" : "var(--cyan-primary)",
              boxShadow: isListening
                ? "0 0 30px rgba(239,68,68,0.4)"
                : "0 0 20px rgba(0,0,0,0.5)",
              borderColor: isListening
                ? "rgba(239,68,68,0.5)"
                : "var(--cyan-primary)",
            }}
          >
            {/* Inner Ring */}
            <div
              className="absolute inset-1 rounded-full border"
              style={{ borderColor: "var(--cyan-primary)", opacity: 0.2 }}
            />

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-10 md:h-12 w-10 md:w-12 relative z-20 ${
                isListening ? "animate-pulse" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </button>

          <div
            className="absolute -bottom-8 md:-bottom-10 text-[10px] md:text-xs tracking-[0.3em] font-medium opacity-60 whitespace-nowrap uppercase"
            style={{ color: "var(--cyan-primary)" }}
          >
            {isListening ? "LISTENING" : "VOICE"}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
