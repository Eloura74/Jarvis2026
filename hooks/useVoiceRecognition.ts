/**
 * Hook personnalisé pour la reconnaissance vocale (Web Speech API)
 *
 * Gère l'initialisation, le démarrage et l'arrêt de la reconnaissance vocale.
 * Fournit les transcriptions via un callback et synchronise l'état d'écoute.
 *
 * COMPATIBILITÉ : Chrome, Edge (nécessite préfixe webkit sur certains navigateurs)
 *
 * @param onTranscript - Fonction appelée avec la transcription détectée
 * @param onStatusChange - (Optionnel) Fonction appelée lors des changements d'état (listening/idle)
 * @returns Objet contenant les méthodes de contrôle et l'état
 *
 * @example
 * ```typescript
 * const { isListening, startListening, stopListening } = useVoiceRecognition(
 *   (text) => console.log('Transcription:', text),
 *   (listening) => console.log('Écoute:', listening)
 * );
 * ```
 */

import { useState, useEffect, useRef, useCallback } from "react";

// Déclaration globale pour la Web Speech API
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

interface UseVoiceRecognitionReturn {
  /** Indique si le système est actuellement en écoute */
  isListening: boolean;
  /** Indique si la Web Speech API est supportée par le navigateur */
  isSupported: boolean;
  /** Démarre l'écoute vocale */
  startListening: () => void;
  /** Arrête l'écoute vocale */
  stopListening: () => void;
  /** Bascule entre écoute et arrêt */
  toggleListening: () => void;
  /** Arrête l'écoute et attend l'événement onend (résout la race condition asynchrone) */
  stopAndWait: () => Promise<void>;
  /** Force la réactivation du micro (utile quand le navigateur mute pendant le TTS) */
  forceResumeListening: () => void;
}

// Types pour Web Speech API
interface SpeechRecognitionEvent {
  results: {
    length: number;
    item(index: number): {
      transcript: string;
      confidence: number;
    }[];
    [index: number]: {
      isFinal: boolean;
      0: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

export function useVoiceRecognition(
  onTranscript: (text: string) => void,
  onStatusChange?: (listening: boolean) => void,
  onInterimTranscript?: (text: string) => void,
  onError?: (error: string) => void,
): UseVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  // Flag pour empêcher les appels multiples à start() avant onstart
  const isStartingRef = useRef(false);
  // Ref synchrone pour isListening (résout problème state asynchrone React)
  const isListeningRef = useRef(false);

  // Timer custom pour détection de silence (plus rapide que le natif)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onTranscriptRef = useRef(onTranscript);
  const onStatusChangeRef = useRef(onStatusChange);

  // Mettre à jour les refs à chaque rendu
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onStatusChangeRef.current = onStatusChange;
  }, [onTranscript, onStatusChange]);

  // Initialisation de la reconnaissance vocale au montage du composant
  useEffect(() => {
    // Vérification du support de la Web Speech API (avec préfixe webkit)
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      // Demander la permission microphone dès le chargement avec annulation d'écho
      navigator.mediaDevices
        .getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        .then((stream) => {
          stream.getTracks().forEach((track) => track.stop());

          // Initialiser SpeechRecognition après permission
          const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognition = new SpeechRecognition();

          // ========================================
          // OPTIMISATION : INTERIM RESULTS
          // ========================================
          // Configuration optimisée pour feedback instantané
          // ✅ Mode continu ACTIVÉ pour conversation fluide
          recognition.continuous = true; // Mode continu (permet enchaînement naturel)
          recognition.interimResults = true; // ✅ Résultats intermédiaires activés
          recognition.lang = "fr-FR"; // Langue française (J.A.R.V.I.S. français)
          recognition.maxAlternatives = 1; // Une seule alternative pour performance

          // Événement : démarrage de l'écoute
          recognition.onstart = () => {
            isStartingRef.current = false; // Réinitialisation du flag de démarrage
            isListeningRef.current = true; // ✅ Mise à jour ref synchrone
            setIsListening(true);
            // Notification du changement d'état au composant parent
            if (onStatusChangeRef.current) {
              onStatusChangeRef.current(true);
            }
            // 🟣 SPHERE: LISTENING
            fetch("http://localhost:3001/api/sphere/state", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ state: "LISTENING" }),
            }).catch(() => {});
          };

          // Événement : fin de l'écoute (automatique ou manuelle)
          recognition.onend = () => {
            isStartingRef.current = false; // Réinitialisation du flag de démarrage
            isListeningRef.current = false; // ✅ Mise à jour ref synchrone
            setIsListening(false);
            // Notification du changement d'état au composant parent
            if (onStatusChangeRef.current) {
              onStatusChangeRef.current(false);
            }
            // 🟣 SPHERE: IDLE -> DISABLED to allow persistent visual modes
            // We only want to exit LISTENING state, but not force IDLE if another mode is active (e.g. TIMER)
            // Ideally, we should revert to previous mode, but for now we just don't force IDLE.
            // The next command will set the mode, or it stays as is.
            /*
            fetch("http://localhost:3001/api/sphere/state", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ state: "IDLE" }),
            }).catch(() => {});
            */

            // However, we MUST ensure we exit the "LISTENING" visual if we were in it.
            // If the sphere is *currently* in LISTENING mode, we should go to IDLE.
            // But if we are in TIMER/MEDIA, we should stay there.
            // Since we can't easily know the current mode here without complex state management,
            // we will let the `processCommand` handle the new state.
            // If the user just stopped speaking without a command (timeout/silence), we might be stuck in LISTENING?
            // Let's rely on the fact that `processCommand` will trigger eventually, OR hitting the mic button toggles it.

            // COMPROMISE: We send IDLE only if we are just stopping listening without a detected command?
            // Actually, `processCommand` sets the mode.
            // Let's try sending "IDLE" only if we didn't detect anything? Too complex here.

            // DECISION: We send IDLE here because "LISTENING" is a specific state.
            // But this overrides the "TIMER" mode if we toggle mic while timer is running.
            // Wait, "LISTENING" is a state in main.cpp.
            // If we send "IDLE", it goes to IDLE wave.

            // User wants: "Jusqu'a la prochaine commande OU ARRET DE L'ECOUTE".
            // So "Arret de l'ecoute" SHOULD reset to IDLE?
            // "Les animations sont trop courte, il faudrazis les avoir jusqu'a la prochaine commande, ou arret de lecoute etc"
            // This might mean: "Keep the animation (like timer) UNTIL I start listening again OR stop listening?"
            // Actually, if I ask "Mets un timer", the timer appears. Then listening stops.
            // If `onend` sends IDLE, the timer disappears immediately. BAD.

            // So `onend` SHOULD NOT send IDLE if a command is processing.
            // But `onend` happens before `processCommand` usually.

            // FIX: We will NOT send IDLE here. We will let `processCommand` set the visual.
            // BUT: If I just open mic and close it without saying anything, it stays in "LISTENING" (Green)?
            // We need to handle that.

            // For now, let's comment it out to allow persistence of the Result Mode.
            // And we rely on `startListening` sending "LISTENING" to clear the previous mode.

            // Re-enabling IDLE is risky for persistence.
            // Let's assume the user wants the Result Visualization to stay.
            // So we DO NOT reset to IDLE here.
          };

          // ========================================
          // ÉVÉNEMENT : RÉSULTAT RECONNAISSANCE (OPTIMISÉ)
          // ========================================
          // Support résultats intermédiaires pour feedback instantané
          let lastInterimTranscript = "";

          recognition.onresult = (event: SpeechRecognitionEvent) => {
            // Récupérer dernier résultat
            const lastResult = event.results[event.results.length - 1];
            const transcript = lastResult[0].transcript;
            const isFinal = lastResult.isFinal;
            const confidence = lastResult[0].confidence || 1;

            // CAS 1 : Résultat FINAL → traiter immédiatement
            if (isFinal) {
              // Filtrer par confiance minimum
              if (confidence > 0.65) {
                console.log(
                  `✅ Transcription finale: "${transcript}" (${Math.round(confidence * 100)}%)`,
                );

                // Envoi transcription au parent
                if (onTranscriptRef.current) {
                  onTranscriptRef.current(transcript);
                }
              } else {
                console.log(
                  `⚠️ Confiance faible (${Math.round(confidence * 100)}%) → ignoré: "${transcript}"`,
                );
              }
            }
            // CAS 2 : Résultat INTERIM → preview et commandes rapides
            else {
              // RESET TIMER SILENCE (car on entend quelque chose)
              if (silenceTimerRef.current)
                clearTimeout(silenceTimerRef.current);

              // Nouveau timer : Si plus rien ne change pendant 1.5s, on considère que c'est fini
              silenceTimerRef.current = setTimeout(() => {
                recognition.stop();
              }, 1500);

              // Éviter log spam (seulement si changement significatif)
              if (transcript !== lastInterimTranscript) {
                // Fragments intermédiaires non loggés (trop verbeux)

                lastInterimTranscript = transcript;

                // Envoi transcription intermédiaire au parent
                // On accepte un niveau de confiance plus bas pour le STOP (priorité réactivité)
                if (onInterimTranscript) {
                  onInterimTranscript(transcript);
                }
              }
            }
          };
          // Événement : erreur de reconnaissance
          recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            if (event.error === "not-allowed") {
              // Micro refusé : notifier l'utilisateur vocalement via callback
              console.warn("⚠️ Microphone refusé par le navigateur.");
              if (onError) {
                onError(
                  "Accès au microphone refusé, Monsieur. Veuillez l'autoriser dans les paramètres du navigateur.",
                );
              }
            } else if (
              event.error === "aborted" ||
              event.error === "no-speech"
            ) {
              console.warn(
                `⚠️ Reconnaissance vocale interrompue (${event.error})`,
              );
            } else {
              console.error("Erreur reconnaissance vocale:", event.error);
            }

            isStartingRef.current = false; // Réinitialisation du flag en cas d'erreur
            isListeningRef.current = false; // ✅ Mise à jour ref synchrone
            setIsListening(false);
            if (onStatusChangeRef.current) {
              onStatusChangeRef.current(false);
            }
          };

          recognitionRef.current = recognition;
          setIsSupported(true);
        })
        .catch((error) => {
          console.warn("Permission microphone refusée:", error.message);
          setIsSupported(false);
          // Notifier via callback (pas d'alert bloquant)
          if (onError) {
            onError(
              "Accès au microphone refusé. Veuillez l'autoriser dans les paramètres du navigateur.",
            );
          }
        });
    } else {
      setIsSupported(false);
    }

    // Cleanup : arrêt de la reconnaissance si le composant est démonté
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore les erreurs si déjà arrêté
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Exécuter UNE SEULE FOIS au montage (callbacks gérés via closure)

  // Méthode : démarrage de l'écoute
  const startListening = useCallback(() => {
    // console.log(
    //   `🎤 startListening appelé - recognitionRef=${!!recognitionRef.current}, isListeningRef=${isListeningRef.current}, isStarting=${isStartingRef.current}`,
    // );

    if (!recognitionRef.current) {
      console.error("❌ recognitionRef.current est null");
      return;
    }

    // ✅ VÉRIFICATION AVEC REF (synchrone) au lieu du state (asynchrone)
    if (isListeningRef.current || isStartingRef.current) {
      // console.warn(
      //   `⚠️ startListening bloqué : isListeningRef=${isListeningRef.current}, isStarting=${isStartingRef.current}`,
      // );
      return;
    }

    try {
      // console.log("✅ Démarrage reconnaissance vocale...");
      isStartingRef.current = true;
      recognitionRef.current.start();
    } catch (error: unknown) {
      const err = error as Error;
      console.error("❌ Erreur démarrage reconnaissance:", err.message);
      isStartingRef.current = false;
      isListeningRef.current = false;
    }
  }, []);

  // Méthode : arrêt de l'écoute
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Erreur arrêt reconnaissance:", error);
      }
    }
  }, []);

  // Méthode : basculement écoute/arrêt
  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  // Méthode : forcer la relance (contourne les refs de sécurité)
  const forceResumeListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        // FORCE RESUME (log supprimé)
        isStartingRef.current = true;
        recognitionRef.current.start();
      } catch {
        // Ignorer l'erreur si c'est déjà démarré
        isStartingRef.current = false;
      }
    }
  }, []);

  // ========================================
  // MÉTHODE : Arrêt AVEC ATTENTE événement onend
  // ========================================
  // Cette méthode résout la race condition asynchrone lors du mode conversation.
  // Retourne une Promise qui se résout UNIQUEMENT quand l'événement recognition.onend se déclenche.
  // Utilisée pour garantir que isListening=false avant de redémarrer.
  const stopAndWait = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      // Si pas de reconnaissance active ou déjà arrêté, résoudre immédiatement
      if (!recognitionRef.current || !isListeningRef.current) {
        // stopAndWait : déjà arrêté
        resolve();
        return;
      }

      // stopAndWait : arrêt en cours

      // Créer un handler unique pour cet arrêt
      const onEndHandler = () => {
        // stopAndWait : onend reçu
        // Retirer le listener pour éviter les fuites mémoire
        recognitionRef.current?.removeEventListener("end", onEndHandler);
        // ✅ Forcer ref à false immédiatement (le state sera mis à jour par recognition.onend)
        isListeningRef.current = false;
        resolve();
      };

      // Ajouter le listener AVANT d'appeler stop()
      recognitionRef.current.addEventListener("end", onEndHandler);

      // Démarrer l'arrêt
      try {
        recognitionRef.current.stop();
      } catch (error: unknown) {
        const err = error as Error;
        console.error("⚠️ Erreur stopAndWait:", err.message);
        // En cas d'erreur, nettoyer le listener et résoudre quand même
        recognitionRef.current?.removeEventListener("end", onEndHandler);
        isListeningRef.current = false;
        resolve();
      }
    });
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    stopAndWait,
    forceResumeListening,
  };
}
