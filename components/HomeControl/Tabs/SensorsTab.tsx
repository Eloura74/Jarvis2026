import React from "react";
import { motion } from "framer-motion";
import { Thermometer, Droplets } from "lucide-react";
import { Header } from "../Header";
import { HA_ENTITIES } from "../../../services/homeAssistantService";

interface SensorsTabProps {
  states: Record<string, any>;
}

export const SensorsTab: React.FC<SensorsTabProps> = ({ states }) => {
  return (
    <motion.div
      key="sensors"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <Header title="ENV. SENSORS" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {HA_ENTITIES.SENSORS.map((sensor) => {
          const rawVal = states[sensor.id]?.state;
          const isAvailable =
            rawVal && rawVal !== "unavailable" && rawVal !== "unknown";
          const val = isAvailable ? rawVal : "N/A";

          return (
            <div
              key={sensor.id}
              className="p-5 rounded-lg bg-black/40 border border-cyan-500/10 flex flex-col items-center justify-center hover:border-cyan-500/30 transition-colors cursor-default"
            >
              <div className="flex items-center gap-2 text-xs text-cyan-400/70 mb-2 uppercase tracking-wider">
                {sensor.unit === "°C" ? (
                  <Thermometer size={14} />
                ) : (
                  <Droplets size={14} />
                )}
                <span>{sensor.label}</span>
              </div>
              <span
                className={`text-2xl font-bold ${
                  isAvailable
                    ? "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]"
                    : "text-gray-600 text-base"
                }`}
              >
                {val}
                <span className="text-sm text-cyan-500/80 ml-1">
                  {isAvailable ? sensor.unit : ""}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
