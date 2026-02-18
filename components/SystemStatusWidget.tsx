import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { Mic, MicOff } from "lucide-react";
import { useKernel } from "../hooks/useKernel";

interface SystemStatusWidgetProps {
  cpuUsage: number;
  memoryUsage: string; // Ex: "45%" ou "8.2 GB"
  processes: number;
  onClick?: () => void;
}

interface ChartData {
  time: number;
  value: number;
}

/**
 * SystemStatusWidget - Widget de statut système style Cyberpunk
 * Affiche l'utilisation CPU et RAM avec des graphiques en ondes (Recharts)
 * et des animations dynamiques.
 *
 * Mises à jour (Plan Implémentation):
 * - Ralentissement du graph CPU
 * - Ajout barre GPU horizontale rose
 */
export const SystemStatusWidget: React.FC<SystemStatusWidgetProps> = ({
  cpuUsage,
  memoryUsage,
  processes,
  onClick,
}) => {
  const { wakeWordEnabled, setWakeWordEnabled } = useKernel();

  // Historique des données pour les graphiques
  const [cpuData, setCpuData] = useState<ChartData[]>(() =>
    Array.from({ length: 20 }, (_, i) => ({
      time: i,
      value: 20 + Math.random() * 10,
    })),
  );
  // Simulation GPU si pas de données réelles (pour l'instant on simule)
  const [gpuUsage, setGpuUsage] = useState(0);

  // Parsing de la mémoire
  const getMemoryValue = (memStr: string): number => {
    if (memStr.includes("%")) {
      return parseFloat(memStr.replace("%", ""));
    }
    const val = parseFloat(memStr);
    // Si c'est en GB (ex: 8.2), considérons que c'est sur 32GB pour un % approximatif ou juste renvoyer une valeur fixe pour l'anim
    // Pour l'effet visuel, on va normaliser arbitrairement si c'est < 100
    return isNaN(val) ? 40 : val < 100 ? val : 40;
  };

  // Ref pour accéder à la valeur actuelle dans l'intervalle sans le redémarrer
  const cpuUsageRef = React.useRef(cpuUsage);

  useEffect(() => {
    cpuUsageRef.current = cpuUsage;
  }, [cpuUsage]);

  useEffect(() => {
    // Initialisation gérée par useState lazy

    const interval = setInterval(() => {
      setCpuData((prev) => {
        const now = Date.now();
        // Lissage : on ne prend pas la valeur brute CPU instantanée qui peut faire le yoyo
        // On lisse avec la valeur précédente
        const lastVal = prev[prev.length - 1]?.value || 0;
        const currentCpu = cpuUsageRef.current;
        const smoothVal = lastVal * 0.7 + currentCpu * 0.3;

        const newData = [...prev, { time: now, value: smoothVal }];
        return newData.slice(-30);
      });

      // Simulation variation GPU
      setGpuUsage((prev) => {
        const target = Math.random() * 60 + 20; // Entre 20 et 80
        return prev * 0.9 + target * 0.1;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []); // Plus de dépendance à cpuUsage pour éviter le reset de l'intervalle

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`jarvis-panel-glass p-3 rounded-2xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl relative overflow-hidden group hover:border-cyan-400/50 transition-all duration-500 shadow-[0_0_20px_rgba(0,229,255,0.1)] w-full ${onClick ? "cursor-pointer hover:bg-white/5" : ""}`}
      onClick={onClick}
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
          {/* WAKE WORD TOGGLE */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setWakeWordEnabled(!wakeWordEnabled);
            }}
            className={`flex items-center gap-2 px-2 py-1 rounded-md border transition-all duration-300 group/btn hover:scale-105 active:scale-95 ${
              wakeWordEnabled
                ? "border-cyan-400 bg-cyan-400/20 text-cyan-100 shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                : "border-red-500/50 bg-red-500/10 text-red-400 opacity-80"
            }`}
            title={wakeWordEnabled ? "Wake Word Active" : "Wake Word Desactivé"}
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
              {wakeWordEnabled ? "ON" : "OFF"}
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {/* CPU SECTION - Graphique plus lent/lissé */}
        <div className="relative">
          <div className="flex justify-between text-[10px] mb-0.5 opacity-90 tracking-wider text-cyan-200 uppercase">
            <span>CPU Load</span>
            <span className="text-cyan-300 font-bold font-mono">
              {cpuUsage.toFixed(1)}%
            </span>
          </div>
          <div className="h-10 w-full bg-cyan-900/10 rounded overflow-hidden border border-cyan-500/10 relative">
            <ResponsiveContainer width="100%" height={40}>
              <AreaChart data={cpuData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis domain={[0, 100]} hide />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#00e5ff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCpu)"
                  isAnimationActive={false} // On gère l'anim via les datas
                />
              </AreaChart>
            </ResponsiveContainer>
            {/* Ligne scanner plus lente */}
            <motion.div
              className="absolute top-0 bottom-0 w-[1px] bg-cyan-400/50 shadow-[0_0_10px_#00e5ff] z-20"
              animate={{ left: ["0%", "100%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>

        {/* GPU SECTION (Nouveau : Barre Rose) */}
        <div className="relative">
          <div className="flex justify-between text-[10px] mb-1 opacity-90 tracking-wider text-pink-300 uppercase">
            <span>GPU Usage</span>
            <span className="font-bold font-mono">{gpuUsage.toFixed(0)}%</span>
          </div>

          <div className="h-2 w-full bg-pink-900/20 rounded-full overflow-hidden border border-pink-500/20">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-600 to-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${gpuUsage}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 15 }}
            />
          </div>
        </div>

        {/* MEMORY / PROCESSES FOOTER COMBINED */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cyan-400/20 mt-1">
          <div>
            <div className="text-[9px] text-cyan-400/60 uppercase tracking-widest mb-1">
              RAM
            </div>
            <div className="text-sm font-bold text-cyan-100 font-mono">
              {memoryUsage}
            </div>
            <div className="w-full h-1 bg-cyan-900/30 rounded mt-1">
              <div
                className="h-full bg-cyan-500/50 rounded"
                style={{ width: `${getMemoryValue(memoryUsage)}%` }}
              />
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[9px] text-cyan-400/60 uppercase tracking-widest mb-1">
              PROCESS
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_#4ade80]" />
              <span className="text-sm font-bold text-cyan-100 font-mono">
                {processes}
              </span>
            </div>
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
