/**
 * Hook React pour le Sentiment Analysis
 *
 * Analyse le mood de l'utilisateur et adapte les réponses
 */

import { useState, useCallback, useEffect } from "react";
import {
  analyzeSentiment,
  getAverageMood,
  getMoodHistory,
  suggestMoodAction,
  adaptResponseToMood,
  type UserMood,
} from "../services/sentimentAnalysis";

interface SentimentHookReturn {
  /** Mood actuel */
  currentMood: UserMood | null;
  /** Mood moyen (dernières 5 interactions) */
  averageMood: UserMood | null;
  /** Historique complet */
  moodHistory: UserMood[];
  /** Analyser un texte */
  analyzeMood: (text: string, commandFrequency?: number) => UserMood;
  /** Adapter une réponse au mood */
  adaptResponse: (response: string) => string;
  /** Obtenir suggestion d'action */
  getMoodSuggestion: () => any | null;
}

export function useSentiment(): SentimentHookReturn {
  const [currentMood, setCurrentMood] = useState<UserMood | null>(null);
  const [averageMood, setAverageMood] = useState<UserMood | null>(null);
  const [moodHistory, setMoodHistory] = useState<UserMood[]>([]);

  // Rafraîchir historique périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      setMoodHistory(getMoodHistory());
      setAverageMood(getAverageMood(5));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const analyzeMood = useCallback((text: string, commandFrequency?: number) => {
    const mood = analyzeSentiment(text, commandFrequency);
    setCurrentMood(mood);
    setAverageMood(getAverageMood(5));
    setMoodHistory(getMoodHistory());
    return mood;
  }, []);

  const adaptResponse = useCallback(
    (response: string) => {
      if (!currentMood) return response;
      return adaptResponseToMood(response, currentMood);
    },
    [currentMood],
  );

  const getMoodSuggestion = useCallback(() => {
    if (!currentMood) return null;
    return suggestMoodAction(currentMood);
  }, [currentMood]);

  return {
    currentMood,
    averageMood,
    moodHistory,
    analyzeMood,
    adaptResponse,
    getMoodSuggestion,
  };
}
