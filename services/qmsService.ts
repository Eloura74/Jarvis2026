import { getQMSAnalysis } from "./geminiService";

/**
 * Interface pour les résultats du Quantum Memory Stitching
 */
export interface QMSScanResult {
  hasSuggestion: boolean;
  reason?: string;
  suggestedAction?: {
    tool: string;
    args: any;
    explanation: string;
  };
}

/**
 * Analyse le contexte global pour trouver des liens logiques ( Quantum Stitching )
 *
 * @param recentLogs - Historique des logs système
 * @param currentTask - Objectif actuel de l'utilisateur
 * @returns Résultat de l'analyse avec suggestion éventuelle
 */
export async function scanForQuantumLinks(
  recentLogs: string[],
  currentTask: string,
): Promise<QMSScanResult> {
  try {
    const analysis = await getQMSAnalysis(recentLogs, currentTask);

    if (analysis && analysis.hasSuggestion && analysis.tool) {
      return {
        hasSuggestion: true,
        reason: analysis.explanation,
        suggestedAction: {
          tool: analysis.tool,
          args: analysis.args,
          explanation: analysis.explanation,
        },
      };
    }
  } catch (error) {
    console.error("QMS Scan Error:", error);
  }

  return { hasSuggestion: false };
}
