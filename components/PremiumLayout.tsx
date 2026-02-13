/**
 * PremiumLayout - Layout JARVIS Mark 2
 * Interface authentique avec Glassmorphism, animations et widgets interactifs.
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { JarvisHUDAuthentic } from "./JarvisHUDAuthentic";
import { JarvisCinematicBackground } from "./JarvisCinematicBackground";
import { LoadingOverlay } from "./LoadingOverlay";
import { SuccessRipple } from "./SuccessRipple";
import { AppPathsManager } from "./AppPathsManager";
import { ParticleSphere } from "./ParticleSphere";
import { FingerprintScanner } from "./FingerprintScanner";
import { NeuralFeed } from "./NeuralFeed";
import { MediaWidget } from "./MediaWidget";
import { WeatherWidget } from "./WeatherWidget";
import { NetworkWidget } from "./NetworkWidget";
import { CameraWidget } from "./CameraWidget";
import { HomeControlWidget } from "./HomeControlWidget";

interface PremiumLayoutProps {
  status: "idle" | "listening" | "processing" | "speaking";
  cpuUsage?: number;
  memoryUsage?: string;
  processes?: number;
  onMicrophoneClick: () => void;
  isListening: boolean;
  onCommand?: (command: string) => void;
  logs: Array<{
    source: string;
    message: string;
    type: "info" | "success" | "error" | "warning";
  }>;
  isProcessing: boolean;
  processingMessage?: string;
  successTrigger: number;
}

export const PremiumLayout: React.FC<PremiumLayoutProps> = ({
  status,
  cpuUsage = 0,
  memoryUsage = "0 GB",
  processes = 24,
  onMicrophoneClick,
  isListening,
  logs, // Utilisé pour générer le NeuralFeed initial si besoin
  isProcessing,
  processingMessage,
  successTrigger,
}) => {
  const [isAppPathsOpen, setIsAppPathsOpen] = useState(false);
  const currentTime = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const currentDate = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Mock messages for Neural Feed demonstration (replace with real data later)
  const mockMessages = logs
    .map((log, i) => ({
      id: `msg-${i}`,
      text: log.message,
      sender: log.source === "USER" ? "user" : "jarvis",
      timestamp: new Date(),
    }))
    .filter((m) => m.sender === "user" || m.sender === "jarvis"); // Filter only chat-like messages

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-black text-cyan-500 font-rajdhani selection:bg-cyan-500/30">
      {/* ========================================
          BACKGROUND LAYER
          ======================================== */}
      <div className="absolute inset-0 z-0">
        <img
          src="/bg-wires1.png"
          alt="Background"
          className="fixed inset-0 w-full h-full object-cover opacity-30 z-0"
        />
        <JarvisCinematicBackground />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80" />
        <div className="jarvis-scanlines opacity-20" />
        <div className="jarvis-vignette opacity-50" />
      </div>

      {/* ========================================
          MAIN HUD LAYER (Interactive)
          ======================================== */}
      <div className="relative z-10 w-full h-screen grid grid-cols-[350px_1fr_350px] p-6 gap-6 pointer-events-none">
        {/* === LEFT COLUMN === */}
        <div className="flex flex-col gap-6 pointer-events-auto z-20">
          {/* SYSTEM STATUS PANEL */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="jarvis-panel-glass p-4 rounded-2xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl relative overflow-hidden group hover:border-cyan-400/50 transition-all duration-500 shadow-[0_0_20px_rgba(0,229,255,0.1)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold tracking-widest text-cyan-300 drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]">
                SYS.STATUS
              </h2>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#00e5ff]" />
            </div>

            <div className="space-y-4">
              {/* CPU */}
              <div>
                <div className="flex justify-between text-xs mb-1 opacity-90 tracking-wider text-cyan-200">
                  <span>CPU LOAD</span>
                  <span className="text-cyan-300 font-bold">{cpuUsage}%</span>
                </div>
                <div className="h-1 bg-cyan-900/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cpuUsage}%` }}
                    className="h-full bg-cyan-400 shadow-[0_0_10px_#00e5ff]"
                  />
                </div>
              </div>

              {/* MEMORY */}
              <div>
                <div className="flex justify-between text-xs mb-1 opacity-90 tracking-wider text-cyan-200">
                  <span>RAM USAGE</span>
                  <span className="text-cyan-300 font-bold">{memoryUsage}</span>
                </div>
                <div className="h-1 bg-cyan-900/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${parseFloat(memoryUsage)}%` }} // Adjust max as needed
                    className="h-full bg-cyan-400 shadow-[0_0_10px_#00e5ff]"
                  />
                </div>
              </div>

              {/* PROCESSES */}
              <div className="flex justify-between items-center border-t border-cyan-400/30 pt-4">
                <span className="text-xs opacity-90 tracking-wider text-cyan-200">
                  ACTIVE PROCESSES
                </span>
                <span className="text-xl font-bold text-cyan-300 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
                  {processes}
                </span>
              </div>
            </div>

            {/* DECORATIVE CORNER */}
            <div className="absolute top-0 right-0 p-2 opacity-80">
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path
                  d="M0 0 L20 0 L20 20"
                  fill="none"
                  stroke="#00e5ff"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </motion.div>

          {/* WEATHER WIDGET */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <WeatherWidget />
          </motion.div>

          {/* MEDIA WIDGET */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <MediaWidget />
          </motion.div>

          {/* CAMERA WIDGET & HOME CONTROL */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex gap-4 h-64" // Fixed height to align both widgets
          >
            <div className="flex-1 h-full">
              <CameraWidget />
            </div>
            <div className="h-full">
              <HomeControlWidget />
            </div>
          </motion.div>

          {/* NETWORK WIDGET (NEW) */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-auto mb-10" // Push to bottom if space is available
          >
            <NetworkWidget />
          </motion.div>
        </div>

        {/* === CENTER COLUMN (HUD) === */}
        <div className="relative flex items-center justify-center">
          {/* CENTRAL HUD */}
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <JarvisHUDAuthentic status={status} size={600} showDetails={true} />
          </div>

          {/* PARTICLE SPHERE OVERLAY - INCREASED VISIBILITY & Z-INDEX */}
          <div className="absolute inset-0 flex items-center justify-center z-10 mix-blend-screen pointer-events-none filter brightness-125 contrast-125 -translate-y-16">
            <ParticleSphere
              isActive={status === "speaking"}
              isListening={isListening || status === "listening"}
              audioLevel={status === "speaking" ? 80 : 0}
              size={850}
              baseColor="#00e5ff"
              activeColor="#00e5ff"
            />
          </div>

          {/* LOGO */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute top-12 text-center z-0"
          >
            <h1 className="text-6xl font-bold tracking-[0.5em] text-white/90 drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]">
              J.A.R.V.I.S
            </h1>
            <div className="text-[10px] tracking-[1em] opacity-60 text-cyan-200 mt-2">
              JUST A RATHER VERY INTELLIGENT SYSTEM
            </div>
          </motion.div>

          {/* MICROPHONE BUTTON (Floating at bottom center) - ENHANCED */}
          <motion.div
            className="absolute bottom-32  pointer-events-auto z-50 py-10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative group flex flex-col items-center justify-center">
              {/* Outer Rotating Ring */}
              <div className="absolute inset-0 rounded-full border border-cyan-500/30 w-32 h-32 -ml-[16px] -mt-[16px] animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-0 rounded-full border border-cyan-500/20 w-40 h-40 -ml-[32px] -mt-[32px] animate-[spin_15s_linear_infinite_reverse]" />

              <div
                className={`absolute inset-0 rounded-full blur-2xl transition-all duration-300 w-24 h-24 ${isListening ? "bg-red-500/60" : "bg-cyan-500/30 group-hover:bg-cyan-500/50"}`}
              />

              <button
                onClick={onMicrophoneClick}
                className={`relative w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-300 backdrop-blur-md z-10 ${
                  isListening
                    ? "border-red-500 bg-red-900/30 text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.6)] animate-pulse"
                    : "border-cyan-500/50 bg-black/60 text-cyan-400 hover:border-cyan-400 hover:text-cyan-200 hover:shadow-[0_0_30px_rgba(0,229,255,0.5)]"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>

              <div className="absolute -bottom-10 text-xs tracking-[0.3em] font-bold opacity-80 whitespace-nowrap text-cyan-300">
                {isListening ? "LISTENING MODE" : "VOICE CONTROL"}
              </div>
            </div>
          </motion.div>
        </div>

        {/* === RIGHT COLUMN === */}
        <div className="flex flex-col gap-4 pointer-events-auto h-[90vh] mt-8 z-20">
          {/* DATE & TIME PANEL */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="jarvis-panel-glass p-6 rounded-2xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl group hover:border-cyan-400/50 shadow-[0_0_20px_rgba(0,229,255,0.1)]"
          >
            <div className="text-4xl font-light text-white mb-1 tracking-wider overflow-hidden drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              {currentTime}
            </div>
            <div className="text-sm text-cyan-300 tracking-widest uppercase opacity-90 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
              {currentDate}
            </div>
          </motion.div>

          {/* NEURAL FEED (Chat) */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex-1 jarvis-panel-glass rounded-2xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl overflow-hidden relative flex flex-col min-h-[400px] shadow-[0_0_20px_rgba(0,229,255,0.1)]"
          >
            <div className="p-4 border-b border-cyan-400/30 bg-cyan-900/20 flex justify-between items-center">
              <h3 className="text-sm font-bold tracking-widest text-cyan-300 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
                NEURAL FEED
              </h3>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_5px_#00e5ff]" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/20" />
              </div>
            </div>

            <div className="flex-1 overflow-hidden p-2">
              <NeuralFeed messages={mockMessages as any} />
            </div>

            {/* Input Area Placeholder (Visual only) */}
            <div className="p-3 border-t border-cyan-400/30 bg-black/20">
              <div className="h-8 rounded border border-cyan-500/30 flex items-center px-3 text-xs text-cyan-400/70 italic tracking-wider">
                Waiting for input...
              </div>
            </div>
          </motion.div>

          {/* FINGERPRINT LARGE */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl group hover:border-cyan-400/50 transition-all shadow-[0_0_20px_rgba(0,229,255,0.1)]"
          >
            <FingerprintScanner size={120} isActive={true} />
            <div className="text-xs tracking-[0.3em] text-cyan-300 mt-4 opacity-90 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
              BIOMETRIC SCAN
            </div>
            <div className="text-[10px] tracking-widest text-green-400 mt-1 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
              ACCESS GRANTED
            </div>
          </motion.div>

          <motion.button
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            onClick={() => setIsAppPathsOpen(true)}
            className="w-full py-3 border border-cyan-400/30 rounded text-sm tracking-widest hover:bg-cyan-500/20 transition-all bg-black/30 backdrop-blur-sm text-cyan-300 hover:text-cyan-100 shadow-[0_0_10px_rgba(0,229,255,0.1)]"
          >
            CONFIG APPS
          </motion.button>
        </div>
      </div>

      {/* OVERLAYS */}
      <AppPathsManager
        isOpen={isAppPathsOpen}
        onClose={() => setIsAppPathsOpen(false)}
      />
      <LoadingOverlay isVisible={isProcessing} message={processingMessage} />
      <SuccessRipple trigger={successTrigger} />
    </div>
  );
};
