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
  const [currentSpeechText, setCurrentSpeechText] = useState<string>("");

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
    onStart: async () => {
      isSpeakingRef.current = true;
      setStatus(SystemStatus.SPEAKING);
      console.log("🛑 Jarvis parle - Arrêt micro");

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
        setCurrentSpeechText("");

        if (conversationModeRef.current) {
          console.log("🎤 Mode conversation : Réactivation micro");
          lastMicActivationTime.current = Date.now();
          startListening();
        }
      }, 1000);
    },
  });

  const speak = useCallback(
    (text: string) => {
      setCurrentSpeechText(text);
      rawSpeak(text);
    },
    [rawSpeak],
  );

  // ========================================
  // RECONNAISSANCE VOCALE
  // ========================================
  const {
    isListening,
    toggleListening,
    startListening,
    stopListening,
    stopAndWait,
  } = useVoiceRecognition(
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
    () => {},
  );

  // ========================================
  // WAKE WORD
  // ========================================
  useWakeWord(
    useCallback(() => {
      if (status === SystemStatus.IDLE) {
        // setStatus(SystemStatus.LISTENING); // Sera géré par le useEffect de isListening
        addLog("Wake word detected", "VOICE", "info");
        lastMicActivationTime.current = Date.now();
        startListening();
      }
    }, [status, addLog, startListening]),
  );

  // ========================================
  // GESTION MANUELLE MICRO
  // ========================================
  const handleMicrophoneClick = useCallback(() => {
    if (!isListening) {
      lastMicActivationTime.current = Date.now();
    }
    toggleListening();
  }, [isListening, toggleListening]);

  return {
    isListening,
    handleMicrophoneClick,
    speak,
    conversationMode,
    setConversationMode,
  };
}
