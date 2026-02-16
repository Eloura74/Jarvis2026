import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  Thermometer,
  Printer,
  DoorOpen,
  Zap,
  Film,
  Briefcase,
  Moon,
  Power,
  Droplets,
  Activity,
} from "lucide-react";

import {
  HA_ENTITIES,
  fetchHAStates,
  toggleEntity,
} from "../services/homeAssistantService";
import { EnergyWidget } from "./EnergyWidget";

type Tab = "LIGHTS" | "SENSORS" | "PRINTERS" | "DOORS" | "ENERGY";

export const HomeControlWidget: React.FC = () => {
  // isOpen not used anymore in modal mode
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
  }, []); // removed isOpen dep

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

  // isOpen state removed as it is now always open in the modal
  return (
    <div className="h-full flex flex-row overflow-hidden bg-black/20">
      {/* SIDEBAR TABS - Fixed width */}
      <div className="w-[80px] flex flex-col items-center py-6 gap-4 bg-black/40 border-r border-cyan-400/10 z-10 shrink-0">
        <TabButton
          active={activeTab === "LIGHTS"}
          onClick={() => setActiveTab("LIGHTS")}
          icon={<Lightbulb size={24} />}
          label="LIGHTS"
        />
        <TabButton
          active={activeTab === "SENSORS"}
          onClick={() => setActiveTab("SENSORS")}
          icon={<Thermometer size={24} />}
          label="SENSORS"
        />
        <TabButton
          active={activeTab === "ENERGY"}
          onClick={() => setActiveTab("ENERGY")}
          icon={<Zap size={24} />}
          label="ENERGY"
        />
        <TabButton
          active={activeTab === "PRINTERS"}
          onClick={() => setActiveTab("PRINTERS")}
          icon={<Printer size={24} />}
          label="PRINTERS"
        />
        <TabButton
          active={activeTab === "DOORS"}
          onClick={() => setActiveTab("DOORS")}
          icon={<DoorOpen size={24} />}
          label="DOORS"
        />
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/5 to-transparent pointer-events-none" />

        <AnimatePresence mode="wait">
          {/* === LIGHTS & SCENES === */}
          {activeTab === "LIGHTS" && (
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
                    onClick={() => runScene("cinema")}
                  />
                  <SceneButton
                    icon={<Briefcase size={20} />}
                    label="WORK"
                    color="text-blue-400"
                    onClick={() => runScene("work")}
                  />
                  <SceneButton
                    icon={<Moon size={20} />}
                    label="SLEEP"
                    color="text-indigo-400"
                    onClick={() => runScene("sleep")}
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
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 group ${isOn ? "bg-cyan-900/20 border-cyan-400/50 shadow-[0_0_15px_rgba(0,229,255,0.1)]" : "bg-black/40 border-gray-800 hover:border-cyan-500/30"}`}
                      >
                        <span
                          className={`text-sm font-bold tracking-wider ${isOn ? "text-cyan-100" : "text-gray-400 group-hover:text-cyan-200"}`}
                        >
                          {light.label}
                        </span>
                        <button
                          onClick={() => handleToggle(light.id)}
                          className={`p-3 rounded-full transition-all duration-300 ${isOn ? "bg-cyan-400 text-black shadow-[0_0_15px_#00e5ff] scale-110" : "bg-gray-800 text-gray-500 hover:text-cyan-400 hover:bg-gray-700"}`}
                        >
                          <Power size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* === ENERGY === */}
          {activeTab === "ENERGY" && (
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
          )}

          {/* === SENSORS === */}
          {activeTab === "SENSORS" && (
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
                        className={`text-2xl font-bold ${isAvailable ? "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" : "text-gray-600 text-base"}`}
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
          )}

          {/* === PRINTERS === */}
          {activeTab === "PRINTERS" && (
            <motion.div
              key="printers"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Header title="3D PRINTERS" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {HA_ENTITIES.PRINTERS.map((printer) => {
                  const bed = states[printer.bed]?.state ?? 0;
                  const ext = states[printer.ext]?.state ?? 0;
                  const progressState = states[printer.progress]?.state;
                  const progress =
                    progressState && progressState !== "unavailable"
                      ? Math.round(Number(progressState))
                      : 0;

                  return (
                    <div
                      key={printer.name}
                      className="p-4 rounded-lg bg-black/40 border border-purple-500/20 group hover:border-purple-500/40 transition-all"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-purple-300 tracking-wider group-hover:text-purple-200 transition-colors">
                          {printer.name}
                        </span>
                        <span className="text-xs text-purple-400 font-mono">
                          {progress}%
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden mb-4 border border-purple-500/10">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_10px_#d946ef] transition-all duration-700 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Activity size={12} className="text-pink-400" /> NZ:{" "}
                          <span className="text-gray-300">{ext}°C</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Activity size={12} className="text-blue-400" /> BD:{" "}
                          <span className="text-gray-300">{bed}°C</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* === DOORS === */}
          {activeTab === "DOORS" && (
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
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-500 ${isOpen ? "bg-red-950/30 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "bg-green-950/10 border-green-500/20"}`}
                    >
                      <span className="text-xs text-cyan-100 font-mono tracking-wider">
                        {door.label}
                      </span>
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold tracking-widest ${isOpen ? "bg-red-600 text-white shadow-[0_0_10px_#ef4444]" : "bg-green-500/10 text-green-500/80"}`}
                      >
                        <DoorOpen size={14} />
                        <span>{isOpen ? "OPEN" : "CLOSED"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Header = ({ title }: { title: string }) => (
  <h3 className="text-cyan-300 font-bold tracking-[0.2em] text-xs mb-5 flex items-center gap-2 after:content-[''] after:h-[1px] after:bg-gradient-to-r after:from-cyan-500/50 after:to-transparent after:flex-1 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
    {title}
  </h3>
);

const TabButton = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`relative group w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${
      active
        ? "bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.3)] border border-cyan-400/30"
        : "text-cyan-500/40 hover:text-cyan-300 hover:bg-white/5 border border-transparent"
    }`}
    title={label}
  >
    {icon}
    {active && (
      <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_5px_#00e5ff]" />
    )}
  </button>
);

const SceneButton = ({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-900/10 transition-all group"
  >
    <div
      className={`mb-2 p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform ${color}`}
    >
      {icon}
    </div>
    <span className="text-[10px] font-bold text-gray-400 tracking-wider group-hover:text-white transition-colors">
      {label}
    </span>
  </button>
);
