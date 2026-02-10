/**
 * PremiumLayout - Layout principal premium JARVIS
 * Intègre tous les composants UI avec HUD futuriste
 */

import React from "react";
import { ParticleField } from "./ParticleField";
import { CoreHUD } from "./CoreHUD";
import { StatCard } from "./StatCard";
import { CommandZone } from "./CommandZone";
import { TerminalLogs } from "./TerminalLogs";
import { LoadingOverlay } from "./LoadingOverlay";
import { SuccessRipple } from "./SuccessRipple";

interface PremiumLayoutProps {
  // HUD status
  status: "idle" | "listening" | "processing" | "speaking";

  // Stats
  commandCount: number;
  cpuUsage?: number;
  memoryUsage?: string;

  // Command
  onCommand: (command: string) => void;
  onMicrophoneClick: () => void;
  isListening: boolean;

  // Logs
  logs: Array<{
    source: string;
    message: string;
    type: "info" | "success" | "error" | "warning";
  }>;

  // Loading/Success
  isProcessing: boolean;
  processingMessage?: string;
  successTrigger: number;

  // Suggestions
  suggestions?: Array<{ label: string; command: string; icon?: string }>;
}

export const PremiumLayout: React.FC<PremiumLayoutProps> = ({
  status,
  commandCount,
  cpuUsage = 0,
  memoryUsage = "0 GB",
  onCommand,
  onMicrophoneClick,
  isListening,
  logs,
  isProcessing,
  processingMessage,
  successTrigger,
  suggestions,
}) => {
  const currentTime = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const currentDate = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-gradient-radial from-slate-900/50 via-slate-950 to-black">
      {/* Arrière-plan particules */}
      <ParticleField />

      {/* Grid perspective */}
      <div className="perspective-grid opacity-20" />

      {/* Stats Cards Coins */}
      <StatCard
        position="top-left"
        title="System"
        value={`${cpuUsage}%`}
        subtitle={`RAM: ${memoryUsage}`}
        icon={
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
          </svg>
        }
      />

      <StatCard
        position="top-right"
        title="Commands"
        value={commandCount}
        subtitle={`Status: ${status.toUpperCase()}`}
        icon={
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        }
        accentColor={
          status === "idle"
            ? "#06b6d4"
            : status === "listening"
              ? "#22d3ee"
              : "#a855f7"
        }
      />

      <StatCard
        position="bottom-left"
        title="Time"
        value={currentTime}
        subtitle={currentDate}
        icon={
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />

      <StatCard
        position="bottom-right"
        title="Voice"
        value={isListening ? "ON" : "STANDBY"}
        subtitle="Wake: OFF"
        icon={
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        }
        accentColor={isListening ? "#10b981" : "#6b7280"}
      />

      {/* Container principal centré */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8 space-y-8">
        {/* CoreHUD */}
        <div className="mb-8">
          <CoreHUD status={status} />
        </div>

        {/* Barre status */}
        <div className="backdrop-blur-md bg-cyan-900/10 border border-cyan-500/30 rounded-full px-8 py-2 shadow-lg">
          <p className="text-cyan-400 text-sm font-mono tracking-wider">
            ▸ JARVIS ONLINE ◂ AI Model: Gemini 2.0 Flash
          </p>
        </div>

        {/* Zone Commande */}
        <CommandZone
          onCommand={onCommand}
          onMicrophoneClick={onMicrophoneClick}
          isListening={isListening}
          suggestions={suggestions}
        />

        {/* Terminal Logs */}
        <TerminalLogs logs={logs} maxHeight="250px" />
      </div>

      {/* Overlays */}
      <LoadingOverlay isVisible={isProcessing} message={processingMessage} />

      <SuccessRipple trigger={successTrigger} />
    </div>
  );
};
