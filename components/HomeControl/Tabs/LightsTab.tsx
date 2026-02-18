import React from "react";
import { motion } from "framer-motion";
import { Film, Briefcase, Moon, Power } from "lucide-react";
import { Header } from "../Header";
import { SceneButton } from "../SceneButton";
import { HA_ENTITIES } from "../../../services/homeAssistantService";

interface LightsTabProps {
  states: Record<string, any>;
  onToggle: (entityId: string) => void;
  onRunScene: (sceneName: string) => void;
}

export const LightsTab: React.FC<LightsTabProps> = ({
  states,
  onToggle,
  onRunScene,
}) => {
  return (
    <motion.div
      key="lights"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="space-y-4">
        <Header title="QUICK SCENES" />
        <div className="grid grid-cols-3 gap-4">
          <SceneButton
            icon={<Film size={20} />}
            label="CINEMA"
            color="text-purple-400"
            onClick={() => onRunScene("cinema")}
          />
          <SceneButton
            icon={<Briefcase size={20} />}
            label="WORK"
            color="text-blue-400"
            onClick={() => onRunScene("work")}
          />
          <SceneButton
            icon={<Moon size={20} />}
            label="SLEEP"
            color="text-indigo-400"
            onClick={() => onRunScene("sleep")}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Header title="LIGHTS CONTROL" />
        <div className="flex flex-col gap-2">
          {HA_ENTITIES.LIGHTS.map((light) => {
            const state = states[light.id]?.state;
            const isOn = state === "on";
            return (
              <div
                key={light.id}
                onClick={() => onToggle(light.id)}
                className={`flex items-center justify-between px-3 py-2 rounded border border-l-2 transition-all cursor-pointer group ${
                  isOn
                    ? "bg-cyan-900/20 border-cyan-400/30 border-l-cyan-400"
                    : "bg-black/40 border-white/5 border-l-gray-700 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-full ${isOn ? "bg-cyan-500 text-black shadow-[0_0_10px_#00e5ff]" : "bg-gray-800 text-gray-500"}`}
                  >
                    <Power size={12} />
                  </div>
                  <span
                    className={`text-[10px] font-bold tracking-wider uppercase ${
                      isOn
                        ? "text-cyan-100"
                        : "text-gray-400 group-hover:text-cyan-200"
                    }`}
                  >
                    {light.label}
                  </span>
                </div>

                {/* Status Indicator */}
                <span
                  className={`text-[9px] font-mono ${isOn ? "text-cyan-400" : "text-gray-600"}`}
                >
                  {isOn ? "ON" : "OFF"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
