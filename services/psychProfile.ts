/**
 * Psychological Profile Service
 * Collecte mood passif + analyse batch Gemini (1x/jour)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { MoodEntry, analyzeMoodHistory } from "../utils/moodAnalyzer";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const STORAGE_KEY = "jarvis-mood-history";
const MAX_HISTORY_DAYS = 30;

export interface PsychProfile {
  lastAnalysis: number;
  insights: {
    summary: string;
    patterns: string[];
    recommendations: string[];
  };
}

/**
 * Enregistre mood entry (appelé automatiquement par MoodIndicator)
 */
export function recordMood(valence: number, arousal: number): void {
  const history = getMoodHistory();

  history.push({
    timestamp: Date.now(),
    valence,
    arousal,
  });

  // Limit à 30 jours
  const cutoff = Date.now() - MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000;
  const filtered = history.filter((entry) => entry.timestamp > cutoff);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Récupère historique mood
 */
export function getMoodHistory(): MoodEntry[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Analyse profil psychologique avec Gemini (1x/jour)
 * Quota: ~500 tokens/jour = safe
 */
export async function analyzePsychProfile(): Promise<PsychProfile> {
  const history = getMoodHistory();
  const basicInsights = analyzeMoodHistory(history);

  // Gemini deep analysis
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Analyse ce profil psychologique sur 7 jours:

Mood moyen:
- Valence: ${basicInsights.averageValence.toFixed(2)} (-1=négatif, +1=positif)
- Arousal: ${basicInsights.averageArousal.toFixed(2)} (0=calme, 1=excité)
- Tendance: ${basicInsights.trend}

Nombre d'entrées: ${history.length}

Fournis en JSON:
{
  "summary": "résumé état psychologique (1 phrase)",
  "patterns": ["pattern 1", "pattern 2"],
  "recommendations": ["reco 1", "reco 2", "reco 3"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      return {
        lastAnalysis: Date.now(),
        insights: {
          summary: parsed.summary || "Analyse en cours",
          patterns: parsed.patterns || [],
          recommendations:
            parsed.recommendations || basicInsights.recommendations,
        },
      };
    }
  } catch (error) {
    console.error("Failed to analyze psych profile:", error);
  }

  // Fallback si Gemini fail
  return {
    lastAnalysis: Date.now(),
    insights: {
      summary: `Tendance ${basicInsights.trend}`,
      patterns: [],
      recommendations: basicInsights.recommendations,
    },
  };
}

/**
 * Récupère dernière analyse (cache localStorage)
 */
export function getLastProfile(): PsychProfile | null {
  const stored = localStorage.getItem("jarvis-psych-profile");
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Sauvegarde profile analysé
 */
export function saveProfile(profile: PsychProfile): void {
  localStorage.setItem("jarvis-psych-profile", JSON.stringify(profile));
}
