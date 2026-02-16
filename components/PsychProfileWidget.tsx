import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, X, Brain } from "lucide-react";
import {
  getLastProfile,
  analyzePsychProfile,
  getMoodHistory,
  PsychProfile,
} from "../services/psychProfile";
import { analyzeMoodHistory } from "../utils/moodAnalyzer";

/**
 * Widget Profil Psychologique
 * Discret, insights mood long-terme
 */
export default function PsychProfileWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<PsychProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load profile au mount
  useEffect(() => {
    const cached = getLastProfile();
    if (cached) {
      setProfile(cached);
    } else {
      // Analyse initiale si jamais fait
      handleAnalyze();
    }
  }, []);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const newProfile = await analyzePsychProfile();
      setProfile(newProfile);
    } catch (error) {
      console.error("Profile analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Basic insights from history
  const history = getMoodHistory();
  const basicInsights = analyzeMoodHistory(history);

  return (
    <>
      {/* Toggle Badge - Bottom-right HUD (à côté Ghost Mode) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-72 p-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 backdrop-blur-md transition-all z-40"
        title="Profil Psychologique"
      >
        <Brain className="w-4 h-4 text-indigo-400" />
        {basicInsights.trend !== "stable" && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-36 right-4 w-[380px] max-h-[450px] bg-black/90 backdrop-blur-md border border-indigo-500/50 rounded-lg overflow-hidden z-30"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500/20 to-transparent p-3 border-b border-indigo-500/30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-400" />
                <h3 className="text-white font-bold text-sm">
                  Profil Psychologique
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 overflow-y-auto max-h-[390px] space-y-3">
              {/* Summary */}
              {profile && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded p-2">
                  <div className="text-indigo-400 text-[10px] font-bold mb-1">
                    ANALYSE
                  </div>
                  <div className="text-white text-xs">
                    {profile.insights.summary}
                  </div>
                  <div className="text-gray-500 text-[9px] mt-1">
                    {new Date(profile.lastAnalysis).toLocaleDateString()}
                  </div>
                </div>
              )}

              {/* Tendance */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-2">
                <div className="text-cyan-400 text-[10px] font-bold mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  TENDANCE (7 jours)
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-gray-400">Humeur</div>
                    <div className="text-white font-bold">
                      {basicInsights.averageValence > 0
                        ? "Positive"
                        : "Négative"}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Énergie</div>
                    <div className="text-white font-bold">
                      {basicInsights.averageArousal > 0.5 ? "Élevée" : "Basse"}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-yellow-400 text-xs">
                  {basicInsights.trend === "improving" && "📈 Amélioration"}
                  {basicInsights.trend === "declining" && "📉 Déclin"}
                  {basicInsights.trend === "stable" && "➡️ Stable"}
                </div>
              </div>

              {/* Patterns */}
              {profile && profile.insights.patterns.length > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2">
                  <div className="text-purple-400 text-[10px] font-bold mb-2">
                    PATTERNS DÉTECTÉS
                  </div>
                  <ul className="space-y-1">
                    {profile.insights.patterns.map((pattern, i) => (
                      <li
                        key={i}
                        className="text-white text-xs flex items-start gap-2"
                      >
                        <span className="text-purple-400">•</span>
                        <span>{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                <div className="text-green-400 text-[10px] font-bold mb-2">
                  RECOMMANDATIONS
                </div>
                <ul className="space-y-1">
                  {(
                    profile?.insights.recommendations ||
                    basicInsights.recommendations
                  ).map((reco, i) => (
                    <li
                      key={i}
                      className="text-white text-xs flex items-start gap-2"
                    >
                      <span className="text-green-400">✓</span>
                      <span>{reco}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Re-analyze button */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 rounded text-indigo-400 text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? "Analyse..." : "Actualiser Analyse"}
              </button>

              <div className="text-gray-500 text-[9px] text-center">
                {history.length} entrées mood collectées
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
