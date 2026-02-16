/**
 * Mood Analyzer - Analyse tendances mood long-terme
 * Utilisé par Profil Psychologique (1x/jour)
 */

export interface MoodEntry {
  timestamp: number;
  valence: number; // -1 to 1
  arousal: number; // 0 to 1
}

export interface MoodInsights {
  averageValence: number;
  averageArousal: number;
  trend: "improving" | "declining" | "stable";
  recommendations: string[];
}

/**
 * Analyse historique mood (7 derniers jours)
 * @param history Entries mood
 * @returns Insights calculés
 */
export function analyzeMoodHistory(history: MoodEntry[]): MoodInsights {
  if (history.length === 0) {
    return {
      averageValence: 0,
      averageArousal: 0,
      trend: "stable",
      recommendations: ["Pas assez de données"],
    };
  }

  // Calculate averages
  const avgValence =
    history.reduce((sum, entry) => sum + entry.valence, 0) / history.length;
  const avgArousal =
    history.reduce((sum, entry) => sum + entry.arousal, 0) / history.length;

  // Detect trend (compare first half vs second half)
  const midpoint = Math.floor(history.length / 2);
  const firstHalf = history.slice(0, midpoint);
  const secondHalf = history.slice(midpoint);

  const avgValenceFirst =
    firstHalf.reduce((sum, e) => sum + e.valence, 0) / firstHalf.length;
  const avgValenceSecond =
    secondHalf.reduce((sum, e) => sum + e.valence, 0) / secondHalf.length;

  let trend: "improving" | "declining" | "stable" = "stable";
  if (avgValenceSecond > avgValenceFirst + 0.1) trend = "improving";
  else if (avgValenceSecond < avgValenceFirst - 0.1) trend = "declining";

  // Recommendations based on state
  const recommendations: string[] = [];
  if (avgValence < -0.3) {
    recommendations.push("Humeur basse détectée - Pause recommandée");
    recommendations.push("Contact social bénéfique");
  } else if (avgValence > 0.3) {
    recommendations.push("Humeur positive - Maintenir routine");
  }

  if (avgArousal < 0.3) {
    recommendations.push("Énergie basse - Activité physique suggérée");
  } else if (avgArousal > 0.7) {
    recommendations.push("Énergie élevée - Techniques relaxation");
  }

  if (trend === "declining") {
    recommendations.push("Tendance baisse - Surveillance santé mentale");
  }

  return {
    averageValence: avgValence,
    averageArousal: avgArousal,
    trend,
    recommendations:
      recommendations.length > 0 ? recommendations : ["Équilibre stable"],
  };
}

/**
 * Format date relative (ex: "il y a 2h")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `il y a ${days}j`;
  if (hours > 0) return `il y a ${hours}h`;
  return "à l'instant";
}
