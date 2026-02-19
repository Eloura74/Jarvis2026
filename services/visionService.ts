/**
 * Service Gemini Vision - Analyse d'images et screenshots
 *
 * Utilise Gemini 2.5 Flash avec support Vision
 * pour analyser le contenu de l'écran.
 *
 * Fonctionnalités :
 * - Screenshot automatique (html2canvas)
 * - Analyse du contenu visuel
 * - OCR (extraction de texte)
 * - Détection d'erreurs dans le code
 * - Description de l'interface
 *
 * @module visionService
 */

import { GoogleGenAI } from "@google/genai";
import html2canvas from "html2canvas";

// ============================================================================
// CONFIGURATION
// ============================================================================

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error("❌ CLÉ API GEMINI MANQUANTE");
}

const ai = new GoogleGenAI({ apiKey: geminiApiKey });

// ============================================================================
// TYPES
// ============================================================================

/** Types d'analyse disponibles */
export type AnalysisType =
  | "general" // Analyse générale
  | "ocr" // Extraction de texte
  | "code" // Analyse de code
  | "ui" // Analyse d'interface
  | "error"; // Détection d'erreurs

/** Résultat de l'analyse */
export interface VisionAnalysisResult {
  /** Texte de l'analyse */
  text: string;
  /** Type d'analyse effectuée */
  type: AnalysisType;
  /** Timestamp de l'analyse */
  timestamp: number;
}

// ============================================================================
// CAPTURE D'ÉCRAN
// ============================================================================

/**
 * Capture un screenshot de l'interface J.A.R.V.I.S. actuelle
 *
 * Utilise html2canvas pour capturer l'onglet automatiquement
 * SANS popup ni permission requise.
 *
 * Note : Capture SEULEMENT l'onglet J.A.R.V.I.S., pas les autres écrans.
 *
 * @returns Promise avec l'image en base64
 */
export const captureScreen = async (): Promise<string> => {
  try {
    console.log("📸 Capture automatique de l'interface J.A.R.V.I.S...");

    // Capturer l'interface avec html2canvas (SANS popup)
    const canvas = await html2canvas(document.body, {
      backgroundColor: "#000000", // Fond noir J.A.R.V.I.S.
      scale: 1, // Qualité normale (performance optimale)
      logging: false, // Pas de logs debug
      useCORS: true, // Images cross-origin
      allowTaint: true,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      // Ignorer certains éléments pour de meilleures performances
      ignoreElements: (element) => {
        // Ignorer les vidéos et iframes pour éviter les problèmes
        return element.tagName === "VIDEO" || element.tagName === "IFRAME";
      },
    });

    // Convertir en base64
    const dataUrl = canvas.toDataURL("image/png", 0.9);

    console.log("✅ Capture réussie !");
    console.log(`📊 Résolution : ${canvas.width}x${canvas.height}px`);
    console.log(`📦 Taille : ${Math.round(dataUrl.length / 1024)}KB`);

    return dataUrl;
  } catch (error) {
    console.error("❌ Erreur capture automatique:", error);
    throw new Error("Échec de la capture automatique de l'interface");
  }
};

/**
 * Convertit une dataURL en format Gemini
 *
 * @param dataUrl - Data URL de l'image (data:image/png;base64,...)
 * @returns Objet image pour Gemini
 */
const dataUrlToGeminiImage = (dataUrl: string) => {
  // Extraire le base64 pur (sans le préfixe data:image/png;base64,)
  const base64Data = dataUrl.split(",")[1];

  return {
    inlineData: {
      mimeType: "image/png",
      data: base64Data,
    },
  };
};

// ============================================================================
// PROMPTS D'ANALYSE
// ============================================================================

/** Prompts système selon le type d'analyse */
const ANALYSIS_PROMPTS: Record<AnalysisType, string> = {
  general:
    "Analyse image. SOIS BREF ET CONCIS. Une seule phrase pour décrire l'essentiel de l'action ou du contexte. Pas de détails superflus.",

  ocr: "Extrais le texte visible. Résultat brut uniquement.",

  code: "Analyse ce code. Bref résumé du but + 1 amélioration clé. Concision maximale.",

  ui: "Analyse l'UI. Points clés d'ergonomie en 3 points max. Bref.",

  error:
    "Recherche des erreurs dans cette image (messages d'erreur, bugs visuels, problèmes de code). Liste chaque erreur trouvée et propose des solutions.",
};

// ============================================================================
// ANALYSE AVEC GEMINI VISION
// ============================================================================

/**
 * Analyse une image avec Gemini Vision
 *
 * GRATUIT : Utilise Gemini 2.0 Flash avec Vision (15 req/min gratuit)
 *
 * @param imageDataUrl - Data URL de l'image à analyser
 * @param type - Type d'analyse à effectuer
 * @param customPrompt - Prompt personnalisé (optionnel)
 * @returns Résultat de l'analyse
 *
 * @example
 * ```typescript
 * const screenshot = await captureScreen();
 * const result = await analyzeImage(screenshot, "code");
 * console.log(result.text);
 * ```
 */
export const analyzeImage = async (
  imageDataUrl: string,
  type: AnalysisType = "general",
  customPrompt?: string,
): Promise<VisionAnalysisResult> => {
  try {
    // Convertir l'image au format Gemini
    const geminiImage = dataUrlToGeminiImage(imageDataUrl);

    // Sélectionner le prompt
    const prompt = customPrompt || ANALYSIS_PROMPTS[type];

    // Appel API Gemini Vision avec 2.5 Flash
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Gemini 2.5 Flash supporte Vision (images + vidéos)
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            geminiImage as any, // Image inline
          ],
        },
      ],
    });

    // Extraire la réponse
    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error("Aucune réponse de Gemini Vision");
    }

    const text =
      candidate.content?.parts
        ?.filter((p) => p.text)
        .map((p) => p.text)
        .join("") || "Analyse impossible.";

    return {
      text,
      type,
      timestamp: Date.now(),
    };
  } catch (error: unknown) {
    console.error("❌ Erreur Gemini Vision :", error);
    throw error;
  }
};

/**
 * Analyse l'écran actuel (raccourci)
 *
 * Capture automatiquement l'écran et l'analyse avec Gemini.
 *
 * @param type - Type d'analyse
 * @param customPrompt - Prompt personnalisé (optionnel)
 * @returns Résultat de l'analyse
 *
 * @example
 * ```typescript
 * // Analyse générale
 * const result = await analyzeCurrentScreen();
 *
 * // Extraction de texte
 * const ocr = await analyzeCurrentScreen("ocr");
 *
 * // Analyse de code
 * const codeAnalysis = await analyzeCurrentScreen("code");
 * ```
 */
export const analyzeCurrentScreen = async (
  type: AnalysisType = "general",
  customPrompt?: string,
): Promise<VisionAnalysisResult> => {
  // 1. Capturer l'écran
  const screenshot = await captureScreen();

  // 2. Analyser avec Gemini
  return analyzeImage(screenshot, type, customPrompt);
};

/**
 * Analyse une image depuis une URL
 *
 * @param imageUrl - URL de l'image à analyser
 * @param type - Type d'analyse
 * @param customPrompt - Prompt personnalisé (optionnel)
 * @returns Résultat de l'analyse
 */
export const analyzeImageFromUrl = async (
  imageUrl: string,
  type: AnalysisType = "general",
  customPrompt?: string,
): Promise<VisionAnalysisResult> => {
  try {
    // Charger l'image
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Convertir en Data URL
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    // Analyser
    return analyzeImage(dataUrl, type, customPrompt);
  } catch (error) {
    console.error("❌ Erreur chargement image :", error);
    throw error;
  }
};
