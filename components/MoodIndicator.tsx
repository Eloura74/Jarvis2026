/**
 * MoodIndicator Component
 *
 * Affiche l'état émotionnel de l'utilisateur dans le HUD
 * Badge discret avec tooltip détaillé
 */

import { motion } from "framer-motion";
import { useSentiment } from "../hooks/useSentiment";

export default function MoodIndicator() {
  const { currentMood, averageMood } = useSentiment();

  // Si pas de mood détecté, ne rien afficher
  if (!currentMood) return null;

  // Emoji basé sur valence
  const getEmoji = (valence: number): string => {
    if (valence > 0.5) return "😊";
    if (valence > 0.2) return "🙂";
    if (valence > -0.2) return "😐";
    if (valence > -0.5) return "😟";
    return "😢";
  };

  // Label arousal
  const getArousalLabel = (arousal: number): string => {
    if (arousal > 0.7) return "⚡ Stressé";
    if (arousal > 0.4) return "➡️ Actif";
    return "🧘 Calme";
  };

  // Couleur basée sur valence
  const getColor = (valence: number): string => {
    if (valence > 0.3) return "text-green-400";
    if (valence < -0.3) return "text-red-400";
    return "text-gray-400";
  };

  const emoji = getEmoji(currentMood.valence);
  const color = getColor(currentMood.valence);
  const arousalLabel = getArousalLabel(currentMood.arousal);

  return (
    <div className="relative group">
      {/* Badge principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 backdrop-blur-sm border border-cyan-500/30 ${color} cursor-help`}
      >
        <span className="text-lg">🧠</span>
        <span className="text-2xl">{emoji}</span>
        <span className="text-sm font-bold">
          {currentMood.valence > 0 ? "+" : ""}
          {currentMood.valence.toFixed(1)}
        </span>
      </motion.div>

      {/* Tooltip détaillé (on hover) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute top-full mt-2 right-0 w-64 p-4 rounded-lg bg-black/90 backdrop-blur-md border border-cyan-500/50 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
      >
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-cyan-400 font-bold">Mood Actuel</span>
            <span className={color}>{emoji}</span>
          </div>

          <div className="border-t border-cyan-500/30 pt-2 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Valence:</span>
              <span className={color}>
                {currentMood.valence > 0 ? "+" : ""}
                {(currentMood.valence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">État:</span>
              <span>{arousalLabel}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Confiance:</span>
              <span className="text-cyan-400">
                {(currentMood.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Mood moyen */}
          {averageMood && (
            <div className="border-t border-cyan-500/30 pt-2">
              <div className="text-gray-400 text-xs mb-1">
                Moyenne (5 dernières):
              </div>
              <div className="flex justify-between text-xs">
                <span>Valence:</span>
                <span className={getColor(averageMood.valence)}>
                  {averageMood.valence > 0 ? "+" : ""}
                  {(averageMood.valence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {/* Keywords détectés */}
          {currentMood.keywords.length > 0 && (
            <div className="border-t border-cyan-500/30 pt-2">
              <div className="text-gray-400 text-xs mb-1">Détecté:</div>
              <div className="flex flex-wrap gap-1">
                {currentMood.keywords.slice(0, 5).map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-xs"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
