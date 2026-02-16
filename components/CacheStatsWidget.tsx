/**
 * CacheStatsWidget Component
 *
 * Affiche les statistiques de performance du cache Gemini
 * Hit rate, top commandes, clear cache
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Database, Trash2 } from "lucide-react";
import {
  getCacheStats,
  clearCache,
  type CacheStats,
} from "../services/geminiCache";

export default function CacheStatsWidget() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Rafraîchir stats toutes les 5 secondes
  useEffect(() => {
    const refresh = () => setStats(getCacheStats());
    refresh();

    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    if (
      confirm(
        "Effacer tout le cache Gemini ? (Les commandes devront être retraitées)",
      )
    ) {
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
        className="fixed bottom-4 right-4 p-3 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 backdrop-blur-md transition-all z-40"
        title="Cache Stats"
      >
        <Database className="w-5 h-5 text-cyan-400" />
      </button>

      {/* Widget Panel */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed bottom-20 right-4 w-80 bg-black/90 backdrop-blur-md border border-cyan-500/50 rounded-lg overflow-hidden z-50"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500/20 to-transparent p-4 border-b border-cyan-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-cyan-400">CACHE GEMINI</h3>
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
          <div className="p-4 space-y-4 text-sm">
            {/* Hit Rate */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Hit Rate Estimé</span>
                <span className="text-green-400 font-bold text-lg">
                  {hitRate.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-green-400 h-2 rounded-full transition-all"
                  style={{ width: `${hitRate}%` }}
                />
              </div>
            </div>

            {/* Size */}
            <div className="flex justify-between">
              <span className="text-gray-400">Entrées en cache</span>
              <span className="text-cyan-400 font-bold">
                {stats.size} / 200
              </span>
            </div>

            {/* Average Age */}
            <div className="flex justify-between">
              <span className="text-gray-400">Âge moyen</span>
              <span className="text-yellow-400">{stats.averageAge}</span>
            </div>

            {/* Top Commands */}
            <div className="border-t border-cyan-500/30 pt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 font-semibold text-xs">
                  Commandes Récentes:
                </span>
                <span className="text-cyan-400 text-xs">🔴 LIVE</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats.topCommands.length === 0 ? (
                  <div className="text-gray-500 text-center py-4 text-xs">
                    Cache vide - Utilisez JARVIS pour peupler
                  </div>
                ) : (
                  stats.topCommands.slice(0, 8).map((cmd, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors group"
                    >
                      <span className="text-cyan-400 font-bold text-xs min-w-[20px]">
                        #{i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-white text-xs truncate group-hover:whitespace-normal transition-all"
                          title={cmd.command}
                        >
                          {cmd.command}
                        </div>
                        <div className="text-gray-500 text-[10px] mt-0.5">
                          Cache depuis {cmd.age}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">
                          {cmd.hits}× hits
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Clear Button */}
            <button
              onClick={handleClearCache}
              className="w-full mt-4 px-4 py-2 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 font-bold transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Cache
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
