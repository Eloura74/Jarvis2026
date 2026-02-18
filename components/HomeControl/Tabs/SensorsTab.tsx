import React from "react";
import { motion } from "framer-motion";
import { Thermometer, Droplets } from "lucide-react";
import { Header } from "../Header";
import { HA_ENTITIES } from "../../../services/homeAssistantService";

interface SensorsTabProps {
  states: Record<string, unknown>;
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {HA_ENTITIES.SENSORS.map((sensor) => {
          const rawVal = (states[sensor.id] as { state?: string })?.state;
          const isAvailable =
            rawVal && rawVal !== "unavailable" && rawVal !== "unknown";
          const val = isAvailable ? rawVal : "N/A";

          return (
            <div
              key={sensor.id}
              className="px-3 py-2 rounded bg-black/40 border border-cyan-500/10 flex flex-col justify-center hover:border-cyan-500/30 transition-colors cursor-default"
            >
              <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/60 uppercase tracking-wider mb-0.5">
                {sensor.unit === "°C" ? (
                  <Thermometer size={10} />
                ) : (
                  <Droplets size={10} />
                )}
                <span className="truncate">{sensor.label}</span>
              </div>

              <div className="flex items-baseline gap-1">
                <span
                  className={`text-sm font-bold font-mono ${
                    isAvailable ? "text-white" : "text-gray-600"
                  }`}
                >
                  {val}
                </span>
                <span className="text-[10px] text-cyan-500/60 font-mono">
                  {isAvailable ? sensor.unit : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
