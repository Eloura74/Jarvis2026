/**
 * Hook personnalisé pour la synthèse vocale (Text-to-Speech)
 *
 * Gère la conversion texte → parole avec personnalisation de la voix.
 * Supporte la synchronisation avec l'état du système via callbacks.
 *
 * COMPATIBILITÉ : Tous les navigateurs modernes (API native)
 *
 * @param options - Configuration du hook
 * @param options.enabled - Active ou désactive la synthèse vocale
 * @param options.onStart - (Optionnel) Callback appelé au début de la lecture
 * @param options.onEnd - (Optionnel) Callback appelé à la fin de la lecture
 * @returns Méthode speak pour prononcer du texte
 *
 * @example
 * ```typescript
 * const { speak } = useVoiceSynthesis({
 *   enabled: true,
 *   onStart: () => setStatus('SPEAKING'),
 *   onEnd: () => setStatus('IDLE')
 * });
 *
 * speak("Bienvenue, Sir.");
 * ```
 */

import { useCallback } from "react";

interface UseVoiceSynthesisOptions {
  /** Active ou désactive la synthèse vocale */
  enabled: boolean;
  /** Callback appelé au début de la lecture */
  onStart?: () => void;
  /** Callback appelé à la fin de la lecture */
  onEnd?: () => void;
  /** Volume de la voix (0-1), par défaut 1.0 */
  volume?: number;
  /** Hauteur de la voix (0-2), par défaut 1.0 */
  pitch?: number;
  /** Vitesse de la voix (0.1-10), par défaut 1.0 */
  rate?: number;
  /** URI de la voix spécifique à utiliser */
  voiceURI?: string | null;
}

interface UseVoiceSynthesisReturn {
  /** Prononce le texte fourni avec la voix configurée */
  speak: (text: string, queue?: boolean) => void;
  /** Arrête toute lecture en cours */
  stop: () => void;
  /** Indique si une lecture est en cours */
  isSpeaking: boolean;
}

export function useVoiceSynthesis({
  enabled,
  onStart,
  onEnd,
  volume = 1.0,
  pitch = 1.0,
  rate = 1.0,
  voiceURI = null,
}: UseVoiceSynthesisOptions): UseVoiceSynthesisReturn {
  /**
   * Prononce le texte fourni avec la voix J.A.R.V.I.S.-like
   *
   * @param text - Texte à prononcer
   * @param queue - Si vrai, n'annule pas la parole en cours (ajoute à la file d'attente)
   */
  const speak = useCallback(
    (text: string, queue: boolean = false) => {
      // Si la synthèse est désactivée, ne rien faire
      if (!enabled) return;

      // Création de l'énoncé vocal
      const utterance = new SpeechSynthesisUtterance(text);

      // ... (Sélection de la voix identique)
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice: SpeechSynthesisVoice | undefined;
      if (voiceURI) selectedVoice = voices.find((v) => v.voiceURI === voiceURI);

      if (!selectedVoice) {
        selectedVoice =
          voices.find(
            (v) => v.lang.startsWith("fr-FR") && v.name.includes("Google"),
          ) ||
          voices.find(
            (v) => v.lang.startsWith("fr-FR") && v.name.includes("Denise"),
          ) ||
          voices.find((v) => v.lang.startsWith("fr-FR"));
      }

      if (selectedVoice) utterance.voice = selectedVoice;

      // NOUVEAU : Gestion de la file d'attente
      if (!queue) {
        // Démarrage propre : on annule d'abord toute lecture en cours seulement si non-queueing
        window.speechSynthesis.cancel();
      }

      // Configuration des paramètres vocaux
      utterance.pitch = pitch;
      utterance.rate = rate;
      utterance.volume = volume;

      // Synchronisation avec l'état du système
      utterance.onstart = () => onStart?.();
      utterance.onend = () => onEnd?.();
      utterance.onerror = (event) => {
        console.error("Erreur synthèse vocale:", event.error);
        onEnd?.();
      };

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error("Exception synthèse vocale:", e);
      }
    },
    [enabled, onStart, onEnd, volume, pitch, rate, voiceURI],
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    onEnd?.();
  }, [onEnd]);

  // Utilisation d'un getter pour l'état en temps réel
  const isSpeaking = window.speechSynthesis.speaking;

  return {
    speak,
    stop,
    isSpeaking,
  };
}
