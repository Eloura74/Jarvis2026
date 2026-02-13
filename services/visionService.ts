/**
 * Service Gemini Vision - Analyse d'images et screenshots
 * 
 * Utilise Gemini 2.0 Flash (GRATUIT) avec support Vision
 * pour analyser le contenu de l'écran.
 * 
 * Fonctionnalités :
 * - Screenshot automatique
 * - Analyse du contenu visuel
 * - OCR (extraction de texte)
 * - Détection d'erreurs dans le code
 * - Description de l'interface
 * 
 * @module visionService
 */

import { GoogleGenAI } from "@google/genai";

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
 * Capture un screenshot de l'écran actuel
 * 
 * Utilise l'API getDisplayMedia du navigateur pour capturer l'écran complet.
 * L'utilisateur devra autoriser le partage d'écran.
 * 
 * @returns Promise avec l'image en base64
 */
export const captureScreen = async (): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Demander la permission de capturer l'écran
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: "screen" as any,
        } as any,
      });

      // Créer un élément video pour capturer le stream
      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;

      // Attendre que la vidéo soit prête
      await new Promise<void>((resolveVideo) => {
        video.onloadedmetadata = () => {
          video.play();
          resolveVideo();
        };
      });

      // Attendre un frame pour être sûr que la vidéo est affichée
      await new Promise((r) => setTimeout(r, 100));

      // Capturer le frame dans un canvas
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Impossible de créer le contexte canvas");
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Arrêter le stream
      stream.getTracks().forEach((track) => track.stop());

      // Convertir en base64
      const dataUrl = canvas.toDataURL("image/png");
      resolve(dataUrl);
    } catch (error) {
      console.error("Erreur capture écran:", error);
      reject(error);
    }
  });
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
    "Analyse cette image et décris ce que tu vois de manière détaillée. Identifie les éléments principaux, les couleurs, le contexte et tout ce qui semble important.",
  
  ocr:
    "Extrais tout le texte visible dans cette image. Présente-le de manière structurée et lisible. Si du code est présent, conserve sa mise en forme.",
  
  code:
    "Analyse ce code visible dans l'image. Identifie le langage, explique ce qu'il fait, détecte les erreurs potentielles, et propose des améliorations.",
  
  ui:
    "Analyse cette interface utilisateur. Décris les éléments visuels, l'organisation, l'ergonomie, et propose des améliorations UX/UI si pertinent.",
  
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
  customPrompt?: string
): Promise<VisionAnalysisResult> => {
  try {
    // Convertir l'image au format Gemini
    const geminiImage = dataUrlToGeminiImage(imageDataUrl);

    // Sélectionner le prompt
    const prompt = customPrompt || ANALYSIS_PROMPTS[type];

    // Appel API Gemini Vision avec 2.5 Flash
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-09-2025", // Gemini 2.5 Flash supporte Vision (images + vidéos)
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
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
  } catch (error) {
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
  customPrompt?: string
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
  customPrompt?: string
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
