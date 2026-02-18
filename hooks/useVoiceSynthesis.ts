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

import { useCallback, useRef } from "react";

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
  // Ref pour empêcher le Garbage Collection de l'utterance en cours
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // 🎯 Queue de messages pour éviter les interruptions
  const messageQueue = useRef<string[]>([]);
  const isProcessingQueue = useRef(false);

  /**
   * Traite le prochain message de la queue
   */
  const processNextInQueue = useCallback(() => {
    if (messageQueue.current.length === 0) {
      isProcessingQueue.current = false;
      return;
    }

    // Force le démarrage si le navigateur ment sur "speaking" depuis trop longtemps
    // Mais on essaie quand même de respecter la file d'attente
    if (window.speechSynthesis.speaking) {
      // Petit hack : parfois speaking reste true alors que ça ne parle plus.
      // On pourrait ajouter un timeout de garde ici, mais pour l'instant on fait simple.
      // On retente dans 100ms
      setTimeout(processNextInQueue, 100);
      return;
    }

    const nextMessage = messageQueue.current.shift();
    if (nextMessage) {
      speakImmediate(nextMessage);
    } else {
      isProcessingQueue.current = false;
    }
  }, []);

  /**
   * Prononciation immédiate sans queue
   */
  const speakImmediate = useCallback(
    (text: string) => {
      // Si la synthèse est désactivée, ne rien faire
      if (!enabled) {
        isProcessingQueue.current = false;
        return;
      }

      // Création de l'énoncé vocal
      const utterance = new SpeechSynthesisUtterance(text);

      // Stockage dans la ref pour éviter le GC
      currentUtteranceRef.current = utterance;

      // Sélection de la voix
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

      // Configuration des paramètres vocaux
      utterance.pitch = pitch;
      utterance.rate = rate;
      utterance.volume = volume;

      // Synchronisation avec l'état du système
      utterance.onstart = () => {
        console.log("🔊 TTS Start:", text.substring(0, 20) + "...");
        onStart?.();
      };

      const handleEndOrError = (type: string) => {
        console.log(`🔊 TTS ${type}`);
        onEnd?.(); // Signal fin à l'UI
        currentUtteranceRef.current = null;

        // Délai avant le prochain message
        setTimeout(() => {
          processNextInQueue();
        }, 50);
      };

      utterance.onend = () => handleEndOrError("End");
      utterance.onerror = (event) => {
        console.error("Erreur synthèse vocale:", event.error);
        // Si interrompu, c'est souvent volonaitre, on ne log pas en erreur critique
        handleEndOrError("Error");
      };

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error("Exception synthèse vocale:", e);
        // En cas d'exception synchrone, on passe au suivant
        handleEndOrError("Exception");
      }
    },
    [
      enabled,
      onStart,
      onEnd,
      volume,
      pitch,
      rate,
      voiceURI,
      processNextInQueue, // Dépendance cyclique gérée par useCallback/ref
    ],
  );

  const speak = useCallback(
    (text: string, queue: boolean = false) => {
      if (!enabled) return;

      console.log(
        `🗣️ Speak request: "${text.substring(0, 20)}..." (Queue: ${queue})`,
      );

      if (queue) {
        // Ajouter à la file d'attente
        messageQueue.current.push(text);

        // Démarrer le traitement si pas déjà en cours
        if (!isProcessingQueue.current) {
          isProcessingQueue.current = true;
          processNextInQueue();
        }
      } else {
        // Annuler tout et parler immédiatement
        console.log("🛑 Force speak: cancelling previous audio");
        window.speechSynthesis.cancel();

        // Timeout pour laisser le cancel se propager et nettoyer l'état
        setTimeout(() => {
          messageQueue.current = []; // Vider la queue
          isProcessingQueue.current = false; // Reset état file
          // Petit hack : parfois cancel() ne reset pas speaking immédiatement
          // On force le passage
          speakImmediate(text);
        }, 50);
      }
    },
    [enabled, speakImmediate, processNextInQueue],
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    messageQueue.current = [];
    isProcessingQueue.current = false;
    currentUtteranceRef.current = null;
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
