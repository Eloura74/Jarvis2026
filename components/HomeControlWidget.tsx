import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  Thermometer,
  Printer,
  DoorOpen,
  ChevronRight,
  ChevronLeft,
  Power,
  Droplets,
  Activity,
} from "lucide-react";

// Configuration HA
const HA_BASE_URL = "";
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN || "";

// Liste des entités
const ENTITIES = {
  LIGHTS: [
    { id: "light.canape", label: "CANAPE" },
    { id: "light.cheminee", label: "CHEMINEE" },
    { id: "light.led_switchwire", label: "SWITCHWIRE" },
    {
      id: "light.a1mini_0309da452500192_lumiere_de_la_chambre",
      label: "A1 MINI LIGHT",
    },
  ],
  SENSORS: [
    {
      id: "sensor.capteur_bureau_temperature",
      label: "BUREAU",
      unit: "°C",
      type: "temp",
    },
    {
      id: "sensor.capteur_bureau_humidite",
      label: "BUREAU",
      unit: "%",
      type: "hum",
    },
    {
      id: "sensor.capteur_etage_humidite",
      label: "ETAGE",
      unit: "%",
      type: "hum",
    },
    {
      id: "sensor.capteur_etage_temperature",
      label: "ETAGE",
      unit: "°C",
      type: "temp",
    },
    {
      id: "sensor.capteur_salon_humidite",
      label: "SALON",
      unit: "%",
      type: "hum",
    },
    {
      id: "sensor.capteur_salon_temperature",
      label: "SALON",
      unit: "°C",
      type: "temp",
    },
  ],
  PRINTERS: [
    {
      name: "VZ330",
      bed: "sensor.vz330_bed_temperature",
      ext: "sensor.vz330_extruder_temperature",
      progress: "sensor.vz330_progress",
    },
    {
      name: "MAINSAIL",
      bed: "sensor.mainsail_bed_temperature",
      ext: "sensor.mainsail_extruder_temperature",
      progress: "sensor.mainsail_progress",
    },
    {
      name: "A1 MINI",
      bed: "sensor.a1mini_0309da452500192_temperature_du_lit",
      ext: "sensor.a1mini_0309da452500192_temperature_de_la_buse",
      progress: "sensor.a1mini_0309da452500192_progression_de_l_impression",
    },
  ],
  DOORS: [
    { id: "binary_sensor.bureau_prive_porte_porte", label: "BUREAU" },
    { id: "binary_sensor.capteur_chambre_aaron_porte", label: "AARON" },
    { id: "binary_sensor.capteur_garage_porte", label: "GARAGE" },
    { id: "binary_sensor.portail_porte", label: "PORTAIL" },
    { id: "binary_sensor.porte_chambre_parentale_porte", label: "PARENTS" },
  ],
};

type Tab = "LIGHTS" | "SENSORS" | "PRINTERS" | "DOORS";

export const HomeControlWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("LIGHTS");
  const [states, setStates] = useState<Record<string, any>>({});

  // Polling des états HA
  useEffect(() => {
    if (!HA_TOKEN) return;

    const fetchStates = async () => {
      try {
        const res = await fetch("/api/states", {
          headers: { Authorization: `Bearer ${HA_TOKEN}` },
        });
        if (!res.ok) throw new Error("Fetch fail");
        const data = await res.json();

        const newState: Record<string, any> = {};
        data.forEach((ent: any) => {
          newState[ent.entity_id] = ent;
        });
        setStates(newState);
      } catch (e) {
        console.error("HA Poll Error", e);
      }
    };

    fetchStates();
    const interval = setInterval(fetchStates, 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const toggleLight = async (entityId: string) => {
    const entity = states[entityId];
    const isOn = entity?.state === "on";
    const service = isOn ? "turn_off" : "turn_on";

    try {
      await fetch(`/api/services/light/${service}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HA_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entity_id: entityId }),
      });
      setStates((prev) => ({
        ...prev,
        [entityId]: { ...prev[entityId], state: isOn ? "off" : "on" },
      }));
    } catch (e) {
      console.error("Toggle Error", e);
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isOpen ? 340 : 60 }}
      className="relative h-full jarvis-panel-glass overflow-hidden flex flex-row rounded-xl transition-all duration-500 shadow-[0_0_20px_rgba(0,229,255,0.15)] group hover:border-cyan-400/50 border border-cyan-400/30"
    >
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1558002038-1091a0a4e9d0?q=80&w=1000&auto=format&fit=crop"
          alt="Home Control Background"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/80 to-cyan-900/20" />
      </div>

      {/* SIDEBAR TABS */}
      <div className="w-[60px] flex flex-col items-center py-4 gap-6 bg-black/40 border-r border-cyan-400/20 z-10 shrink-0 backdrop-blur-sm">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full hover:bg-cyan-500/20 text-cyan-300 transition-all mb-2 hover:shadow-[0_0_10px_#00e5ff]"
        >
          {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        <TabButton
          active={activeTab === "LIGHTS"}
          onClick={() => {
            setActiveTab("LIGHTS");
            setIsOpen(true);
          }}
          icon={<Lightbulb size={20} />}
          label="LIGHTS"
        />
        <TabButton
          active={activeTab === "SENSORS"}
          onClick={() => {
            setActiveTab("SENSORS");
            setIsOpen(true);
          }}
          icon={<Thermometer size={20} />}
          label="SENSORS"
        />
        <TabButton
          active={activeTab === "PRINTERS"}
          onClick={() => {
            setActiveTab("PRINTERS");
            setIsOpen(true);
          }}
          icon={<Printer size={20} />}
          label="PRINTERS"
        />
        <TabButton
          active={activeTab === "DOORS"}
          onClick={() => {
            setActiveTab("DOORS");
            setIsOpen(true);
          }}
          icon={<DoorOpen size={20} />}
          label="DOORS"
        />
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 p-5 min-w-[280px] overflow-y-auto custom-scrollbar relative">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-transparent pointer-events-none" />

        <AnimatePresence mode="wait">
          {/* === LIGHTS === */}
          {activeTab === "LIGHTS" && (
            <motion.div
              key="lights"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Header title="LIGHTS CONTROL" />
              <div className="space-y-3">
                {ENTITIES.LIGHTS.map((light) => {
                  const state = states[light.id]?.state;
                  const isOn = state === "on";
                  return (
                    <div
                      key={light.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 group ${isOn ? "bg-cyan-900/20 border-cyan-400/50 shadow-[0_0_10px_rgba(0,229,255,0.2)]" : "bg-black/40 border-gray-800 hover:border-cyan-500/30"}`}
                    >
                      <span
                        className={`text-xs font-bold tracking-wider ${isOn ? "text-cyan-100" : "text-gray-400 group-hover:text-cyan-200"}`}
                      >
                        {light.label}
                      </span>
                      <button
                        onClick={() => toggleLight(light.id)}
                        className={`p-2 rounded-full transition-all duration-300 ${isOn ? "bg-cyan-400 text-black shadow-[0_0_15px_#00e5ff] scale-110" : "bg-gray-800 text-gray-500 hover:text-cyan-400 hover:bg-gray-700"}`}
                      >
                        <Power size={16} />
                      </button>
                    </div>
                  );
                })}
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
              className="space-y-4"
            >
              <Header title="ENV. SENSORS" />
              <div className="grid grid-cols-2 gap-3">
                {ENTITIES.SENSORS.map((sensor) => {
                  const rawVal = states[sensor.id]?.state;
                  const isAvailable =
                    rawVal && rawVal !== "unavailable" && rawVal !== "unknown";
                  const val = isAvailable ? rawVal : "N/A";

                  return (
                    <div
                      key={sensor.id}
                      className="p-3 rounded-lg bg-black/40 border border-cyan-500/10 flex flex-col items-center justify-center hover:border-cyan-500/30 transition-colors cursor-default"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/70 mb-1 uppercase tracking-wider">
                        {sensor.type === "temp" ? (
                          <Thermometer size={12} />
                        ) : (
                          <Droplets size={12} />
                        )}
                        <span>{sensor.label}</span>
                      </div>
                      <span
                        className={`text-xl font-bold ${isAvailable ? "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" : "text-gray-600 text-sm"}`}
                      >
                        {val}
                        <span className="text-xs text-cyan-500/80 ml-0.5">
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
              className="space-y-4"
            >
              <Header title="3D PRINTERS" />
              {ENTITIES.PRINTERS.map((printer) => {
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
                    className="p-3 rounded-lg bg-black/40 border border-purple-500/20 group hover:border-purple-500/40 transition-all"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-purple-300 tracking-wider group-hover:text-purple-200 transition-colors">
                        {printer.name}
                      </span>
                      <span className="text-[10px] text-purple-400 font-mono">
                        {progress}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden mb-3 border border-purple-500/10">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_10px_#d946ef] transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                      <div className="flex items-center gap-1">
                        <Activity size={10} className="text-pink-400" /> NZ:{" "}
                        <span className="text-gray-300">{ext}°C</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity size={10} className="text-blue-400" /> BD:{" "}
                        <span className="text-gray-300">{bed}°C</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* === DOORS === */}
          {activeTab === "DOORS" && (
            <motion.div
              key="doors"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <Header title="SECURITY STATUS" />
              {ENTITIES.DOORS.map((door) => {
                const isOpen = states[door.id]?.state === "on";
                return (
                  <div
                    key={door.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-500 ${isOpen ? "bg-red-950/30 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "bg-green-950/10 border-green-500/20"}`}
                  >
                    <span className="text-[10px] text-cyan-100 font-mono tracking-wider">
                      {door.label}
                    </span>
                    <div
                      className={`flex items-center gap-2 px-2.5 py-1 rounded text-[10px] font-bold tracking-widest ${isOpen ? "bg-red-600 text-white shadow-[0_0_10px_#ef4444]" : "bg-green-500/10 text-green-500/80"}`}
                    >
                      <DoorOpen size={12} />
                      <span>{isOpen ? "OPEN" : "CLOSED"}</span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
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
