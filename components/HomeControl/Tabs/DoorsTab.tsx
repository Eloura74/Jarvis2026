import React from "react";
import { motion } from "framer-motion";
import { DoorOpen } from "lucide-react";
import { Header } from "../Header";
import { HA_ENTITIES } from "../../../services/homeAssistantService";

interface DoorsTabProps {
  states: Record<string, any>;
}

export const DoorsTab: React.FC<DoorsTabProps> = ({ states }) => {
  return (
    <motion.div
      key="doors"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <Header title="SECURITY STATUS" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {HA_ENTITIES.DOORS.map((door) => {
          const isOpen = states[door.id]?.state === "on";
          return (
            <div
              key={door.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-500 ${
                isOpen
                  ? "bg-red-950/30 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  : "bg-green-950/10 border-green-500/20"
              }`}
            >
              <span className="text-xs text-cyan-100 font-mono tracking-wider">
                {door.label}
              </span>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold tracking-widest ${
                  isOpen
                    ? "bg-red-600 text-white shadow-[0_0_10px_#ef4444]"
                    : "bg-green-500/10 text-green-500/80"
                }`}
              >
                <DoorOpen size={14} />
                <span>{isOpen ? "OPEN" : "CLOSED"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
