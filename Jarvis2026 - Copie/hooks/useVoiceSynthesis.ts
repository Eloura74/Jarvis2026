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
}

interface UseVoiceSynthesisReturn {
  /** Prononce le texte fourni avec la voix configurée */
  speak: (text: string) => void;
  /** Arrête toute lecture en cours */
  stop: () => void;
  /** Indique si une lecture est en cours */
  isSpeaking: boolean;
}

export function useVoiceSynthesis({
  enabled,
  onStart,
  onEnd,
}: UseVoiceSynthesisOptions): UseVoiceSynthesisReturn {
  /**
   * Prononce le texte fourni avec la voix J.A.R.V.I.S.-like
   *
   * Configure une voix britannique avec un ton légèrement grave
   * et une cadence rapide pour simuler l'efficacité de J.A.R.V.I.S.
   *
   * @param text - Texte à prononcer
   */
  const speak = useCallback(
    (text: string) => {
      // Si la synthèse est désactivée, ne rien faire
      if (!enabled) return;

      // Création de l'énoncé vocal
      const utterance = new SpeechSynthesisUtterance(text);

      // Récupération des voix disponibles
      const voices = window.speechSynthesis.getVoices();

      // Recherche d'une voix britannique ou technologique
      // Ordre de préférence :
      // 1. Google UK English Male (voix masculine britannique)
      // 2. Daniel (voix iOS britannique)
      // 3. Toute voix en-GB (britannique générique)
      const preferredVoice = voices.find(
        (v) =>
          v.name.includes("Google UK English Male") ||
          v.name.includes("Daniel") ||
          v.lang.startsWith("en-GB"),
      );

      // Application de la voix trouvée
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Configuration des paramètres vocaux (style J.A.R.V.I.S.)
      utterance.pitch = 0.9; // Ton légèrement grave (plus autoritaire)
      utterance.rate = 1.1; // Cadence rapide (efficacité, intelligence)
      utterance.volume = 1.0; // Volume maximum

      // Synchronisation avec l'état du système
      utterance.onstart = () => {
        // Notification du début de la lecture
        onStart?.();
      };

      utterance.onend = () => {
        // Notification de la fin de la lecture
        onEnd?.();
      };

      // Gestion des erreurs
      utterance.onerror = (event) => {
        console.error("Erreur synthèse vocale:", event.error);
        // On appelle onEnd même en cas d'erreur pour remettre l'état à jour
        onEnd?.();
      };

      // Démarrage de la synthèse vocale
      window.speechSynthesis.speak(utterance);
    },
    [enabled, onStart, onEnd],
  );

  /**
   * Arrête toute lecture vocale en cours
   */
  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    // Notification de l'arrêt
    onEnd?.();
  }, [onEnd]);

  /**
   * Vérifie si une lecture est actuellement en cours
   */
  const isSpeaking = window.speechSynthesis.speaking;

  return {
    speak,
    stop,
    isSpeaking,
  };
}
