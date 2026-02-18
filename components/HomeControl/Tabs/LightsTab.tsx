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

      <div className="space-y-4">
        <Header title="LIGHTS CONTROL" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {HA_ENTITIES.LIGHTS.map((light) => {
            const state = states[light.id]?.state;
            const isOn = state === "on";
            return (
              <div
                key={light.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 group ${
                  isOn
                    ? "bg-cyan-900/20 border-cyan-400/50 shadow-[0_0_15px_rgba(0,229,255,0.1)]"
                    : "bg-black/40 border-gray-800 hover:border-cyan-500/30"
                }`}
              >
                <span
                  className={`text-sm font-bold tracking-wider ${
                    isOn
                      ? "text-cyan-100"
                      : "text-gray-400 group-hover:text-cyan-200"
                  }`}
                >
                  {light.label}
                </span>
                <button
                  onClick={() => onToggle(light.id)}
                  className={`p-3 rounded-full transition-all duration-300 ${
                    isOn
                      ? "bg-cyan-400 text-black shadow-[0_0_15px_#00e5ff] scale-110"
                      : "bg-gray-800 text-gray-500 hover:text-cyan-400 hover:bg-gray-700"
                  }`}
                >
                  <Power size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
