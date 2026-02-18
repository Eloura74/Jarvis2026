import { useState, useEffect } from "react";
import { TrendingUp, Brain } from "lucide-react";
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
  // isOpen state managed by parent (HolographicModal)
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
    <div className="h-full w-full p-4 overflow-y-auto custom-scrollbar space-y-4">
      {/* Summary */}
      {profile && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
          <div className="text-indigo-400 text-xs font-bold mb-2 uppercase tracking-wider">
            ANALYSE SYSTÉMIQUE
          </div>
          <div className="text-white text-sm leading-relaxed">
            {profile.insights.summary}
          </div>
          <div className="text-gray-500 text-[10px] mt-2 font-mono text-right">
            Dernière analyse: {new Date(profile.lastAnalysis).toLocaleString()}
          </div>
        </div>
      )}

      {/* Tendance */}
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
        <div className="text-cyan-400 text-xs font-bold mb-3 flex items-center gap-2 uppercase tracking-wider">
          <TrendingUp className="w-4 h-4" />
          TENDANCE (7 jours)
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-2 bg-black/40 rounded border border-white/5">
            <div className="text-gray-400 text-xs mb-1">Humeur Globale</div>
            <div className="text-white font-bold flex items-center gap-2">
              {basicInsights.averageValence > 0 ? (
                <span className="text-green-400">Positive</span>
              ) : (
                <span className="text-red-400">Négative</span>
              )}
            </div>
          </div>
          <div className="p-2 bg-black/40 rounded border border-white/5">
            <div className="text-gray-400 text-xs mb-1">Niveau Énergie</div>
            <div className="text-white font-bold">
              {basicInsights.averageArousal > 0.5 ? "Élevé" : "Bas"}
            </div>
          </div>
        </div>
        <div className="mt-3 text-yellow-400 text-xs font-mono border-t border-white/5 pt-2">
          {basicInsights.trend === "improving" &&
            "📈 Tendance à l'amélioration détectée"}
          {basicInsights.trend === "declining" &&
            "📉 Tendance au déclin détectée"}
          {basicInsights.trend === "stable" && "➡️ État émotionnel stable"}
        </div>
      </div>

      {/* Patterns */}
      {profile && profile.insights.patterns.length > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <div className="text-purple-400 text-xs font-bold mb-3 uppercase tracking-wider">
            PATTERNS DÉTECTÉS
          </div>
          <ul className="space-y-2">
            {profile.insights.patterns.map((pattern, i) => (
              <li
                key={i}
                className="text-white text-xs flex items-start gap-2 bg-black/20 p-2 rounded"
              >
                <span className="text-purple-400 mt-0.5">•</span>
                <span>{pattern}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <div className="text-green-400 text-xs font-bold mb-3 uppercase tracking-wider">
          RECOMMANDATIONS IA
        </div>
        <ul className="space-y-2">
          {(
            profile?.insights.recommendations || basicInsights.recommendations
          ).map((reco, i) => (
            <li
              key={i}
              className="text-white text-xs flex items-start gap-2 bg-black/20 p-2 rounded"
            >
              <span className="text-green-400 font-bold">✓</span>
              <span>{reco}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Re-analyze button */}
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="w-full py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 rounded-lg text-indigo-400 text-sm font-bold transition-all disabled:opacity-50 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
      >
        {isAnalyzing ? (
          <div className="flex items-center justify-center gap-2">
            <Brain className="w-4 h-4 animate-pulse" />
            ANALYSE NEURALE EN COURS...
          </div>
        ) : (
          "ACTUALISER L'ANALYSE PSYCHOLOGIQUE"
        )}
      </button>

      <div className="text-gray-500 text-[10px] text-center font-mono">
        Base de données: {history.length} entrées biométriques
      </div>
    </div>
  );
}
