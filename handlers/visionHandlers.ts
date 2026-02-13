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
  ctx: HandlerContext
) => {
  const { addLog } = ctx;

  try {
    const analysisType = args.type || "general";
    
    addLog(
      `📸 Capture d'écran en cours (analyse: ${analysisType})...`,
      "SYSTEM",
      "info"
    );

    // Analyse de l'écran avec Gemini Vision (GRATUIT)
    const result = await analyzeCurrentScreen(analysisType, args.prompt);

    addLog(
      `✅ Analyse terminée : ${result.text.substring(0, 100)}...`,
      "SYSTEM",
      "success"
    );

    return {
      status: "success",
      message: result.text,
      data: result,
    };
  } catch (error) {
    addLog(
      `❌ Erreur analyse écran : ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      "SYSTEM",
      "error"
    );
    throw error;
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
