/**
 * Service Gemini TTS - Génération de voix avec Gemini
 * 
 * Utilise Gemini 2.5 Flash TTS pour générer de l'audio de haute qualité.
 * GRATUIT avec limites (15 req/min typiquement).
 * 
 * Bien meilleur que la synthèse vocale du navigateur (speechSynthesis).
 * 
 * @module geminiTTS
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

export interface TTSOptions {
  /** Texte à convertir en audio */
  text: string;
  /** Voix (optionnel, Gemini choisit automatiquement) */
  voice?: string;
  /** Vitesse de parole (0.5 - 2.0, défaut: 1.0) */
  speed?: number;
}

export interface TTSResult {
  /** Audio en base64 */
  audioData: string;
  /** Durée estimée en secondes */
  duration?: number;
  /** Format audio (wav, mp3, etc.) */
  format: string;
}

// ============================================================================
// GÉNÉRATION DE VOIX
// ============================================================================

/**
 * Génère de l'audio à partir de texte avec Gemini TTS
 * 
 * @param options - Options de génération
 * @returns Promise avec l'audio en base64
 */
export const generateSpeech = async (options: TTSOptions): Promise<TTSResult> => {
  try {
    const { text } = options;

    // Appel API Gemini TTS avec voix féminine
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Speak this text with a calm, sophisticated, feminine voice. Tone should be intelligent, composed, sensual but professional - like a high-tech AI assistant. Speak clearly and elegantly: "${text}"`,
            },
          ],
        },
      ],
    });

    // Extraire l'audio de la réponse
    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error("Aucune réponse TTS de Gemini");
    }

    // L'audio devrait être dans les parts
    const audioPart = candidate.content?.parts?.find((p: any) => p.audio);
    
    if (!audioPart || !(audioPart as any).audio) {
      throw new Error("Pas d'audio généré par Gemini TTS");
    }

    const audioData = (audioPart as any).audio.data;
    const format = (audioPart as any).audio.mimeType || "audio/wav";

    return {
      audioData,
      format,
    };
  } catch (error) {
    console.error("❌ Erreur Gemini TTS:", error);
    throw error;
  }
};

/**
 * Joue l'audio généré par Gemini TTS
 * 
 * @param audioData - Audio en base64
 * @param format - Format MIME (audio/wav, audio/mp3, etc.)
 */
export const playTTSAudio = (audioData: string, format: string) => {
  try {
    // Créer un Blob audio
    const byteCharacters = atob(audioData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: format });

    // Créer une URL et jouer
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    audio.onended = () => {
      URL.revokeObjectURL(url);
    };

    audio.play();
  } catch (error) {
    console.error("❌ Erreur lecture audio:", error);
    throw error;
  }
};

/**
 * Fonction principale : Parler avec Gemini TTS
 * 
 * Wrapper simple qui génère et joue l'audio automatiquement.
 * 
 * @param text - Texte à dire
 * @param options - Options optionnelles
 */
export const speakWithGemini = async (
  text: string,
  options?: Partial<TTSOptions>
): Promise<void> => {
  try {
    console.log(`🔊 Génération TTS Gemini : "${text.substring(0, 50)}..."`);
    
    const result = await generateSpeech({
      text,
      ...options,
    });

    playTTSAudio(result.audioData, result.format);
    
    console.log(`✅ Audio TTS joué avec succès`);
  } catch (error) {
    console.error("❌ Erreur TTS Gemini:", error);
    
    // Fallback : utiliser la synthèse du navigateur
    console.log("⚠️ Fallback vers synthèse navigateur");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    utterance.rate = options?.speed || 1.0;
    window.speechSynthesis.speak(utterance);
  }
};
