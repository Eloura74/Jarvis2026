import React from "react";
import { motion } from "framer-motion";
import { DoorOpen } from "lucide-react";
import { Header } from "../Header";
import { HA_ENTITIES } from "../../../services/homeAssistantService";

interface DoorsTabProps {
  states: Record<string, unknown>;
}

export const DoorsTab: React.FC<DoorsTabProps> = ({ states }) => {
  return (
    <motion.div
      key="doors"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-3"
    >
      <Header title="SECURITY GATES" />
      <div className="flex flex-col gap-2">
        {HA_ENTITIES.DOORS.map((door) => {
          const isOpen =
            (states[door.id] as { state?: string })?.state === "on";
          return (
            <div
              key={door.id}
              className={`flex items-center justify-between px-3 py-2 rounded border border-l-2 transition-all duration-300 group ${
                isOpen
                  ? "bg-red-950/20 border-red-900/40 border-l-red-500 hover:bg-red-900/30"
                  : "bg-cyan-950/10 border-cyan-900/20 border-l-cyan-500 hover:bg-cyan-900/20"
              }`}
            >
              <span
                className={`text-[10px] font-bold tracking-widest uppercase ${isOpen ? "text-red-300" : "text-cyan-300/70"}`}
              >
                {door.label}
              </span>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] font-mono ${isOpen ? "text-red-400 animate-pulse" : "text-cyan-500/50"}`}
                >
                  {isOpen ? "BREACH" : "SECURE"}
                </span>
                <DoorOpen
                  size={14}
                  className={`${isOpen ? "text-red-500" : "text-cyan-500/30"}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
