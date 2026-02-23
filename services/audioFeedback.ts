/**
 * audioFeedback.ts — Service de feedback sonore discret (V2)
 *
 * Émet un bip court via WebAudio API pour signaler à Monsieur
 * que le microphone est prêt à recevoir une commande.
 * Utilisé après la fin du TTS en mode conversation continue.
 *
 * Avantages vs TTS :
 * - Instantané (pas de latence TTS)
 * - Non capté par le micro (fréquence + durée contrôlées)
 * - Configurable (volume, fréquence, durée)
 */

// Contexte WebAudio partagé (singleton pour éviter les fuites)
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
  }
  return audioCtx;
};

/**
 * Émet un bip discret indiquant que le micro est prêt.
 *
 * @param frequency - Fréquence du bip en Hz (défaut: 880 = La5, ton neutre)
 * @param durationMs - Durée du bip en ms (défaut: 80ms, très court)
 * @param volume - Volume 0-1 (défaut: 0.15, très discret)
 */
export const playReadyBeep = (
  frequency = 880,
  durationMs = 80,
  volume = 0.15,
): void => {
  try {
    const ctx = getAudioContext();

    // Oscillateur sinusoïdal (son pur, non agressif)
    const oscillator = ctx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Gain avec fade-out rapide pour éviter le "clic" de fin
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + durationMs / 1000,
    );

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + durationMs / 1000);
  } catch (e) {
    // Silencieux si WebAudio non disponible (SSR, test, etc.)
    console.warn("audioFeedback: WebAudio non disponible", e);
  }
};
