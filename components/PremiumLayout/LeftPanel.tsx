import React from "react";
import { motion } from "framer-motion";
import { SystemStatusWidget } from "../SystemStatusWidget";
import { WeatherWidget } from "../WeatherWidget";
import { MediaWidget } from "../MediaWidget";
import { CameraWidget } from "../CameraWidget";
import { HomeControlWidget } from "../HomeControlWidget";
import { NetworkWidget } from "../NetworkWidget";

interface LeftPanelProps {
  cpuUsage: number;
  memoryUsage: string;
  processes: number;
  onToggleLogs?: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  cpuUsage,
  memoryUsage,
  processes,
  onToggleLogs,
}) => {
  return (
    <div className="flex flex-col gap-3 md:gap-4 xl:gap-6 pointer-events-auto z-20">
      {/* SYSTEM STATUS PANEL */}
      <SystemStatusWidget
        cpuUsage={cpuUsage}
        memoryUsage={memoryUsage}
        processes={processes}
        onClick={onToggleLogs}
      />

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
  );
};
