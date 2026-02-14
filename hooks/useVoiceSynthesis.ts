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
  volume = 1.0,
  pitch = 1.0,
  rate = 1.0,
  voiceURI = null,
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

      // ========================================
      // SÉLECTION DE LA VOIX
      // ========================================
      let selectedVoice: SpeechSynthesisVoice | undefined;

      // 1. Essayer la voix spécifiée par URI
      if (voiceURI) {
        selectedVoice = voices.find((v) => v.voiceURI === voiceURI);
      }

      // 2. Fallback : Recherche voix française naturelle (si pas de voix spécifique ou introuvable)
      if (!selectedVoice) {
        selectedVoice =
          voices.find(
            (v) => v.lang.startsWith("fr-FR") && v.name.includes("Google"),
          ) || // Google = meilleure
          voices.find(
            (v) => v.lang.startsWith("fr-FR") && v.name.includes("Denise"),
          ) || // Microsoft Denise
          voices.find(
            (v) => v.lang.startsWith("fr-FR") && v.name.includes("Hortense"),
          ) || // Microsoft Hortense
          voices.find(
            (v) => v.lang.startsWith("fr-FR") && v.name.includes("Julie"),
          ) || // Microsoft Julie
          voices.find((v) => v.lang.startsWith("fr-FR")); // Fallback : n'importe quelle voix fr-FR
      }

      // Application de la voix trouvée
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(
          `🗣️ Voix sélectionnée: ${selectedVoice.name} (${selectedVoice.lang})`,
        );
      } else {
        console.warn(
          "⚠️ Aucune voix française trouvée, utilisation voix par défaut",
        );
      }

      // Démarrage propre : on annule d'abord toute lecture en cours
      window.speechSynthesis.cancel();

      // Configuration des paramètres vocaux
      utterance.pitch = pitch;
      utterance.rate = rate;
      utterance.volume = volume;

      // Log pour debug
      console.log(
        `🎙️ Voix configurée : Pitch ${utterance.pitch} | Rate ${utterance.rate} | Vol ${utterance.volume}`,
      );

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

        if (event.error === "not-allowed") {
          console.warn(
            "🔒 Audio bloqué par le navigateur. Interaction requise !",
          );
        }

        // On appelle onEnd même en cas d'erreur pour remettre l'état à jour
        onEnd?.();
      };

      // Démarrage de la synthèse vocale avec tenteative de reprise du contexte
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
