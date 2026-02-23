import { useState } from "react";
import { AnimatePresence } from "framer-motion";

import { KernelProvider } from "../contexts/KernelContext";
import { MemoryProvider } from "../contexts/MemoryContext";

import { StartOverlay } from "../components/StartOverlay";
import { IntroSequence } from "../components/IntroSequence";
import JarvisShell from "./JarvisShell";
import { ErrorBoundary } from "../components/ErrorBoundary";

export default function AppRoot() {
  const [showStart, setShowStart] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  const unlockAudio = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (synth.paused) synth.resume();

    const utterance = new SpeechSynthesisUtterance("");
    utterance.volume = 0;
    utterance.rate = 1;
    synth.speak(utterance);

    console.log("🔓 Audio Context débloqué via interaction utilisateur");
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
