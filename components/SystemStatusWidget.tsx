import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { Mic, MicOff } from "lucide-react";
import { useKernel } from "../contexts/KernelContext";

interface SystemStatusWidgetProps {
  cpuUsage: number;
  memoryUsage: string; // Ex: "45%" ou "8.2 GB"
  processes: number;
}

interface ChartData {
  time: number;
  value: number;
}

/**
 * SystemStatusWidget - Widget de statut système style Cyberpunk
 * Affiche l'utilisation CPU et RAM avec des graphiques en ondes (Recharts)
 * et des animations dynamiques.
 */
export const SystemStatusWidget: React.FC<SystemStatusWidgetProps> = ({
  cpuUsage,
  memoryUsage,
  processes,
}) => {
  const { wakeWordEnabled, setWakeWordEnabled } = useKernel();

  // Historique des données pour les graphiques
  const [cpuData, setCpuData] = useState<ChartData[]>([]);
  const [memData, setMemData] = useState<ChartData[]>([]);

  // Parsing de la mémoire pour obtenir un nombre (si "45%" ou "8.2 GB")
  const getMemoryValue = (memStr: string): number => {
    if (memStr.includes("%")) {
      return parseFloat(memStr.replace("%", ""));
    }
    // Si c'est en GB, on simule un pourcentage arbitraire ou on extrait juste le chiffre pour l'animation
    // Pour l'effet visuel web, on va simuler une variation autour de 40-60 si pas de %,
    // ou parser le chiffre. Disons qu'on parse le chiffre.
    const val = parseFloat(memStr);
    return isNaN(val) ? 40 : val;
  };

  useEffect(() => {
    // Initialisation avec des données vides ou aléatoires pour éviter le vide au départ
    const initialData = Array.from({ length: 20 }, (_, i) => ({
      time: i,
      value: 20 + Math.random() * 10,
    }));
    setCpuData(initialData);
    setMemData(
      initialData.map((d) => ({ ...d, value: 30 + Math.random() * 10 })),
    );
  }, []);

  useEffect(() => {
    // Mise à jour des graphiques à chaque changement de props
    // On garde les 20 derniers points
    const now = Date.now();

    setCpuData((prev) => {
      const newData = [...prev, { time: now, value: cpuUsage }];
      return newData.slice(-20); // Garder les 20 derniers
    });

    setMemData((prev) => {
      const memVal = getMemoryValue(memoryUsage);
      const newData = [...prev, { time: now, value: memVal }];
      return newData.slice(-20);
    });
  }, [cpuUsage, memoryUsage]);

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="jarvis-panel-glass p-3 rounded-2xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl relative overflow-hidden group hover:border-cyan-400/50 transition-all duration-500 shadow-[0_0_20px_rgba(0,229,255,0.1)] w-full"
    >
      {/* BACKGROUND IMAGE WITH OVERLAY */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop"
          alt="System Background"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-transparent" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-2 relative z-10">
        <h2 className="text-lg font-bold tracking-widest text-cyan-300 drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]">
          SYS.STATUS
        </h2>

        <div className="flex items-center gap-3">
          {/* WAKE WORD TOGGLE BUTTON (VISIBILITÉ AMÉLIORÉE) */}
          <button
            onClick={() => setWakeWordEnabled(!wakeWordEnabled)}
            className={`flex items-center gap-2 px-2 py-1 rounded-md border transition-all duration-300 group/btn hover:scale-105 active:scale-95 ${
              wakeWordEnabled
                ? "border-cyan-400 bg-cyan-400/20 text-cyan-100 shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                : "border-red-500/50 bg-red-500/10 text-red-400 opacity-80"
            }`}
            title={
              wakeWordEnabled
                ? "Wake Word Active (JARVIS)"
                : "Wake Word Desactivé"
            }
          >
            {wakeWordEnabled ? (
              <Mic
                size={18}
                className="animate-pulse drop-shadow-[0_0_8px_rgba(0,229,255,1)]"
              />
            ) : (
              <MicOff size={18} />
            )}
            <span
              className={`text-[10px] font-black tracking-widest uppercase transition-colors ${
                wakeWordEnabled ? "text-cyan-200" : "text-red-400 opacity-70"
              }`}
            >
              {wakeWordEnabled ? "Wake On" : "Wake Off"}
            </span>
          </button>

          <div className="flex gap-1">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_#00e5ff]"
            />
            <div className="w-1.5 h-1.5 bg-cyan-900/50 rounded-full" />
          </div>
        </div>
      </div>

      <div className="space-y-2 relative z-10">
        {/* CPU SECTION */}
        <div className="relative">
          <div className="flex justify-between text-[10px] mb-0.5 opacity-90 tracking-wider text-cyan-200 uppercase">
            <span>CPU Load</span>
            <span className="text-cyan-300 font-bold font-mono">
              {cpuUsage}%
            </span>
          </div>

          {/* Graphique CPU */}
          <div className="h-8 w-full bg-cyan-900/10 rounded overflow-hidden border border-cyan-500/10 relative">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <AreaChart
                data={cpuData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis domain={[0, 100]} hide />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#00e5ff"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorCpu)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Ligne scanner décorative */}
            <motion.div
              className="absolute top-0 bottom-0 w-[1px] bg-cyan-400/50 shadow-[0_0_10px_#00e5ff] z-20"
              animate={{ left: ["0%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>

        {/* MEMORY SECTION */}
        <div className="relative">
          <div className="flex justify-between text-[10px] mb-0.5 opacity-90 tracking-wider text-cyan-200 uppercase">
            <span>RAM Usage</span>
            <span className="text-cyan-300 font-bold font-mono">
              {memoryUsage}
            </span>
          </div>

          {/* Graphique RAM */}
          <div className="h-8 w-full bg-cyan-900/10 rounded overflow-hidden border border-cyan-500/10 relative">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <AreaChart
                data={memData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                    {/* Rose/Violet pour différencier */}
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis domain={[0, 100]} hide />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#ec4899"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorMem)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PROCESSES FOOTER */}
        <div className="flex justify-between items-center border-t border-cyan-400/30 pt-2 mt-1">
          <span className="text-[9px] opacity-70 tracking-widest text-cyan-200 uppercase">
            Active Processes
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-bold text-cyan-300 font-mono drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
              {processes}
            </span>
          </div>
        </div>
      </div>

      {/* DECORATIVE CORNERS */}
      <div className="absolute top-0 right-0 p-2 opacity-80 pointer-events-none">
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path
            d="M0 0 L20 0 L20 20"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="2"
          />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 p-2 opacity-80 pointer-events-none rotate-180">
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path
            d="M0 0 L20 0 L20 20"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="2"
          />
        </svg>
      </div>
    </motion.div>
  );
};
