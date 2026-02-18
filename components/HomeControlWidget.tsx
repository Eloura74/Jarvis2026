import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

import { fetchHAStates, toggleEntity } from "../services/homeAssistantService";

// Composants extraits
import { Sidebar, Tab } from "./HomeControl/Sidebar";
import { LightsTab } from "./HomeControl/Tabs/LightsTab";
import { EnergyTab } from "./HomeControl/Tabs/EnergyTab";
import { SensorsTab } from "./HomeControl/Tabs/SensorsTab";
import { PrintersTab } from "./HomeControl/Tabs/PrintersTab";
import { DoorsTab } from "./HomeControl/Tabs/DoorsTab";

export const HomeControlWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("LIGHTS");
  const [states, setStates] = useState<Record<string, any>>({});

  // Polling des états HA via le Service Centralisé
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
    const currentState = states[entityId]?.state;
    await toggleEntity(entityId, currentState);
    // Optimistic update
    setStates((prev) => ({
      ...prev,
      [entityId]: {
        ...prev[entityId],
        state: currentState === "on" ? "off" : "on",
      },
    }));
  };

  const runScene = (sceneName: string) => {
    console.log(`🎬 Running scene: ${sceneName}`);
    // TODO: Appeler API HA pour activer la scène
    // fetch('/api/ha/scene/activate', ...)
  };

  return (
    <div className="h-full flex flex-row overflow-hidden bg-black/20">
      {/* SIDEBAR */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* CONTENT AREA */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/5 to-transparent pointer-events-none" />

        <AnimatePresence mode="wait">
          {activeTab === "LIGHTS" && (
            <LightsTab
              states={states}
              onToggle={handleToggle}
              onRunScene={runScene}
            />
          )}

          {activeTab === "ENERGY" && <EnergyTab />}

          {activeTab === "SENSORS" && <SensorsTab states={states} />}

          {activeTab === "PRINTERS" && <PrintersTab states={states} />}

          {activeTab === "DOORS" && <DoorsTab states={states} />}
        </AnimatePresence>
      </div>
    </div>
  );
};
