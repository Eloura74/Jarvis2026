/**
 * useJarvisInteraction - Gestionnaire d'Interaction Vocale
 *
 * Encapsule la logique de :
 * 1. Synthèse vocale (TTS) avec gestion des interruptions
 * 2. Reconnaissance vocale (STT) avec redémarrage intelligent
 * 3. Mode Conversation (Boucle continue)
 * 4. Détection Wake Word
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useVoiceRecognition } from "./useVoiceRecognition";
import { useVoiceSynthesis } from "./useVoiceSynthesis";
import { useWakeWord } from "./useWakeWord";
import { SystemStatus, LogEntry } from "../types";
import { useKernel } from "../hooks/useKernel";

interface UseJarvisInteractionProps {
  status: SystemStatus;
  setStatus: (status: SystemStatus) => void;
  addLog: (
    message: string,
    source?: LogEntry["source"],
    type?: LogEntry["type"],
  ) => void;
  onCommandReceived: (text: string) => void;
}

export function useJarvisInteraction({
  status,
  setStatus,
  addLog,
  onCommandReceived,
}: UseJarvisInteractionProps) {
  const [conversationMode, setConversationMode] = useState(false);
  const { voiceSettings, wakeWordEnabled } = useKernel();

  // Refs pour gestion asynchrone
  const lastMicActivationTime = useRef<number>(0);
  const lastSpeechEndTime = useRef<number>(0); // Traceur de fin de parole
  const isSpeakingRef = useRef(false);
  const isExitingRef = useRef(false); // Verrou pour éviter les boucles de fin
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
          addLog("🛑 Interruption vocale", "VOICE", "info");
          return;
        }
      }

      // 2. Filtrer si Jarvis parle : ignorer silencieusement toute transcription
      // (c'est la voix de Jarvis captée par le micro, pas l'utilisateur)
      // Seul un mot STOP explicite (bloc ci-dessus) peut interrompre.
      if (isCurrentlySpeaking) {
        console.log(
          "🔇 Transcription ignorée (Jarvis parle) :",
          text.substring(0, 30),
        );
        return;
      }

      // 3. Période de sécurité (Echo cancellation temporelle)
      const timeSinceSpeech = Date.now() - lastSpeechEndTime.current;
      if (timeSinceSpeech < 3500) {
        console.log(
          `⏳ Écho filtré (Security period: ${timeSinceSpeech}ms < 3500ms)`,
        );
        return;
      }

      if (Date.now() - lastMicActivationTime.current < 1500) {
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

      // 6. Transmission de la commande
      console.log(`✅ Commande validée : "${text}"`);
      onCommandRef.current(text);
    },
    // onStatusChange
    (listening) => {
      if (listening) {
        setStatus(SystemStatus.LISTENING);
      } else {
        if (status === SystemStatus.LISTENING) {
          setStatus(SystemStatus.IDLE);
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
          addLog("🛑 Interruption immédiate", "VOICE", "info");
        }
      }
    },
    // onError : annonce vocale si le micro est refusé par le navigateur
    (errorMessage) => {
      addLog(`⚠️ Micro: ${errorMessage}`, "SYSTEM", "error");
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
    forceResumeListening: forceResumeListening,
    onStart: async () => {
      isSpeakingRef.current = true;
      setStatus(SystemStatus.SPEAKING);

      // On force le réveil du micro 100ms après le début de la parole (pour contrer la coupure navigateur)
      setTimeout(() => {
        forceResumeListening();
      }, 100);
    },
    onEnd: () => {
      console.log("🔊 Fin parole Jarvis");
      setStatus(SystemStatus.IDLE);
      lastSpeechEndTime.current = Date.now(); // Marquer le moment exact

      // PROTECTION CRITIQUE : Si la file d'attente vocale a encore des choses à dire,
      // on ne réactive PAS encore le micro (on attendra le prochain onEnd)
      if (window.speechSynthesis.speaking) {
        console.log(
          "⏳ Parole encore en cours (file d'attente), attente fin réelle...",
        );
        return;
      }

      isSpeakingRef.current = false;

      // Réactivation micro alignée sur la période de sécurité (3500ms)
      // Cela évite que les échos de la voix de Jarvis soient captés
      if (conversationModeRef.current && !isExitingRef.current) {
        setTimeout(() => {
          // Vérifier une dernière fois qu'on n'est pas en train de parler
          if (window.speechSynthesis.speaking) return;

          console.log(
            "🎤 Mode conversation : Réactivation micro après délai sécurité (3.5s)",
          );
          lastMicActivationTime.current = Date.now();
          startListening();

          // Timeout d'inactivité : si personne ne parle dans les 15s, on quitte le mode conversation
          if (conversationTimeoutRef.current)
            clearTimeout(conversationTimeoutRef.current);
          conversationTimeoutRef.current = setTimeout(() => {
            if (
              conversationModeRef.current &&
              !window.speechSynthesis.speaking
            ) {
              console.log(
                "⏰ Timeout inactivité conversation (15s) → retour Wake Word",
              );
              setConversationMode(false);
              stopListening();
            }
          }, 15000);
        }, 3500); // Aligné sur la période de sécurité anti-écho
      } else if (isExitingRef.current) {
        console.log("👋 Fin de session confirmée, micro reste coupé.");
        isExitingRef.current = false; // Reset pour la prochaine fois
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
      // Si le système pense qu'il parle, mais que le navigateur ne parle plus
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
    }, 500); // Vérification toutes les 500ms

    return () => clearInterval(interval);
  }, [status, setStatus, conversationModeRef, startListening]);

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
  // ou si l'option est désactivée dans les paramètres
  useEffect(() => {
    if (wakeWordEnabled && !isListening && status === SystemStatus.IDLE) {
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
    stopFullConversation, // NOUVEAU
  };
}
