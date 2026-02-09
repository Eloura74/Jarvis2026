/**
 * Hook personnalisé pour détection du Wake Word "JARVIS"
 *
 * Permet une activation vocale mains-libres en écoutant continuellement
 * le mot-clé "jarvis" ou "hey jarvis" en arrière-plan.
 *
 * Fonctionnalités :
 * - Écoute continue (always listening mode)
 * - Détection avec seuil de confiance
 * - Toggle activation/désactivation
 * - Callback quand wake word détecté
 *
 * @example
 * const { isListening, toggleWakeWord } = useWakeWord((detected) => {
 *   console.log('JARVIS activé !');
 *   startVoiceRecognition();
 * });
 */

import { useState, useEffect, useRef, useCallback } from "react";

// Types pour Web Speech API (non standard dans TS)
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseWakeWordOptions {
  /** Mots-clés à détecter (insensible à la casse) */
  keywords?: string[];
  /** Seuil de confiance minimum (0-1) */
  confidenceThreshold?: number;
  /** Langue de reconnaissance */
  language?: string;
}

/**
 * Hook de détection du Wake Word
 *
 * @param onWakeWordDetected - Callback appelé quand wake word détecté
 * @param options - Options de configuration
 * @returns État et contrôles du wake word
 */
export function useWakeWord(
  onWakeWordDetected: () => void,
  options: UseWakeWordOptions = {},
) {
  const {
    keywords = ["jarvis", "hey jarvis", "ok jarvis"],
    confidenceThreshold = 0.6,
    language = "fr-FR",
  } = options;

  const [isEnabled, setIsEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastDetection, setLastDetection] = useState<Date | null>(null);

  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Démarre l'écoute continue du wake word
   */
  const startListening = useCallback(() => {
    // Vérifier support navigateur
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("❌ Web Speech API non supportée par ce navigateur");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Créer nouvelle instance
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Écoute continue
    recognition.interimResults = true; // Résultats intermédiaires
    recognition.lang = language;
    recognition.maxAlternatives = 3; // Max 3 alternatives

    // --- ÉVÉNEMENT: Résultat de reconnaissance ---
    recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];

      if (!lastResult) return;

      // Vérifier toutes les alternatives
      for (let i = 0; i < lastResult.length; i++) {
        const alternative = lastResult[i];
        const transcript = alternative.transcript.toLowerCase().trim();
        const confidence = alternative.confidence;

        console.log(
          `🎤 Wake Word listening: "${transcript}" (${(confidence * 100).toFixed(0)}%)`,
        );

        // Vérifier si wake word détecté avec confiance suffisante
        const isWakeWord = keywords.some((keyword) =>
          transcript.includes(keyword),
        );

        if (isWakeWord && confidence >= confidenceThreshold) {
          console.log("✅ WAKE WORD DÉTECTÉ !");
          setLastDetection(new Date());
          onWakeWordDetected();

          // Pause brève pour éviter double détection
          recognition.stop();
          setTimeout(() => {
            if (recognitionRef.current === recognition && isEnabled) {
              recognition.start();
            }
          }, 1000);

          break;
        }
      }
    };

    // --- ÉVÉNEMENT: Démarrage ---
    recognition.onstart = () => {
      console.log("👂 Wake Word: écoute démarrée");
      setIsListening(true);
    };

    // --- ÉVÉNEMENT: Fin ---
    recognition.onend = () => {
      console.log("👂 Wake Word: écoute terminée");
      setIsListening(false);

      // Redémarrer automatiquement si toujours activé
      if (isEnabled && recognitionRef.current === recognition) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
          } catch (error) {
            console.error("Erreur redémarrage wake word:", error);
          }
        }, 500);
      }
    };

    // --- ÉVÉNEMENT: Erreur ---
    recognition.onerror = (event: any) => {
      console.warn("⚠️ Wake Word erreur:", event.error);

      // Ignorer erreurs "no-speech" et "aborted" (normales en écoute continue)
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }

      // Redémarrer en cas d'erreur
      if (isEnabled) {
        setTimeout(() => {
          if (recognitionRef.current === recognition) {
            recognition.start();
          }
        }, 1000);
      }
    };

    recognitionRef.current = recognition;

    // Démarrer
    try {
      recognition.start();
    } catch (error) {
      console.error("❌ Impossible de démarrer wake word:", error);
    }
  }, [isEnabled, keywords, confidenceThreshold, language, onWakeWordDetected]);

  /**
   * Arrête l'écoute du wake word
   */
  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.warn("Erreur arrêt wake word:", error);
      }
      recognitionRef.current = null;
    }

    setIsListening(false);
  }, []);

  /**
   * Toggle activation du wake word
   */
  const toggleWakeWord = useCallback(() => {
    setIsEnabled((prev) => !prev);
  }, []);

  // --- EFFET: Gérer démarrage/arrêt selon état enabled ---
  useEffect(() => {
    if (isEnabled) {
      startListening();
    } else {
      stopListening();
    }

    // Cleanup au démontage
    return () => {
      stopListening();
    };
  }, [isEnabled, startListening, stopListening]);

  return {
    /** Wake word activé ? */
    isEnabled,
    /** Écoute en cours ? */
    isListening,
    /** Dernière détection */
    lastDetection,
    /** Active/désactive le wake word */
    toggleWakeWord,
    /** Désactive manuellement */
    disable: () => setIsEnabled(false),
    /** Active manuellement */
    enable: () => setIsEnabled(true),
  };
}
