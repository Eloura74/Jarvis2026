/**
 * Composant AudioVisualizer - Spectrum Analyzer Style JARVIS
 *
 * Affiche un visualiseur audio temps réel pendant la reconnaissance vocale.
 * Analyse les fréquences du micro via Web Audio API et les affiche
 * sous forme de barres animées avec dégradé cyan-magenta.
 *
 * Inspiration : Interface holographique de JARVIS (Iron Man)
 *
 * Performance : Canvas 60 FPS avec requestAnimationFrame
 *
 * @module AudioVisualizer
 */

import { useRef, useEffect } from "react";

interface AudioVisualizerProps {
  /** Active/désactive le visualiseur */
  isListening: boolean;
  /** Hauteur du canvas (px) */
  height?: number;
  /** Largeur du canvas (px) */
  width?: number;
}

/**
 * Composant de visualisation audio en temps réel
 *
 * Fonctionnalités :
 * - FFT 256 bins pour analyse fréquentielle
 * - Animation 60 FPS via requestAnimationFrame
 * - Dégradé cyan → magenta (palette JARVIS)
 * - Auto-cleanup stream audio
 * - Performance optimisée (Canvas natif)
 *
 * @param props - Configuration du visualiseur
 *
 * @example
 * ```tsx
 * <AudioVisualizer
 *   isListening={isListening}
 *   width={800}
 *   height={200}
 * />
 * ```
 */
export function AudioVisualizer({
  isListening,
  height = 200,
  width = 800,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isListening) {
      // Nettoyer si pas en écoute
      cleanup();
      return;
    }

    // Initialisation Web Audio API
    initializeAudio();

    return () => {
      cleanup();
    };
  }, [isListening]);

  /**
   * Initialise le pipeline audio pour analyse
   */
  const initializeAudio = async () => {
    try {
      // Obtenir accès microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Créer contexte audio
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Créer analyseur de fréquences
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256; // 128 bins de fréquences (256/2)
      analyzer.smoothingTimeConstant = 0.8; // Lissage pour fluidité
      analyzerRef.current = analyzer;

      // Connecter micro → analyseur
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyzer);

      // Démarrer animation
      draw();

      console.log("🎵 Audio Visualizer initialisé");
    } catch (error) {
      console.error("Erreur initialisation audio:", error);
    }
  };

  /**
   * Boucle de rendu Canvas (60 FPS)
   */
  const draw = () => {
    const canvas = canvasRef.current;
    const analyzer = analyzerRef.current;

    if (!canvas || !analyzer) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Récupérer données fréquences (0-255 par bin)
    const bufferLength = analyzer.frequencyBinCount; // 128 bins
    const dataArray = new Uint8Array(bufferLength);
    analyzer.getByteFrequencyData(dataArray);

    // Effacer frame précédente (avec trail pour effet fluide)
    ctx.fillStyle = "rgba(2, 2, 5, 0.2)"; // Fond semi-transparent
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculer dimensions barres
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;

    // Dessiner chaque barre de fréquence
    for (let i = 0; i < bufferLength; i++) {
      // Hauteur proportionnelle à amplitude (0-255)
      const barHeight = (dataArray[i] / 255) * canvas.height;

      // Dégradé cyan → magenta (style JARVIS)
      // Hue : 180° (cyan) → 240° (magenta)
      const hue = 180 + (i / bufferLength) * 60;
      const saturation = 100;
      const lightness = 40 + (dataArray[i] / 255) * 30; // Plus lumineux si amplitude haute

      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

      // Dessiner barre (depuis le bas)
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      // Glow effect (optionnel, gourmand en perf)
      if (barHeight > canvas.height * 0.6) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      } else {
        ctx.shadowBlur = 0;
      }

      x += barWidth + 1; // Espacement entre barres
    }

    // Continuer animation
    animationFrameRef.current = requestAnimationFrame(draw);
  };

  /**
   * Nettoie toutes les ressources audio
   */
  const cleanup = () => {
    // Arrêter animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Fermer stream micro
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Fermer contexte audio
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyzerRef.current = null;

    // Effacer canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  return (
    <div className="audio-visualizer-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="audio-visualizer-canvas"
        style={{
          display: isListening ? "block" : "none",
          borderRadius: "12px",
          border: "1px solid rgba(0, 217, 255, 0.3)",
          boxShadow: isListening ? "0 0 30px rgba(0, 217, 255, 0.4)" : "none",
          transition: "all 0.3s ease",
        }}
      />
      {isListening && (
        <div
          className="visualizer-label"
          style={{
            textAlign: "center",
            marginTop: "8px",
            fontSize: "12px",
            color: "#00d9ff",
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          🎤 Analyse audio temps réel
        </div>
      )}
    </div>
  );
}

export default AudioVisualizer;
