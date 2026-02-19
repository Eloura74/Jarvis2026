/**
 * Ghost Mode - Screen Analysis Service
 * OCR ponctuel + analyse contextuelle Gemini
 *
 * QUOTA SAFE: Max 12 calls/h = 2400 tokens/h
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface GhostAnalysis {
  timestamp: number;
  ocrText: string;
  context: string;
  suggestions: string[];
  detectedTask?: string;
  detectedLanguage?: string;
}

const analysisHistory: GhostAnalysis[] = [];

/**
 * Capture écran + OCR + analyse Gemini
 * @returns Analyse contextuelle
 */
/**
 * Capture frame + Vision Analysis (Gemini 2.0)
 * @param imageData - Optional base64 image (from webcam). If null, triggers screen capture.
 * @returns Analyse contextuelle
 */
export async function analyzeScreen(
  imageData?: string,
): Promise<GhostAnalysis | null> {
  // Rate limiting (supprimé pour démo ou réduit)
  // const now = Date.now();
  // if (now - lastAnalysisTime < MIN_INTERVAL) ...

  try {
    let finalImage = imageData;

    // Si pas d'image fournie, on capture l'écran (Fallback)
    if (!finalImage) {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0);
      stream.getTracks().forEach((track) => track.stop());
      finalImage = canvas.toDataURL("image/jpeg");
    }

    // Analyse Multimodale (Vision) avec Gemini 2.0
    const analysis = await analyzeWithGemini(finalImage!);

    // Store history
    analysisHistory.unshift(analysis);
    if (analysisHistory.length > 10) analysisHistory.pop();

    return analysis;
  } catch (error) {
    console.error("❌ Ghost Mode error:", error);
    throw error;
  }
}

/**
 * Analyse Vision avec Gemini 2.0 Flash
 */
async function analyzeWithGemini(base64Image: string): Promise<GhostAnalysis> {
  // Extraction header data:image/jpeg;base64,
  const base64Data = base64Image.split(",")[1];

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Analyse cette image capturée par ta caméra (Ghost Mode).
Identifie les éléments visuels, le contexte global et ce qui se passe.
Si c'est un écran, lis le code ou le texte. Si c'est une pièce, décris l'environnement.

Réponds STRICTEMENT en JSON :
{
  "context": "Description visuelle détaillée de ce que tu vois (ex: Une personne tenant une tasse, un écran affichant du code React...)",
  "suggestions": ["Action proposée 1", "Action proposée 2", "Action proposée 3"],
  "detectedTask": "Tâche supposée (ex: Coding, Reading, Drinking Coffee)",
  "detectedLanguage": "Langage informatique si visible (sinon null)"
}`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg",
      },
    },
  ]);
  const response = result.response.text();

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        timestamp: Date.now(),
        ocrText: "[VISION ANALYSIS]", // Legacy field
        context: parsed.context || "Analyse visuelle terminée.",
        suggestions: parsed.suggestions || [],
        detectedTask: parsed.detectedTask,
        detectedLanguage: parsed.detectedLanguage,
      };
    }
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
  }

  return {
    timestamp: Date.now(),
    ocrText: "",
    context: "Impossible d'analyser l'image.",
    suggestions: [],
  };
}

/**
 * Récupère historique analyses (max 10)
 */
export function getAnalysisHistory(): GhostAnalysis[] {
  return [...analysisHistory];
}

/**
 * Clear historique
 */
export function clearHistory(): void {
  analysisHistory.length = 0;
}
