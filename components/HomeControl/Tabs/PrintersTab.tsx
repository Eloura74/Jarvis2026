import React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Header } from "../Header";
import { HA_ENTITIES } from "../../../services/homeAssistantService";

interface PrintersTabProps {
  states: Record<string, any>;
}

export const PrintersTab: React.FC<PrintersTabProps> = ({ states }) => {
  return (
    <motion.div
      key="printers"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <Header title="3D PRINTERS" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {HA_ENTITIES.PRINTERS.map((printer) => {
          const bed = states[printer.bed]?.state ?? 0;
          const ext = states[printer.ext]?.state ?? 0;
          const progressState = states[printer.progress]?.state;
          const progress =
            progressState && progressState !== "unavailable"
              ? Math.round(Number(progressState))
              : 0;

          return (
            <div
              key={printer.name}
              className="p-4 rounded-lg bg-black/40 border border-purple-500/20 group hover:border-purple-500/40 transition-all"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-purple-300 tracking-wider group-hover:text-purple-200 transition-colors">
                  {printer.name}
                </span>
                <span className="text-xs text-purple-400 font-mono">
                  {progress}%
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden mb-4 border border-purple-500/10">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_10px_#d946ef] transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <Activity size={12} className="text-pink-400" /> NZ:{" "}
                  <span className="text-gray-300">{ext}°C</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity size={12} className="text-blue-400" /> BD:{" "}
                  <span className="text-gray-300">{bed}°C</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
