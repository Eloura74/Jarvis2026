/**
 * Hook Ghost Mode
 * Gestion capture + analyse écran
 */

import { useState, useCallback } from "react";
import { analyzeScreen, getAnalysisHistory, GhostAnalysis } from "../services/ghostMode";

export function useGhostMode() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<GhostAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GhostAnalysis[]>([]);

  // Déclenche analyse
  const analyze = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeScreen();
      if (result) {
        setLastAnalysis(result);
        setHistory(getAnalysisHistory());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analyze,
    isAnalyzing,
    lastAnalysis,
    history,
    error,
  };
}
