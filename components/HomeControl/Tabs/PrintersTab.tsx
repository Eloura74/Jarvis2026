import React from "react";
import { motion } from "framer-motion";
import { Header } from "../Header";
import { HA_ENTITIES } from "../../../services/homeAssistantService";

interface PrintersTabProps {
  states: Record<string, unknown>;
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
      <div className="flex flex-col gap-2">
        {HA_ENTITIES.PRINTERS.map((printer) => {
          const bed = (states[printer.bed] as { state?: number })?.state ?? 0;
          const ext = (states[printer.ext] as { state?: number })?.state ?? 0;
          const progressState = (states[printer.progress] as { state?: string })
            ?.state;
          const progress =
            progressState && progressState !== "unavailable"
              ? Math.round(Number(progressState))
              : 0;
          const isActive = progress > 0 && progress < 100;

          return (
            <div
              key={printer.name}
              className={`flex items-center gap-2 p-2 rounded border border-l-2 transition-all group ${
                isActive
                  ? "bg-purple-900/20 border-purple-500/30 border-l-purple-500"
                  : "bg-black/40 border-white/5 border-l-gray-600"
              }`}
            >
              {/* Name & Progress Info */}
              <div className="flex flex-col w-20 shrink-0">
                <span
                  className={`text-[10px] font-bold tracking-wider truncate ${
                    isActive ? "text-purple-300" : "text-gray-500"
                  }`}
                >
                  {printer.name}
                </span>
                <span className="text-[9px] font-mono text-gray-500">
                  {isActive ? `${progress}%` : "IDLE"}
                </span>
              </div>

              {/* Progress Bar (Middle - Expanded) */}
              <div className="flex-1 h-1.5 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full transition-all duration-700 ease-out ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_5px_#d946ef]"
                      : "bg-gray-800"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Temps (Right - Compact) */}
              <div className="flex flex-col items-end gap-0.5 shrink-0 min-w-[30px]">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[8px] text-gray-600">N</span>
                  <span
                    className={`text-[9px] font-mono ${
                      ext > 50 ? "text-pink-400" : "text-gray-500"
                    }`}
                  >
                    {ext}°
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[8px] text-gray-600">B</span>
                  <span
                    className={`text-[9px] font-mono ${
                      bed > 40 ? "text-blue-400" : "text-gray-500"
                    }`}
                  >
                    {bed}°
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
