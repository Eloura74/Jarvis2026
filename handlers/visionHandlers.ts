/**
 * Handlers pour Gemini Vision - Analyse d'écran
 * 
 * Gère les commandes d'analyse visuelle de l'écran.
 * Exemples : "Analyse mon écran", "Lis ce texte", "Trouve les erreurs"
 */

import {
  analyzeCurrentScreen,
  AnalysisType,
} from "../services/visionService";
import { HandlerContext } from "../types/app.types";

// ============================================================================
// HANDLER : ANALYSE D'ÉCRAN
// ============================================================================

/**
 * Handler pour analyser l'écran avec Gemini Vision
 * 
 * Arguments possibles :
 * - type: "general" | "ocr" | "code" | "ui" | "error"
 * - prompt: Custom prompt (optionnel)
 * 
 * @example
 * ```typescript
 * // Analyse générale
 * handleAnalyzeScreen({ type: "general" }, ctx);
 * 
 * // Extraction de texte
 * handleAnalyzeScreen({ type: "ocr" }, ctx);
 * 
 * // Analyse de code
 * handleAnalyzeScreen({ type: "code" }, ctx);
 * ```
 */
export const handleAnalyzeScreen = async (
  args: { type?: AnalysisType; prompt?: string },
  ctx: HandlerContext & { speak?: (text: string) => void }
) => {
  const { addLog, speak } = ctx;

  try {
    const analysisType = args.type || "general";
    
    addLog(
      `📸 Capture d'écran en cours (analyse: ${analysisType})...`,
      "SYSTEM",
      "info"
    );

    // Analyse de l'écran avec Gemini Vision (GRATUIT)
    const result = await analyzeCurrentScreen(analysisType, args.prompt);

    // Afficher le résultat complet dans les logs
    addLog(
      `🔍 ANALYSE VISUELLE`,
      "OMNI",
      "success"
    );
    
    addLog(
      result.text,
      "OMNI",
      "info"
    );

    // Synthèse vocale du résultat
    if (speak) {
      // Résumé court pour la voix (premiers 150 caractères)
      const summary = result.text.substring(0, 150) + (result.text.length > 150 ? "..." : "");
      speak(summary);
    }

    return {
      status: "success",
      message: result.text,
      data: result,
    };
  } catch (error) {
    let errorMessage = "Erreur inconnue";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === "object" && "name" in error) {
      // Erreur DOMException (permission refusée)
      errorMessage = (error as any).name === "NotAllowedError" 
        ? "Permission de partage d'écran refusée"
        : "Erreur de capture d'écran";
    }
    
    addLog(
      `❌ Erreur analyse écran : ${errorMessage}`,
      "SYSTEM",
      "error"
    );
    
    return {
      status: "error",
      message: errorMessage,
    };
  }
};

/**
 * Handler pour lire le texte à l'écran (OCR)
 * 
 * Raccourci pour handleAnalyzeScreen avec type="ocr"
 */
export const handleReadScreen = async (
  args: { prompt?: string },
  ctx: HandlerContext
) => {
  return handleAnalyzeScreen({ type: "ocr", ...args }, ctx);
};

/**
 * Handler pour détecter les erreurs à l'écran
 * 
 * Raccourci pour handleAnalyzeScreen avec type="error"
 */
export const handleFindErrors = async (
  args: { prompt?: string },
  ctx: HandlerContext
) => {
  return handleAnalyzeScreen({ type: "error", ...args }, ctx);
};
