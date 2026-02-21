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
import React from "react";

// Types pour Web Speech API (non standard dans TS)
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  /** Ref vers le timestamp de fin de parole de Jarvis (pour bloquer les échos) */
  lastSpeechEndTimeRef?: React.MutableRefObject<number>;
  /** Période de sécurité post-parole en ms (défaut: 3500) */
  speechSafetyPeriodMs?: number;
}

const DEFAULT_KEYWORDS = ["jarvis", "hey jarvis", "ok jarvis"];

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
    keywords = DEFAULT_KEYWORDS,
    confidenceThreshold = 0.75, // Seuil élevé pour éviter faux positifs (bruit de fond)
    language = "fr-FR",
    lastSpeechEndTimeRef,
    speechSafetyPeriodMs = 3500,
  } = options;

  const [isEnabled, setIsEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastDetection, setLastDetection] = useState<Date | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isEnabledRef = useRef(isEnabled);

  // Sync ref
  useEffect(() => {
    isEnabledRef.current = isEnabled;
  }, [isEnabled]);

  // Serialiser keywords pour useMemo/useEffect dependency
  const keywordsKey = JSON.stringify(keywords);

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
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }

    // Créer nouvelle instance
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // ✅ Mode continu (meilleur pour Wake Word)
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 3;

    // --- ÉVÉNEMENT: Résultat de reconnaissance ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          `🎤 Wake Word entendu: "${transcript}" (${confidence.toFixed(2)})`,
        );

        // Vérifier si wake word détecté avec confiance suffisante
        const isWakeWord = keywords.some((keyword) =>
          transcript.includes(keyword),
        );

        // Bloquer si Jarvis est en train de parler (évite qu'il s'entende lui-même)
        if (window.speechSynthesis.speaking) return;

        // Bloquer pendant la période de sécurité post-parole (anti-écho)
        if (lastSpeechEndTimeRef) {
          const timeSinceSpeech = Date.now() - lastSpeechEndTimeRef.current;
          if (timeSinceSpeech < speechSafetyPeriodMs) {
            console.log(
              `⏳ Wake Word bloqué (écho post-parole: ${timeSinceSpeech}ms < ${speechSafetyPeriodMs}ms)`,
            );
            return;
          }
        }

        if (isWakeWord && confidence >= confidenceThreshold) {
          console.log("✅ WAKE WORD DÉTECTÉ !");
          setLastDetection(new Date());
          onWakeWordDetected();

          // Pause brève pour éviter double détection
          recognition.stop();
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
      console.log("🛑 Wake Word: écoute terminée (onend)");
      setIsListening(false);

      // Redémarrer automatiquement si toujours activé (via REF pour éviter closure stale)
      if (isEnabledRef.current && recognitionRef.current === recognition) {
        // Nettoyer l'ancien timeout s'il existe
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);

        restartTimeoutRef.current = setTimeout(() => {
          try {
            // Vérifier à nouveau si on doit redémarrer
            if (
              isEnabledRef.current &&
              recognitionRef.current === recognition
            ) {
              recognition.start();
            }
          } catch {
            // console.error("Erreur redémarrage wake word:", error);
          }
        }, speechSafetyPeriodMs); // Aligné sur la période de sécurité anti-écho (3500ms)
      }
    };

    // --- ÉVÉNEMENT: Erreur ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      // Ignorer "aborted" (stop manuel ou conflit)
      if (event.error === "aborted") return;

      // Ignorer "no-speech" (silence)
      if (event.error === "no-speech") return;

      // Gérer erreur réseau
      if (event.error === "network") {
        console.warn(
          "⚠️ Problème réseau vocal (tentative de reconnexion auto via onend...)",
        );
        return;
      }

      console.warn("⚠️ Wake Word erreur:", event.error);
    };

    recognitionRef.current = recognition;

    // Démarrer avec protection
    try {
      recognition.start();
    } catch {
      // console.error("❌ Impossible de démarrer wake word:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    keywordsKey,
    confidenceThreshold,
    language,
    onWakeWordDetected,
    speechSafetyPeriodMs,
  ]);
  const stopListening = useCallback(() => {
    // 🛑 Arrêt critique : on met le ref à false immédiatement pour bloquer tout restart
    isEnabledRef.current = false;

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null; // Important: ne pas déclencher onend
        recognitionRef.current.stop();
      } catch {
        // ignore
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
    disable: useCallback(() => {
      // console.log("🛑 Wake Word Désactivé");
      isEnabledRef.current = false; // Sync immédiat
      setIsEnabled(false);
    }, []),
    /** Active manuellement */
    enable: useCallback(() => {
      // console.log("🟢 Wake Word Activé");
      isEnabledRef.current = true; // Sync immédiat
      setIsEnabled(true);
    }, []),
  };
}
