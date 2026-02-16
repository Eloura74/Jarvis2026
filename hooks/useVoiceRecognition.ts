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
    SpeechRecognition: any;
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
}

export function useVoiceRecognition(
  onTranscript: (text: string) => void,
  onStatusChange?: (listening: boolean) => void,
  onInterimTranscript?: (text: string) => void,
): UseVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
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
      // Demander la permission microphone dès le chargement
      navigator.mediaDevices
        .getUserMedia({ audio: true })
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
          };

          // ========================================
          // ÉVÉNEMENT : RÉSULTAT RECONNAISSANCE (OPTIMISÉ)
          // ========================================
          // Support résultats intermédiaires pour feedback instantané
          let lastInterimTranscript = "";

          recognition.onresult = (event: any) => {
            // Récupérer dernier résultat
            const lastResult = event.results[event.results.length - 1];
            const transcript = lastResult[0].transcript;
            const isFinal = lastResult.isFinal;
            const confidence = lastResult[0].confidence || 1;

            // CAS 1 : Résultat FINAL → traiter immédiatement
            if (isFinal) {
              // Filtrer par confiance minimum
              if (confidence > 0.5) {
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
              const confidence = lastResult[0].confidence || 0;

              // RESET TIMER SILENCE (car on entend quelque chose)
              if (silenceTimerRef.current)
                clearTimeout(silenceTimerRef.current);

              // Nouveau timer : Si plus rien ne change pendant 1.5s, on considère que c'est fini
              silenceTimerRef.current = setTimeout(() => {
                console.log("🤫 Silence détecté (1.5s) -> Arrêt forcé");
                recognition.stop();
              }, 1500);

              // Éviter log spam (seulement si changement significatif)
              if (transcript !== lastInterimTranscript) {
                // Log pour débug Monsieur : voir ce que Jarvis entend pendant qu'il parle
                if (window.speechSynthesis.speaking) {
                  console.log(
                    `🎤 [SPEAKING] Conf: ${(confidence * 100).toFixed(0)}% | Entendu: "${transcript}"`,
                  );
                }

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
          recognition.onerror = (event: any) => {
            // Ignorer les erreurs "aborted" et "no-speech" qui sont fréquentes/normales
            if (event.error === "aborted" || event.error === "no-speech") {
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
          alert(
            "Veuillez autoriser l'accès au microphone pour utiliser la reconnaissance vocale.",
          );
        });
    } else {
      setIsSupported(false);
    }

    // Cleanup : arrêt de la reconnaissance si le composant est démonté
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
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
    } catch (error: any) {
      console.error("❌ Erreur démarrage reconnaissance:", error.message);
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
        console.log("✅ stopAndWait : déjà arrêté, résolution immédiate");
        resolve();
        return;
      }

      console.log(
        "🛑 stopAndWait : arrêt en cours, attente événement onend...",
      );

      // Créer un handler unique pour cet arrêt
      const onEndHandler = () => {
        console.log("✅ stopAndWait : événement onend reçu");
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
      } catch (error: any) {
        console.error("⚠️ Erreur stopAndWait:", error.message);
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
  };
}
