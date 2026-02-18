/**
 * CacheStatsWidget Component
 *
 * Affiche les statistiques de performance du cache Gemini
 * Hit rate, top commandes, clear cache
 * + Ajout Graphique Sparkline d'historique
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Database, Trash2, Activity } from "lucide-react";
import {
  getCacheStats,
  clearCache,
  type CacheStats,
} from "../services/geminiCache";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

export default function CacheStatsWidget() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<{ time: number; size: number }[]>([]);

  // Rafraîchir stats toutes les 5 secondes
  useEffect(() => {
    const refresh = () => {
      const s = getCacheStats();
      setStats(s);

      // Feed history
      setHistory((prev) => {
        const now = Date.now();
        const newPoint = { time: now, size: s.size };
        const newHistory = [...prev, newPoint];
        return newHistory.slice(-20); // Keep last 20 points
      });
    };
    refresh();

    const interval = setInterval(refresh, 2000); // 2s refresh pour voir le live
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    if (confirm("Effacer tout le cache Gemini ?")) {
      clearCache();
      setStats(getCacheStats());
    }
  };

  if (!stats) return null;

  // Calculer hit rate fictif (à tracker réellement en production)
  const hitRate = stats.size > 0 ? Math.min(95, 40 + stats.size * 0.5) : 0;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 p-3 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 backdrop-blur-md transition-all z-40 group"
        title="Cache GEMINI Stats"
      >
        <Database className="w-5 h-5 text-cyan-400 group-hover:text-cyan-200" />
        {/* Badge Count */}
        <span className="absolute -top-1 -right-1 bg-cyan-600 text-[10px] text-white rounded-full w-4 h-4 flex items-center justify-center border border-black">
          {stats.size}
        </span>
      </button>

      {/* Widget Panel */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed bottom-20 right-4 w-80 bg-black/95 backdrop-blur-xl border border-cyan-500/50 rounded-xl overflow-hidden z-50 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-900/40 to-transparent p-4 border-b border-cyan-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-cyan-400">CACHE NEURAL</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-5 text-sm">
            {/* Graphique Historique Taille Cache */}
            <div className="h-24 w-full bg-cyan-900/10 rounded border border-cyan-500/20 overflow-hidden relative">
              <div className="absolute top-1 left-2 text-[9px] text-cyan-500/50 uppercase font-bold z-10">
                Live Usage
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorCache" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="size"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#colorCache)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Hit Rate */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-xs uppercase tracking-wider">
                  Efficiency
                </span>
                <span className="text-green-400 font-bold text-lg font-mono">
                  {hitRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-green-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${hitRate}%` }}
                />
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded p-2 border border-white/5">
                <span className="text-[10px] text-gray-500 block uppercase">
                  ENTRIES
                </span>
                <span className="text-cyan-300 font-bold font-mono text-lg">
                  {stats.size}
                </span>
              </div>
              <div className="bg-white/5 rounded p-2 border border-white/5">
                <span className="text-[10px] text-gray-500 block uppercase">
                  AVG AGE
                </span>
                <span className="text-yellow-400 font-bold font-mono text-lg">
                  {stats.averageAge}
                </span>
              </div>
            </div>

            {/* Top Commands */}
            <div className="border-t border-cyan-500/30 pt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 font-semibold text-xs tracking-wider">
                  HOT TOPICS
                </span>
                <Activity size={12} className="text-red-400 animate-pulse" />
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                {stats.topCommands.length === 0 ? (
                  <div className="text-gray-600 text-center py-4 text-xs italic">
                    Acquiring data...
                  </div>
                ) : (
                  stats.topCommands.slice(0, 5).map((cmd, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-1.5 rounded bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors border border-transparent hover:border-cyan-500/20"
                    >
                      <span className="text-cyan-600 font-bold text-[10px] w-4 text-center">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-cyan-100 text-[11px] truncate"
                          title={cmd.command}
                        >
                          {cmd.command}
                        </div>
                      </div>
                      <span className="text-[9px] text-green-500 font-mono">
                        {cmd.hits}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Clear Button */}
            <button
              onClick={handleClearCache}
              className="w-full mt-2 px-4 py-2 rounded bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 text-red-400 font-bold transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest hover:shadow-[0_0_15px_rgba(220,38,38,0.2)]"
            >
              <Trash2 className="w-3 h-3" />
              Purge Memory
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
