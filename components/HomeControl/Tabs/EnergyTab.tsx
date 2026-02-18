import React from "react";
import { motion } from "framer-motion";
import { Header } from "../Header";
import { EnergyWidget } from "../../EnergyWidget";

export const EnergyTab: React.FC = () => {
  return (
    <motion.div
      key="energy"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <Header title="POWER GRID" />
      <div className="space-y-6">
        <EnergyWidget
          currentPower={450} // TODO: Lier à HA
          dailyConsumption={12.5} // TODO: Lier à HA
          isPeakHours={false} // TODO: Lier à HA
        />

        <div className="p-6 bg-black/40 rounded-xl border border-white/5 space-y-4">
          <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">
            Appareils
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">🖥️ PC Jarvis</span>
            <span className="text-cyan-400 font-mono">120 W</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">🖨️ Imprimantes</span>
            <span className="text-purple-400 font-mono">320 W</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">💡 Lumières</span>
            <span className="text-yellow-400 font-mono">10 W</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
