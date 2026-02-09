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
}

export function useVoiceRecognition(
  onTranscript: (text: string) => void,
  onStatusChange?: (listening: boolean) => void,
): UseVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  // Flag pour empêcher les appels multiples à start() avant onstart
  const isStartingRef = useRef(false);

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
          // NOTE: continuous=false pour éviter conflits avec wake word
          recognition.continuous = false; // ❌ Mode continu désactivé (conflit wake word)
          recognition.interimResults = true; // ✅ Résultats intermédiaires activés
          recognition.lang = "fr-FR"; // Langue française (J.A.R.V.I.S. français)
          recognition.maxAlternatives = 1; // Une seule alternative pour performance

          // Événement : démarrage de l'écoute
          recognition.onstart = () => {
            isStartingRef.current = false; // Réinitialisation du flag de démarrage
            setIsListening(true);
            // Notification du changement d'état au composant parent
            if (onStatusChangeRef.current) {
              onStatusChangeRef.current(true);
            }
          };

          // Événement : fin de l'écoute (automatique ou manuelle)
          recognition.onend = () => {
            isStartingRef.current = false; // Réinitialisation du flag de démarrage
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
            // CAS 2 : Résultat INTERIM → preview uniquement
            else {
              // Éviter log spam (seulement si changement significatif)
              if (transcript !== lastInterimTranscript) {
                console.log(`🎤 Preview: "${transcript}"`);
                lastInterimTranscript = transcript;
              }
            }
          };
          // Événement : erreur de reconnaissance
          recognition.onerror = (event: any) => {
            console.error("Erreur reconnaissance vocale:", event.error);
            isStartingRef.current = false; // Réinitialisation du flag en cas d'erreur
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
    if (!recognitionRef.current) {
      return;
    }

    // Vérification : ne pas démarrer si déjà en cours
    if (isListening || isStartingRef.current) {
      return;
    }

    try {
      isStartingRef.current = true;
      recognitionRef.current.start();
    } catch (error: any) {
      console.error("Erreur démarrage reconnaissance:", error.message);
      isStartingRef.current = false;
    }
  }, [isListening]);

  // Méthode : arrêt de l'écoute
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Erreur arrêt reconnaissance:", error);
      }
    }
  }, [isListening]);

  // Méthode : basculement écoute/arrêt
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
