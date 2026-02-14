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
import { useKernel } from "../contexts/KernelContext";

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
  const isSpeakingRef = useRef(false);
  const conversationModeRef = useRef(conversationMode);
  const onCommandRef = useRef(onCommandReceived);

  // Sync Refs
  useEffect(() => {
    conversationModeRef.current = conversationMode;
  }, [conversationMode]);
  useEffect(() => {
    onCommandRef.current = onCommandReceived;
  }, [onCommandReceived]);

  // ========================================
  // SYNTHÈSE VOCALE
  // ========================================
  const { speak: rawSpeak, stop: stopSpeech } = useVoiceSynthesis({
    enabled: true,
    voiceURI: voiceSettings.voiceURI,
    pitch: voiceSettings.pitch,
    rate: voiceSettings.rate,
    volume: voiceSettings.volume,
    onStart: async () => {
      isSpeakingRef.current = true;
      setStatus(SystemStatus.SPEAKING);
      // console.log("🛑 Jarvis parle - Arrêt micro");

      // Si on écoutait, on arrête proprement
      if (isListening) {
        await stopAndWait();
      }
    },
    onEnd: () => {
      console.log("🔊 Fin parole Jarvis");
      setStatus(SystemStatus.IDLE);

      // Redémarrage automatique si mode conversation
      setTimeout(() => {
        isSpeakingRef.current = false;

        if (conversationModeRef.current) {
          console.log("🎤 Mode conversation : Réactivation micro");
          lastMicActivationTime.current = Date.now();
          startListening();
        }
      }, 1000);
    },
  });

  // Synthèse vocale standard (Gemini TTS désactivé car instable)
  const speak = useCallback(
    (text: string) => {
      rawSpeak(text);
    },
    [rawSpeak],
  );

  // ========================================
  // RECONNAISSANCE VOCALE
  // ========================================
  const { isListening, toggleListening, startListening, stopAndWait } =
    useVoiceRecognition(
      (text) => {
        // 1. Filtrer si Jarvis parle
        if (isSpeakingRef.current || window.speechSynthesis.speaking) {
          return;
        }

        // 2. Période de sécurité (Echo cancellation)
        if (Date.now() - lastMicActivationTime.current < 1500) {
          return;
        }

        // 3. Gestion des Mots de fin de conversation
        const END_KEYWORDS = [
          "au revoir",
          "stop écoute",
          "merci c'est tout",
          "terminé",
          "arrête",
          "a bientôt",
          "à bientôt",
          "bye",
          "adieu",
          "c'est bon",
          "ça suffira",
          "repos",
          "pause",
          "ferme ta gueule",
          "stop",
        ];
        if (END_KEYWORDS.some((k) => text.toLowerCase().includes(k))) {
          setConversationMode(false);
          speak("À bientôt !");
          addLog("👋 Mode conversation désactivé", "SYSTEM", "info");
          return;
        }

        // 4. Activation Auto du mode conversation
        if (!conversationMode) {
          setConversationMode(true);
          addLog("🎤 Mode conversation activé", "SYSTEM", "info");
        }

        // 5. Interruption de la parole de Jarvis (Barge-in)
        if (window.speechSynthesis.speaking) {
          stopSpeech();
        }

        // 6. Transmission de la commande
        console.log(`✅ Commande validée : "${text}"`);
        onCommandRef.current(text);
      },
      // onStatusChange
      (listening) => {
        if (listening) {
          setStatus(SystemStatus.LISTENING);
        } else {
          // Ne repasser en IDLE que si on était en LISTENING
          // (Pour ne pas écraser PROCESSING ou SPEAKING)
          if (status === SystemStatus.LISTENING) {
            setStatus(SystemStatus.IDLE);
          }
        }
      },
    );

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

  return {
    isListening,
    handleMicrophoneClick,
    speak,
    conversationMode,
    setConversationMode,
  };
}
