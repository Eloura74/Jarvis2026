/**
 * Ghost Mode - Screen Analysis Service
 * OCR ponctuel + analyse contextuelle Gemini
 *
 * QUOTA SAFE: Max 12 calls/h = 2400 tokens/h
 */

import Tesseract from "tesseract.js";
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

let lastAnalysisTime = 0;
const MIN_INTERVAL = 5 * 60 * 1000; // 5 minutes minimum
const analysisHistory: GhostAnalysis[] = [];

/**
 * Capture écran + OCR + analyse Gemini
 * @returns Analyse contextuelle
 */
export async function analyzeScreen(): Promise<GhostAnalysis | null> {
  // Rate limiting (5min minimum)
  const now = Date.now();
  if (now - lastAnalysisTime < MIN_INTERVAL) {
    const waitTime = Math.ceil(
      (MIN_INTERVAL - (now - lastAnalysisTime)) / 1000,
    );
    throw new Error(`Attendez ${waitTime}s avant la prochaine analyse`);
  }

  try {
    // 1. Capture écran (1 frame)
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

    // Stop stream immédiatement
    stream.getTracks().forEach((track) => track.stop());

    // 2. OCR avec Tesseract.js
    const imageData = canvas.toDataURL();
    const { data } = await Tesseract.recognize(imageData, "eng+fra", {
      logger: (m) => console.log(m),
    });

    const ocrText = data.text.trim();
    console.log("📝 OCR Text extracted:", ocrText.substring(0, 200));

    // 3. Analyse contextuelle avec Gemini Flash
    const analysis = await analyzeWithGemini(ocrText);

    lastAnalysisTime = now;

    // Store history (max 10)
    analysisHistory.unshift(analysis);
    if (analysisHistory.length > 10) {
      analysisHistory.pop();
    }

    return analysis;
  } catch (error) {
    console.error("❌ Ghost Mode error:", error);
    throw error;
  }
}

/**
 * Analyse texte OCR avec Gemini Flash
 * Prompt ~200 tokens → minimal pour quota
 */
async function analyzeWithGemini(ocrText: string): Promise<GhostAnalysis> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Analyse ce contenu d'écran OCR et identifie:
1. Le contexte (code, documentation, recherche, etc.)
2. 3 suggestions d'aide concrètes
3. La tâche en cours (si détectée)
4. Le langage de programmation (si code)

OCR:
${ocrText.substring(0, 1000)}

Réponds en JSON:
{
  "context": "description courte",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "detectedTask": "tâche ou null",
  "detectedLanguage": "langage ou null"
}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  try {
    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      return {
        timestamp: Date.now(),
        ocrText,
        context: parsed.context || "Unknown",
        suggestions: parsed.suggestions || [],
        detectedTask: parsed.detectedTask || undefined,
        detectedLanguage: parsed.detectedLanguage || undefined,
      };
    }
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
  }

  // Fallback si parsing fail
  return {
    timestamp: Date.now(),
    ocrText,
    context: "Analysis failed",
    suggestions: ["Try again"],
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
