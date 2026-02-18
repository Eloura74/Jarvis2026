/**
 * PremiumLayout - Layout JARVIS Mark 2
 * Interface authentique avec Glassmorphism, animations et widgets interactifs.
 */

import React, { useState } from "react";
import { LoadingOverlay } from "./LoadingOverlay";
import { SuccessRipple } from "./SuccessRipple";
import { ConfigPanelCRUD } from "./ConfigPanelCRUD";
import { FileExplorer } from "./FileExplorer";

import { BackgroundLayers } from "./PremiumLayout/BackgroundLayers";
import { LeftPanel } from "./PremiumLayout/LeftPanel";
import { CenterPanel } from "./PremiumLayout/CenterPanel";
import { RightPanel } from "./PremiumLayout/RightPanel";

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
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    candidatesTokens: number;
  };
  onToggleLogs?: () => void;
}

export const PremiumLayout: React.FC<PremiumLayoutProps> = ({
  status,
  cpuUsage = 0,
  memoryUsage = "0 GB",
  processes = 24,
  onMicrophoneClick,
  isListening,
  logs,
  isProcessing,
  processingMessage,
  successTrigger,
  tokenUsage,
  onToggleLogs,
}) => {
  const [isAppPathsOpen, setIsAppPathsOpen] = useState(false);
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(false);

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-black text-cyan-500 font-rajdhani selection:bg-cyan-500/30">
      {/* ========================================
          BACKGROUND LAYER
          ======================================== */}
      <BackgroundLayers />

      {/* ========================================
          MAIN HUD LAYER (Interactive) - RESPONSIVE
          ======================================== */}
      <div
        className="relative z-10 w-full min-h-screen grid 
                      grid-cols-1 
                      md:grid-cols-[300px_1fr] 
                      xl:grid-cols-[350px_1fr_350px] 
                      p-3 md:p-4 xl:p-6 
                      gap-3 md:gap-4 xl:gap-6 
                      pointer-events-none"
      >
        {/* === LEFT COLUMN === */}
        <LeftPanel
          cpuUsage={cpuUsage}
          memoryUsage={memoryUsage}
          processes={processes}
          onToggleLogs={onToggleLogs}
        />

        {/* === CENTER COLUMN (HUD) - RESPONSIVE === */}
        <CenterPanel
          status={status}
          isListening={isListening}
          onMicrophoneClick={onMicrophoneClick}
        />

        {/* === RIGHT COLUMN - RESPONSIVE === */}
        <RightPanel
          logs={logs}
          setIsAppPathsOpen={setIsAppPathsOpen}
          setIsFileExplorerOpen={setIsFileExplorerOpen}
        />
      </div>

      {/* OVERLAYS */}
      <ConfigPanelCRUD
        isOpen={isAppPathsOpen}
        onClose={() => setIsAppPathsOpen(false)}
        tokenUsage={tokenUsage}
      />
      <FileExplorer
        isOpen={isFileExplorerOpen}
        onClose={() => setIsFileExplorerOpen(false)}
      />
      <LoadingOverlay isVisible={isProcessing} message={processingMessage} />
      <SuccessRipple trigger={successTrigger} />
    </div>
  );
};
