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
  // On utilise useMemo pour ne pas régénérer à chaque render sauf si barCount change
  const bars = useMemo(() => {
    return Array.from({ length: barCount }).map((_, i) => ({
      duration: 0.8 + Math.random() * 0.8, // Entre 0.8s et 1.6s
      delay: Math.random() * -1, // Délai négatif pour commencer désynchronisé
      maxH: 20 + Math.random() * (maxHeight - 20), // Hauteur entre 20 et maxHeight
    }));
  }, [barCount, maxHeight]);

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
