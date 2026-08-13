import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";

import { KernelProvider } from "../contexts/KernelContext";
import { MemoryProvider } from "../contexts/MemoryContext";

import { StartOverlay } from "../components/StartOverlay";
import { IntroSequence } from "../components/IntroSequence";
import JarvisShell from "./JarvisShell";
import { ErrorBoundary } from "../components/ErrorBoundary";

//  déclaration du composant principal
export default function AppRoot() {
  const [showStart, setShowStart] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  const unlockAudio = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (synth.paused) synth.resume();
    const utterance = new SpeechSynthesisUtterance("");
    utterance.volume = 0;
    utterance.rate = 1;
    synth.speak(utterance);
  }, []);

  const handleStart = useCallback(
    (skipIntro = true) => {
      unlockAudio();
      setShowStart(false);
      if (skipIntro) {
        setShowIntro(false);
        setIntroFinished(false);
      } else {
        setShowIntro(true);
      }
    },
    [unlockAudio],
  );

  const handleIntroComplete = () => {
    setShowIntro(false);
    setIntroFinished(true);
  };

  // 🚀 DÉMARRAGE ET INITIALISATION AUTOMATIQUE SANS INTRO DÈS DÉTECTION DE PRÉSENCE / ACTIVITÉ
  useEffect(() => {
    if (!showStart) return;

    const autoStartOnPresence = () => {
      handleStart(true); // Démarrage immédiat sans l'intro
    };

    window.addEventListener("mousemove", autoStartOnPresence, { once: true });
    window.addEventListener("keydown", autoStartOnPresence, { once: true });
    window.addEventListener("click", autoStartOnPresence, { once: true });
    window.addEventListener("presence-detected", autoStartOnPresence, { once: true });

    return () => {
      window.removeEventListener("mousemove", autoStartOnPresence);
      window.removeEventListener("keydown", autoStartOnPresence);
      window.removeEventListener("click", autoStartOnPresence);
      window.removeEventListener("presence-detected", autoStartOnPresence);
    };
  }, [showStart, handleStart]);

  return (
    <KernelProvider>
      <MemoryProvider>
        <AnimatePresence>
          {showStart && (
            <StartOverlay onStart={() => handleStart(true)} key="start-overlay" />
          )}

          {showIntro && (
            <IntroSequence
              onComplete={handleIntroComplete}
              key="intro-sequence"
            />
          )}
        </AnimatePresence>

        <ErrorBoundary>
          <JarvisShell shouldGreet={introFinished} />
        </ErrorBoundary>
      </MemoryProvider>
    </KernelProvider>
  );
}
