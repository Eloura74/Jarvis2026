/**
 * Handlers pour Gemini Vision - Analyse d'écran
 *
 * Gère les commandes d'analyse visuelle de l'écran.
 * Exemples : "Analyse mon écran", "Lis ce texte", "Trouve les erreurs"
 */

import { analyzeCurrentScreen, AnalysisType } from "../services/visionService";
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
  ctx: HandlerContext & { speak?: (text: string) => void },
) => {
  const { addLog, speak } = ctx;

  try {
    const analysisType = args.type || "general";

    addLog(
      `📸 Capture d'écran en cours (analyse: ${analysisType})...`,
      "SYSTEM",
      "info",
    );

    // Analyse de l'écran avec Gemini Vision (GRATUIT)
    const result = await analyzeCurrentScreen(analysisType, args.prompt);

    // Afficher le résultat complet dans les logs
    addLog(`🔍 ANALYSE VISUELLE`, "OMNI", "success");

    addLog(result.text, "OMNI", "info");

    // Synthèse vocale du résultat
    if (speak) {
      // Résumé court pour la voix (premiers 150 caractères)
      const summary =
        result.text.substring(0, 150) + (result.text.length > 150 ? "..." : "");
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
      if (error.name === "NotAllowedError") {
        errorMessage = "Permission de partage d'écran refusée";
      }
    } else if (error && typeof error === "object" && "name" in error) {
      // Erreur DOMException (permission refusée)
      errorMessage =
        (error as { name: string }).name === "NotAllowedError"
          ? "Permission de partage d'écran refusée"
          : "Erreur de capture d'écran";
    }

    addLog(`❌ Erreur analyse écran : ${errorMessage}`, "SYSTEM", "error");

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
  ctx: HandlerContext,
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
  ctx: HandlerContext,
) => {
  return handleAnalyzeScreen({ type: "error", ...args }, ctx);
};

/**
 * Handler capture webcam et analyse avec Gemini Vision
 * Capture une image depuis la webcam et l'analyse avec Gemini Vision
 */
export const handleWebcamVision = async (
  args: { prompt?: string },
  ctx: HandlerContext,
) => {
  const { addLog, speak, setStatus } = ctx;

  addLog("Capture webcam en cours...", "SYSTEM", "info");
  setStatus?.("processing" as any);

  try {
    const API_BASE = "http://localhost:3001";
    const response = await fetch(`${API_BASE}/api/vision/webcam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: args.prompt }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const analysis = data.analysis;

    addLog("📷 Analyse webcam terminée", "OMNI", "success");
    addLog(analysis, "OMNI", "info");

    if (speak) {
      const summary =
        analysis.substring(0, 200) + (analysis.length > 200 ? "..." : "");
      speak(summary);
    }

    setStatus?.("idle" as any);

    return {
      status: "success",
      message: analysis,
      data: { analysis, imageUrl: data.imageUrl },
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur webcam vision: ${msg}`, "SYSTEM", "error");

    if (speak) {
      speak("Impossible d'analyser l'image webcam, Monsieur.");
    }

    setStatus?.("error" as any);
    setTimeout(() => setStatus?.("idle" as any), 2000);

    return {
      status: "error",
      message: `Impossible d'analyser webcam : ${msg}`,
    };
  }
};

/**
 * Handler détection objets/personnes via webcam
 * Utilise Gemini Vision pour détecter objets et personnes
 */
export const handleDetectObjects = async (
  args: { target?: string },
  ctx: HandlerContext,
) => {
  const { addLog, speak, setStatus } = ctx;

  const prompt = args.target
    ? `Détecte si tu vois ${args.target} dans cette image. Réponds par oui ou non, puis décris ce que tu vois.`
    : "Liste tous les objets et personnes visibles dans cette image. Sois précis et concis.";

  addLog(
    `Détection objets${args.target ? ` (recherche: ${args.target})` : ""}...`,
    "SYSTEM",
    "info",
  );
  setStatus?.("processing" as any);

  try {
    const API_BASE = "http://localhost:3001";
    const response = await fetch(`${API_BASE}/api/vision/webcam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const analysis = data.analysis;

    addLog("🔍 Détection terminée", "OMNI", "success");
    addLog(analysis, "OMNI", "info");

    if (speak) {
      speak(analysis);
    }

    setStatus?.("idle" as any);

    return {
      status: "success",
      message: analysis,
      data: { analysis, imageUrl: data.imageUrl },
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur détection: ${msg}`, "SYSTEM", "error");

    if (speak) {
      speak("Impossible de détecter les objets, Monsieur.");
    }

    setStatus?.("error" as any);
    setTimeout(() => setStatus?.("idle" as any), 2000);

    return {
      status: "error",
      message: `Impossible de détecter objets : ${msg}`,
    };
  }
};

/**
 * Handler Copilote d'Écran Proactif (Dev Assistant)
 * Analyse les erreurs de compilation/terminal/VS Code visibles à l'écran et propose une explication + solution.
 */
export const handleDevAssistant = async (
  args: { prompt?: string },
  ctx: HandlerContext & { speak?: (text: string) => void },
) => {
  const customPrompt =
    args.prompt ||
    "Analyse cet écran de développeur (VS Code, terminal, console d'erreur). Identifie l'erreur principale ou le bug visible, explique sa cause en 1-2 phrases très claires et donne la solution exacte à appliquer. Sois concis et direct.";

  return handleAnalyzeScreen({ type: "code", prompt: customPrompt }, ctx);
};

