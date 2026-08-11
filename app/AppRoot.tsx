import { useState } from "react";
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

  const unlockAudio = () => {
    const synth = window.speechSynthesis;
    // si pas de synth, on retourne
    if (!synth) return;
    // si synth en pause, on le resume
    if (synth.paused) synth.resume();
    // on crée une utterance vide pour débloquer le contexte audio
    const utterance = new SpeechSynthesisUtterance("");
    utterance.volume = 0;
    utterance.rate = 1;
    synth.speak(utterance);

    //console.log("🔓 Audio Context débloqué via interaction utilisateur");
  };

  const handleStart = () => {
    unlockAudio();
    setShowStart(false);
    setShowIntro(true);
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    setIntroFinished(true);
  };

  return (
    <KernelProvider>
      <MemoryProvider>
        <AnimatePresence>
          {showStart && (
            <StartOverlay onStart={handleStart} key="start-overlay" />
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
