import React, { useMemo } from "react";
import "../styles/voice-wave.css";

interface VoiceWaveProps {
  /** Nombre de barres à afficher */
  barCount?: number;
  /** Couleur de l'onde (format CSS valide ex: '#00f3ff') */
  color?: string;
  /** Hauteur maximale des barres en px (défaut 45) */
  maxHeight?: number;
  /** Si true, l'animation est active, sinon les barres sont au repos */
  isActive?: boolean;
}

/**
 * Composant VoiceWave
 * Affiche une animation d'onde vocale style "Equalizer" avec effet néon.
 * Utilise des variables CSS pour l'aléatoire des animations.
 */
export const VoiceWave: React.FC<VoiceWaveProps> = ({
  barCount = 5,
  color = "#00f3ff",
  maxHeight = 45,
  isActive = true,
}) => {
  // Générer des valeurs aléatoires stables pour chaque barre
  const bars = useMemo(
    () =>
      Array.from({ length: barCount }).map((_, i) => {
        // Pseudo-random deterministic based on index to satisfy pure render requirements
        const seed = i * 1337 + barCount;
        return {
          duration: 0.8 + Math.abs(Math.sin(seed)) * 0.8, // 0.8s - 1.6s
          delay: Math.abs(Math.cos(seed)) * -1,
          maxH: 20 + Math.abs(Math.sin(seed * 2)) * (maxHeight - 20), // 20 - maxHeight
        };
      }),
    [barCount, maxHeight],
  );

  return (
    <div
      className="voice-wave"
      style={
        {
          "--wave-color": color,
        } as React.CSSProperties
      }
    >
      {bars.map((bar, index) => (
        <div
          key={index}
          className="voice-bar"
          style={
            {
              // Si pas actif, on force une hauteur fixe et pas d'animation
              height: isActive ? undefined : "4px",
              animationName: isActive ? "equalizer" : "none",
              "--duration": `${bar.duration}s`,
              "--delay": `${bar.delay}s`,
              "--max-h": `${bar.maxH}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};
