import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { fetchHAStates, toggleEntity } from "../services/homeAssistantService";

// Composants extraits
import { Sidebar, Tab } from "./HomeControl/Sidebar";
import { LightsTab } from "./HomeControl/Tabs/LightsTab";
import { EnergyTab } from "./HomeControl/Tabs/EnergyTab";
import { SensorsTab } from "./HomeControl/Tabs/SensorsTab";
import { PrintersTab } from "./HomeControl/Tabs/PrintersTab";
import { DoorsTab } from "./HomeControl/Tabs/DoorsTab";
import { ChevronRight } from "lucide-react";

export const HomeControlWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("LIGHTS");
  const [states, setStates] = useState<Record<string, unknown>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  // Polling des états HA
  useEffect(() => {
    const loadStates = async () => {
      const data = await fetchHAStates();
      setStates(data);
    };
    loadStates();
    const interval = setInterval(loadStates, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async (entityId: string) => {
    const currentState =
      (states[entityId] as { state?: string })?.state || "off";
    await toggleEntity(entityId, currentState);
    // Optimistic update
    setStates((prev) => ({
      ...prev,
      [entityId]: {
        ...(prev[entityId] as object),
        state: currentState === "on" ? "off" : "on",
      },
    }));
  };

  const runScene = (sceneName: string) => {
    console.log(`🎬 Running scene: ${sceneName}`);
  };

  return (
    <motion.div
      className="h-full flex flex-row overflow-hidden bg-black/80 backdrop-blur-xl border-l border-cyan-500/20 shadow-2xl relative z-50 transition-all duration-500 ease-in-out"
      initial={{ width: 60 }} // Largeur pliée (sidebar uniquement)
      animate={{ width: isExpanded ? 400 : 60 }} // Largeur dépliée vs pliée
      onClick={() => !isExpanded && setIsExpanded(true)} // Déplie au clic si plié
    >
      {/* SIDEBAR (Toujours visible) */}
      <div className="relative h-full">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Toggle Button (si déjà déplié, pour replier) */}
        {isExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="absolute top-1/2 -right-3 transform -translate-y-1/2 bg-cyan-500 text-black p-1 rounded-full shadow-lg z-50 hover:bg-cyan-400"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* CONTENT AREA (Visible uniquement si déplié) */}
      <div
        className={`flex-1 p-4 overflow-y-auto custom-scrollbar relative transition-opacity duration-300 ${isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-transparent pointer-events-none" />

        <AnimatePresence mode="wait">
          {isExpanded && activeTab === "LIGHTS" && (
            <LightsTab
              states={states}
              onToggle={handleToggle}
              onRunScene={runScene}
            />
          )}

          {isExpanded && activeTab === "ENERGY" && <EnergyTab />}
          {isExpanded && activeTab === "SENSORS" && (
            <SensorsTab states={states} />
          )}
          {isExpanded && activeTab === "PRINTERS" && (
            <PrintersTab states={states} />
          )}
          {isExpanded && activeTab === "DOORS" && <DoorsTab states={states} />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
