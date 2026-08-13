/**
 * useJarvisInteraction - Gestionnaire d'Interaction Vocale
 *
 * Encapsule la logique de :
 * 1. Synthèse vocale (TTS) avec gestion des interruptions
 * 2. Reconnaissance vocale (STT) avec redémarrage intelligent
 * 3. Mode Conversation (Boucle continue)
 * 4. Détection Wake Word
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useVoiceRecognition } from "./useVoiceRecognition";
import { useVoiceSynthesis } from "./useVoiceSynthesis";
import { useWakeWord } from "./useWakeWord";
import { SystemStatus, LogEntry } from "../types";
import { useKernel } from "../hooks/useKernel";
import { playReadyBeep } from "../services/audioFeedback";

interface UseJarvisInteractionProps {
  status: SystemStatus;
  setStatus: (status: SystemStatus) => void;
  addLog: (
    message: string,
    source?: LogEntry["source"],
    type?: LogEntry["type"],
  ) => void;
  onCommandReceived: (text: string) => void;
  /** Ref vers l'état actif d'un dialog flow — réduit le délai anti-écho à 800ms si true */
  isDialogActiveRef?: React.RefObject<boolean>;
}

// Helper : envoie un état à la Sphere via le backend (fire-and-forget)
// Appelé à chaque transition d'état significative pour synchroniser l'orb physique
function sendSphereState(state: string): void {
  fetch("http://localhost:3001/api/sphere/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  }).catch(() => {});
}

export function useJarvisInteraction({
  status,
  setStatus,
  addLog,
  onCommandReceived,
  isDialogActiveRef,
}: UseJarvisInteractionProps) {
  const [conversationMode, setConversationMode] = useState(false);
  // B9 : État d'erreur micro pour badge visuel dans l'UI
  const [micError, setMicError] = useState<string | null>(null);
  const { voiceSettings, wakeWordEnabled } = useKernel();

  // V1 : Durée de la dernière réponse TTS (pour délai anti-écho adaptatif)
  const lastTtsDurationRef = useRef<number>(0);

  // Refs pour gestion asynchrone
  const lastMicActivationTime = useRef<number>(0);
  const lastSpeechEndTime = useRef<number>(0); // Traceur de fin de parole
  const isSpeakingRef = useRef(false);
  const isExitingRef = useRef(false); // Verrou pour éviter les boucles de fin
  // Verrou anti-race-condition : true pendant le délai de réactivation micro en mode conversation.
  // Empêche enableWakeWord() de prendre le micro avant que startListening() soit effectif.
  const isConversationResumingRef = useRef(false);
  const conversationModeRef = useRef(conversationMode);
  const conversationTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout d'inactivité conversation
  const onCommandRef = useRef(onCommandReceived);

  // Sync Refs
  useEffect(() => {
    conversationModeRef.current = conversationMode;
  }, [conversationMode]);
  useEffect(() => {
    onCommandRef.current = onCommandReceived;
  }, [onCommandReceived]);

  // ========================================
  // RECONNAISSANCE VOCALE
  // ========================================
  const {
    isListening,
    toggleListening,
    startListening,
    stopListening,
    forceResumeListening,
  } = useVoiceRecognition(
    (text) => {
      // Callback onTranscript — voir ci-dessous
      // 1. GESTION STOP PRIORITAIRE (Barge-in)
      const textLower = text.toLowerCase();
      const STOP_KEYWORDS = [
        "stop",
        "arrête",
        "arrête-toi",
        "tais-toi",
        "silence",
        "stoppe",
        "annule",
      ];

      const isCurrentlySpeaking =
        isSpeakingRef.current || window.speechSynthesis.speaking;

      if (STOP_KEYWORDS.some((k) => textLower.includes(k))) {
        if (isCurrentlySpeaking) {
          console.log("🛑 BARGE-IN: Interruption vocale détectée");
          // 1. On coupe l'audio en cours
          window.speechSynthesis.cancel();

          // 2. On met à jour l'état
          isSpeakingRef.current = false;
          setStatus(SystemStatus.IDLE);
          // Signaler IDLE à la Sphere : interruption barge-in
          sendSphereState("IDLE");
          addLog("🛑 Interruption vocale", "VOICE", "info");
          return;
        }
      }

      // 2. Filtrer si Jarvis parle : ignorer silencieusement toute transcription
      if (isCurrentlySpeaking) {
        console.log("🔇 Transcription ignorée : Jarvis parle actuellement.");
        return;
      }

      // 3. Période de sécurité (Echo cancellation temporelle : 2.5s après fin de parole)
      const timeSinceSpeech = Date.now() - lastSpeechEndTime.current;
      if (timeSinceSpeech < 2500) {
        console.log(
          `🔇 Transcription ignorée (Echo): ${timeSinceSpeech}ms < 2500ms`,
        );
        return;
      }

      // 3.1. Ignorer les échos isolés de politesse / salutations de Jarvis sans commande
      const ECHO_GREETINGS = [
        "bonjour monsieur",
        "bonjour monsieur comment puis-je vous être utile",
        "bonjour monsieur je me porte à merveille",
        "bon retour au bureau",
        "bonjour au bureau",
        "exécuter bon retour au bureau",
        "comment puis-je vous être utile aujourd'hui",
        "comment puis-je vous aider",
      ];
      const cleanText = textLower.trim();
      if (ECHO_GREETINGS.some((g) => cleanText === g || cleanText.startsWith("bonjour monsieur"))) {
        console.log(`🔇 Transcription ignorée (Écho de salutation) : "${text}"`);
        return;
      }

      const timeSinceMic = Date.now() - lastMicActivationTime.current;
      if (timeSinceMic < 600) {
        console.log(
          `🔇 Transcription ignorée (Mic Init): ${timeSinceMic}ms < 600ms`,
        );
        return;
      }

      // Verrou de fin de conversation
      if (isExitingRef.current) return;

      const END_KEYWORDS = [
        "au revoir",
        "stop écoute",
        "merci c'est tout",
        "terminé",
        "a bientôt",
        "à bientôt",
        "bye",
        "adieu",
        "c'est bon",
        "ça suffira",
        "repos",
        "pause",
      ];
      if (END_KEYWORDS.some((k) => textLower.includes(k))) {
        console.log("👋 Fin de conversation demandée");
        isExitingRef.current = true;
        setConversationMode(false);
        stopListening(); // 🛑 Coupe le micro immédiatement pour éviter l'écho
        // speak("À bientôt !"); // Géré dans le hook complet via rawSpeak plus bas
        // Signaler IDLE directement : onEnd du TTS ne sera jamais atteint si speak() est inactif
        sendSphereState("IDLE");
        addLog("👋 Mode conversation désactivé", "SYSTEM", "info");
        return;
      }

      // 4. Activation Auto du mode conversation + reset timeout inactivité
      if (!conversationMode) {
        setConversationMode(true);
        addLog("🎤 Mode conversation activé", "SYSTEM", "info");
      }
      // Reset du timeout d'inactivité à chaque commande reçue
      if (conversationTimeoutRef.current)
        clearTimeout(conversationTimeoutRef.current);

      // A3 : Signaler PROCESSING à la sphère dès que la commande part vers Gemini
      // (évite que la sphère reste en IDLE/LISTENING pendant le traitement IA)
      sendSphereState("PROCESSING");

      // 6. Transmission de la commande
      console.log(`✅ Commande validée : "${text}"`);
      onCommandRef.current(text);
    },
    // onStatusChange
    (listening) => {
      if (listening) {
        // Lever le verrou de réactivation : le micro est maintenant actif
        isConversationResumingRef.current = false;
        setStatus(SystemStatus.LISTENING);
      } else {
        if (status === SystemStatus.LISTENING) {
          setStatus(SystemStatus.IDLE);
        }
        // Relance automatique en mode conversation si le micro s'arrête seul (no-speech, aborted).
        // On ne relance PAS si : Jarvis parle, on est en train de sortir, ou un timeout est déjà actif.
        // Délai court (300ms) pour laisser le navigateur libérer le micro avant de le reprendre.
        if (
          conversationModeRef.current &&
          !isExitingRef.current &&
          !isSpeakingRef.current &&
          !window.speechSynthesis.speaking
        ) {
          setTimeout(() => {
            // Double vérification : toujours en mode conversation et pas en train de parler
            if (
              conversationModeRef.current &&
              !isExitingRef.current &&
              !isSpeakingRef.current &&
              !window.speechSynthesis.speaking
            ) {
              isConversationResumingRef.current = true;
              lastMicActivationTime.current = Date.now();
              startListening();
            }
          }, 300);
        }
      }
    },
    // onInterimTranscript (Pour réactivité instantanée du STOP)
    (interimText) => {
      const textLower = interimText.toLowerCase();
      const STOP_KEYWORDS = [
        "stop",
        "arrête",
        "arrête-toi",
        "tais-toi",
        "silence",
        "stoppe",
        "annule",
      ];

      if (STOP_KEYWORDS.some((k) => textLower.includes(k))) {
        if (isSpeakingRef.current || window.speechSynthesis.speaking) {
          console.log("⚡ BARGE-IN PRIORITAIRE: Interruption détectée");
          window.speechSynthesis.cancel();
          isSpeakingRef.current = false;
          setStatus(SystemStatus.IDLE);
          // Signaler IDLE à la Sphere : interruption barge-in prioritaire
          sendSphereState("IDLE");
          addLog("🛑 Interruption immédiate", "VOICE", "info");
        }
      }
    },
    // onError : annonce vocale + badge visuel si le micro est refusé (B9)
    (errorMessage) => {
      addLog(`⚠️ Micro: ${errorMessage}`, "SYSTEM", "error");
      setMicError(errorMessage); // B9 : exposer l'erreur pour badge UI
      // Utiliser speechSynthesis directement car rawSpeak n'est pas encore défini ici
      const utterance = new SpeechSynthesisUtterance(errorMessage);
      utterance.lang = "fr-FR";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    },
  );

  // ========================================
  // SYNTHÈSE VOCALE
  // ========================================
  const { speak: rawSpeak } = useVoiceSynthesis({
    enabled: true,
    voiceURI: voiceSettings.voiceURI,
    pitch: voiceSettings.pitch,
    rate: voiceSettings.rate,
    volume: voiceSettings.volume,
    onStart: async () => {
      isSpeakingRef.current = true;
      setStatus(SystemStatus.SPEAKING);
      // Signaler SPEAKING à la Sphere
      sendSphereState("SPEAKING");

      // 🔈 Audio Ducking : baisser le volume des autres apps pendant que Jarvis parle
      fetch("http://localhost:3001/api/system/duck/start", { method: "POST" }).catch(() => {});

      // On force le réveil du micro 100ms après le début de la parole (pour contrer la coupure navigateur)
      setTimeout(() => {
        forceResumeListening();
      }, 100);
    },
    onEnd: (ttsDurationMs: number) => {
      // Fin parole Jarvis — log supprimé
      setStatus(SystemStatus.IDLE);
      // Signaler IDLE à la Sphere : le timer screensaver peut redémarrer
      sendSphereState("IDLE");
      lastSpeechEndTime.current = Date.now(); // Marquer le moment exact

      // 🔈 Audio Ducking : restaurer le volume après la parole
      fetch("http://localhost:3001/api/system/duck/stop", { method: "POST" }).catch(() => {});

      // Stocker la durée TTS pour le délai adaptatif (V1)
      lastTtsDurationRef.current = ttsDurationMs;

      // PROTECTION CRITIQUE : Si la file d'attente vocale a encore des choses à dire,
      // on ne réactive PAS encore le micro (on attendra le prochain onEnd)
      if (window.speechSynthesis.speaking) {
        // Parole encore en cours — log supprimé
        return;
      }

      isSpeakingRef.current = false;

      // V1 : Délai anti-écho ADAPTATIF selon la durée de la réponse TTS
      // - Dialog flow actif → 800ms (réponse rapide attendue)
      // - TTS < 2s (réponse courte) → 1200ms (écho court)
      // - TTS 2-5s (réponse moyenne) → 2000ms
      // - TTS > 5s (réponse longue) → 2800ms
      // Plafond à 2800ms (au lieu de 3500ms) pour plus de fluidité
      let resumeDelay: number;
      if (isDialogActiveRef?.current) {
        resumeDelay = 800;
      } else if (ttsDurationMs < 2000) {
        resumeDelay = 1200;
      } else if (ttsDurationMs < 5000) {
        resumeDelay = 2000;
      } else {
        resumeDelay = 2800;
      }

      if (conversationModeRef.current && !isExitingRef.current) {
        // Poser le verrou IMMÉDIATEMENT (avant le setTimeout) pour bloquer enableWakeWord
        isConversationResumingRef.current = true;
        setTimeout(() => {
          // Vérifier une dernière fois qu'on n'est pas en train de parler
          if (window.speechSynthesis.speaking) {
            isConversationResumingRef.current = false;
            return;
          }

          // Réactivation micro — log supprimé
          lastMicActivationTime.current = Date.now();
          startListening();
          // Signaler LISTENING à la Sphere
          sendSphereState("LISTENING");
          // Le verrou sera levé dans onstart de useVoiceRecognition (via onStatusChange listening=true)

          // V2 : Feedback sonore discret pour signaler que le micro est prêt
          // Bip court (880Hz, 80ms, volume 0.15) — non capté par le micro
          playReadyBeep();

          // A2 : Feedback vocal court "Je vous écoute" après réactivation micro
          // Seulement si la réponse précédente était longue (> 3s) pour éviter
          // le spam sur les échanges rapides. Utilise speechSynthesis directement
          // (hors queue TTS) pour ne pas déclencher les callbacks onStart/onEnd.
          if (ttsDurationMs > 3000) {
            const hint = new SpeechSynthesisUtterance("Je vous écoute.");
            hint.lang = "fr-FR";
            hint.volume = 0.6;
            hint.rate = 1.1;
            // Délai court pour laisser le bip se terminer avant la phrase
            setTimeout(() => {
              if (!window.speechSynthesis.speaking) {
                window.speechSynthesis.speak(hint);
              }
            }, 150);
          }

          // Timeout d'inactivité : si personne ne parle dans les 15s, on quitte le mode conversation
          if (conversationTimeoutRef.current)
            clearTimeout(conversationTimeoutRef.current);
          conversationTimeoutRef.current = setTimeout(() => {
            if (
              conversationModeRef.current &&
              !window.speechSynthesis.speaking
            ) {
              // Timeout inactivité conversation — log supprimé
              setConversationMode(false);
              stopListening();
              // Signaler IDLE à la Sphere : plus personne ne parle
              sendSphereState("IDLE");
            }
          }, 15000);
        }, resumeDelay);
      } else if (isExitingRef.current) {
        console.log("👋 Fin de session confirmée, micro reste coupé.");
        isExitingRef.current = false; // Reset immédiat
        setConversationMode(false);
        // Signaler IDLE à la Sphere : fin de session, screensaver peut s'activer
        sendSphereState("IDLE");
      }
    },
  });

  // Synthèse vocale standard (Gemini TTS désactivé car instable)
  const speak = useCallback(
    (text: string, queue: boolean = false) => {
      rawSpeak(text, queue);
    },
    [rawSpeak],
  );

  // ========================================
  // WATCHDOG DE SÉCURITÉ (Fix status bloqué)
  // ========================================
  useEffect(() => {
    const interval = setInterval(() => {
      // CAS 1 : Statut SPEAKING bloqué alors que le navigateur ne parle plus
      if (
        status === SystemStatus.SPEAKING &&
        !window.speechSynthesis.speaking
      ) {
        console.warn("⚠️ Watchdog: Statut bloqué sur SPEAKING corrigé -> IDLE");
        setStatus(SystemStatus.IDLE);
        isSpeakingRef.current = false;
        const timeSinceSpeech = Date.now() - lastSpeechEndTime.current;
        lastSpeechEndTime.current = Date.now();

        // Relance écoute si mode conversation, mais seulement hors période de sécurité
        if (
          conversationModeRef.current &&
          !isExitingRef.current &&
          timeSinceSpeech >= 3500
        ) {
          startListening();
        }
      }

      // CAS 2 : isConversationResumingRef bloqué à true alors que le micro est inactif
      // Cela empêche le wake word de se réactiver ou le micro de reprendre correctement
      if (
        isConversationResumingRef.current &&
        !isListening &&
        !window.speechSynthesis.speaking
      ) {
        // On attend 2 secondes max avant de considérer le flag comme bloqué
        const timeSinceMicActivation =
          Date.now() - lastMicActivationTime.current;
        if (timeSinceMicActivation > 2000) {
          console.warn(
            "⚠️ Watchdog: isConversationResumingRef bloqué depuis > 2s, reset forcé",
          );
          isConversationResumingRef.current = false;
          // Si on devait écouter, on relance. Sinon on force l'IDLE pour réveiller le WakeWord
          if (
            conversationModeRef.current &&
            !isExitingRef.current &&
            status === SystemStatus.IDLE
          ) {
            startListening();
          } else if (status === SystemStatus.IDLE) {
            setStatus(SystemStatus.IDLE); // Trigger useEffect
          }
        }
      }
    }, 500); // Vérification toutes les 500ms

    return () => clearInterval(interval);
  }, [status, isListening, setStatus, conversationModeRef, startListening]);

  // ========================================
  // WAKE WORD
  // ========================================
  const {
    enable: enableWakeWord,
    disable: disableWakeWord,
    lastDetection, // Récupérer la date de dernière détection
  } = useWakeWord(
    useCallback(() => {
      // Callback vide par sécurité (tout est géré dans le useEffect ci-dessous)
    }, []),
    {
      // Partager la ref de fin de parole pour bloquer les échos de Jarvis
      lastSpeechEndTimeRef: lastSpeechEndTime,
      speechSafetyPeriodMs: 3500,
    },
  );

  // 🛑 GESTION WAKE WORD DÉTECTÉ (via useEffect pour éviter erreur d'initialisation)
  useEffect(() => {
    // Si une détection récente a eu lieu et qu'on est en IDLE
    if (lastDetection && status === SystemStatus.IDLE) {
      addLog("Wake word detected", "VOICE", "info");

      // 1. Désactiver immédiatement le module wake word
      disableWakeWord();

      // 2. Pause de sécurité (500ms) pour libérer le micro
      setTimeout(() => {
        lastMicActivationTime.current = Date.now();
        startListening();
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastDetection]); // Se déclenche UNIQUEENT quand lastDetection change (nouvelle détection)

  // Gestion intelligente du Wake Word
  // Désactive le wake word quand on est déjà en train d'écouter ou que Jarvis parle,
  // ou si l'option est désactivée dans les paramètres.
  // IMPORTANT : on bloque aussi si isConversationResumingRef est true pour éviter la
  // race condition où le wake word prend le micro avant que startListening() soit effectif.
  useEffect(() => {
    if (
      wakeWordEnabled &&
      !isListening &&
      status === SystemStatus.IDLE &&
      !isConversationResumingRef.current
    ) {
      enableWakeWord();
    } else {
      disableWakeWord();
    }
  }, [status, isListening, enableWakeWord, disableWakeWord, wakeWordEnabled]);

  // ========================================
  // GESTION MANUELLE MICRO
  // ========================================
  const handleMicrophoneClick = useCallback(() => {
    // Si on démarre l'écoute manuelle
    if (!isListening) {
      console.log("🖱️ Clic Micro : Désactivation forcée du Wake Word");
      disableWakeWord(); // 🛑 On coupe d'abord le wake word

      // Petit délai pour laisser le temps au wake word de s'éteindre
      // (Même mécanisme que pour la détection vocale autom)
      setTimeout(() => {
        lastMicActivationTime.current = Date.now();
        startListening();
      }, 300);
    } else {
      // Arrêt normal
      toggleListening();
    }
  }, [isListening, toggleListening, disableWakeWord, startListening]);

  // Fonction de clôture propre (utilisée par l'IA ou le local)
  const stopFullConversation = useCallback(() => {
    console.log("👋 Fermeture de la session de conversation");
    isExitingRef.current = true;
    setConversationMode(false);
    // On ne dit rien ici, on laisse l'appelant décider s'il veut speak()
  }, []);

  return {
    isListening,
    handleMicrophoneClick,
    speak,
    conversationMode,
    setConversationMode,
    stopFullConversation,
    micError, // B9 : erreur micro pour badge UI
    clearMicError: () => setMicError(null), // B9 : reset du badge après lecture
  };
}
