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
        // On récupère tout d'un coup pour faire simple, ou on pourrait optimiser
        // Pour l'instant, on fait un call global /api/states pour tout avoir
        const res = await fetch("/api/states", {
          headers: { Authorization: `Bearer ${HA_TOKEN}` },
        });
        if (!res.ok) throw new Error("Fetch fail");
        const data = await res.json();

        // Indexer par entity_id
        const newState: Record<string, any> = {};
        data.forEach((ent: any) => {
          newState[ent.entity_id] = ent;
        });
        setStates(newState);
      } catch (e) {
        console.error("HA Poll Error", e);
      }
    };

    fetchStates(); // Initial
    const interval = setInterval(fetchStates, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [isOpen]); // Only poll if component mounted (isOpen check could be used to slow down polling if closed)

  // Toggle Light Function
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
      // Optimistic update
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
      animate={{ width: isOpen ? 300 : 60 }}
      className="relative h-full jarvis-panel-glass bg-black/40 border border-cyan-400/30 overflow-hidden flex flex-row rounded-xl transition-all duration-500 shadow-[0_0_15px_rgba(0,229,255,0.1)]"
    >
      {/* SIDEBAR TABS */}
      <div className="w-[60px] flex flex-col items-center py-4 gap-4 bg-cyan-950/20 border-r border-cyan-400/20 z-10">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full hover:bg-cyan-500/20 text-cyan-300 transition-all mb-4"
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
      <div className="flex-1 p-4 min-w-[240px] overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {/* === LIGHTS === */}
          {activeTab === "LIGHTS" && (
            <motion.div
              key="lights"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <h3 className="text-cyan-300 font-bold tracking-widest text-sm mb-4 border-b border-cyan-500/30 pb-2">
                LIGHTS CONTROL
              </h3>
              {ENTITIES.LIGHTS.map((light) => {
                const state = states[light.id]?.state;
                const isOn = state === "on";
                return (
                  <div
                    key={light.id}
                    className="flex items-center justify-between p-2 rounded bg-black/40 border border-cyan-500/10"
                  >
                    <span className="text-[10px] text-cyan-100/80 font-mono tracking-wider">
                      {light.label}
                    </span>
                    <button
                      onClick={() => toggleLight(light.id)}
                      className={`p-2 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(0,229,255,0.2)] ${isOn ? "bg-cyan-500 text-black shadow-[0_0_15px_#00e5ff]" : "bg-gray-800 text-gray-500"}`}
                    >
                      <Power size={14} />
                    </button>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* === SENSORS === */}
          {activeTab === "SENSORS" && (
            <motion.div
              key="sensors"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <h3 className="text-cyan-300 font-bold tracking-widest text-sm mb-4 border-b border-cyan-500/30 pb-2">
                ENV. SENSORS
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {ENTITIES.SENSORS.map((sensor) => {
                  const val = states[sensor.id]?.state ?? "--";
                  return (
                    <div
                      key={sensor.id}
                      className="p-2 rounded bg-black/40 border border-cyan-500/10 flex flex-col items-center"
                    >
                      <div className="flex items-center gap-1 text-[9px] text-cyan-400/70 mb-1">
                        {sensor.type === "temp" ? (
                          <Thermometer size={10} />
                        ) : (
                          <Droplets size={10} />
                        )}
                        <span>{sensor.label}</span>
                      </div>
                      <span className="text-lg font-bold text-white">
                        {val}
                        <span className="text-xs text-cyan-500 ml-0.5">
                          {sensor.unit}
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
              <h3 className="text-cyan-300 font-bold tracking-widest text-sm mb-4 border-b border-cyan-500/30 pb-2">
                3D PRINTERS
              </h3>
              {ENTITIES.PRINTERS.map((printer) => {
                const bed = states[printer.bed]?.state ?? 0;
                const ext = states[printer.ext]?.state ?? 0;
                const progress = Math.round(
                  Number(states[printer.progress]?.state ?? 0),
                );

                return (
                  <div
                    key={printer.name}
                    className="p-3 rounded-lg bg-black/40 border border-purple-500/20"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-purple-300">
                        {printer.name}
                      </span>
                      <span className="text-[10px] text-purple-400">
                        {progress}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-purple-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <div className="flex items-center gap-1">
                        <Activity size={10} className="text-red-400" /> NZL:{" "}
                        {ext}°C
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity size={10} className="text-blue-400" /> BED:{" "}
                        {bed}°C
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
              className="space-y-2"
            >
              <h3 className="text-cyan-300 font-bold tracking-widest text-sm mb-4 border-b border-cyan-500/30 pb-2">
                SECURITY STATUS
              </h3>
              {ENTITIES.DOORS.map((door) => {
                const isOpen = states[door.id]?.state === "on"; // binary_sensor: on = open
                return (
                  <div
                    key={door.id}
                    className={`flex items-center justify-between p-2 rounded border transition-all ${isOpen ? "bg-red-900/20 border-red-500/50" : "bg-green-900/10 border-green-500/30"}`}
                  >
                    <span className="text-[10px] text-cyan-100 font-mono">
                      {door.label}
                    </span>
                    <div
                      className={`flex items-center gap-2 px-2 py-0.5 rounded text-[10px] font-bold ${isOpen ? "bg-red-500 text-black" : "bg-green-500/20 text-green-400"}`}
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
    className={`relative group w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${
      active
        ? "bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.3)]"
        : "text-cyan-500/40 hover:text-cyan-300 hover:bg-white/5"
    }`}
    title={label}
  >
    {icon}
    {active && (
      <div className="absolute left-0 w-0.5 h-6 bg-cyan-400 rounded-r-full" />
    )}
  </button>
);
