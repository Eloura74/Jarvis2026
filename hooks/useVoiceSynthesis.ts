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

import { useCallback, useRef, useEffect } from "react";

interface UseVoiceSynthesisOptions {
  /** Active ou désactive la synthèse vocale */
  enabled: boolean;
  /** Callback appelé au début de la lecture */
  onStart?: () => void;
  /** Callback appelé à la fin de la lecture — reçoit la durée totale de parole en ms */
  onEnd?: (durationMs: number) => void;
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

  // Ref pour stocker la fonction speakImmediate et éviter les cycles
  const speakImmediateRef = useRef<(text: string) => void>(() => {});

  // Timestamp de début de parole (pour calcul durée → délai anti-écho adaptatif V1)
  const speechStartTimeRef = useRef<number>(0);

  /**
   * Traite le prochain message de la queue
   */
  const processNextInQueue = useCallback(function processNext() {
    if (messageQueue.current.length === 0) {
      isProcessingQueue.current = false;
      return;
    }

    // Force le démarrage si le navigateur ment sur "speaking" depuis trop longtemps
    if (window.speechSynthesis.speaking) {
      setTimeout(processNext, 100);
      return;
    }

    const nextMessage = messageQueue.current.shift();
    if (nextMessage) {
      // Utilisation de la ref pour appeler la fonction définie après
      speakImmediateRef.current(nextMessage);
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
        // TTS Start (log supprimé)
        speechStartTimeRef.current = Date.now(); // Marquer le début pour calcul durée
        onStart?.();
        // 🟣 SPHERE: SPEAKING
        fetch("http://localhost:3001/api/sphere/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: "SPEAKING" }),
        }).catch(() => {});
      };

      const handleEndOrError = (_type: string) => {
        // TTS End/Error (log supprimé)
        currentUtteranceRef.current = null;

        // Calculer la durée totale de parole (pour délai anti-écho adaptatif V1)
        const durationMs =
          speechStartTimeRef.current > 0
            ? Date.now() - speechStartTimeRef.current
            : 0;
        speechStartTimeRef.current = 0;

        // Délai avant le prochain message
        setTimeout(() => {
          processNextInQueue();

          // 🟣 SPHERE: IDLE uniquement si la queue est vide (sinon SPEAKING du msg suivant sera écrasé)
          if (messageQueue.current.length === 0 && !isProcessingQueue.current) {
            onEnd?.(durationMs); // Signal fin à l'UI avec durée réelle
            fetch("http://localhost:3001/api/sphere/state", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ state: "IDLE" }),
            }).catch(() => {});
          }
        }, 50);
      };

      utterance.onend = () => handleEndOrError("End");
      utterance.onerror = (event) => {
        if (event.error === "interrupted") {
          handleEndOrError("Interrupted");
          return;
        }
        console.error("Erreur synthèse vocale:", event.error);
        handleEndOrError("Error");
      };

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error("Exception synthèse vocale:", e);
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
      processNextInQueue,
    ],
  );

  // Mise à jour de la ref à chaque changement de speakImmediate
  useEffect(() => {
    speakImmediateRef.current = speakImmediate;
  }, [speakImmediate]);

  const speak = useCallback(
    (text: string, queue: boolean = false) => {
      if (!enabled) return;

      // Speak request (log supprimé)

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
        // Force speak: cancel (log supprimé)
        window.speechSynthesis.cancel();

        // Timeout pour laisser le cancel se propager et nettoyer l'état
        setTimeout(() => {
          messageQueue.current = []; // Vider la queue
          isProcessingQueue.current = false; // Reset état file
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
    speechStartTimeRef.current = 0;
    onEnd?.(0);
  }, [onEnd]);

  // Utilisation d'un getter pour l'état en temps réel
  const isSpeaking = window.speechSynthesis.speaking;

  return {
    speak,
    stop,
    isSpeaking,
  };
}
