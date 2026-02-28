import React from "react";
import { JarvisCinematicBackground } from "../JarvisCinematicBackground";
import { useAppSettings } from "../../hooks/useAppSettings";

export const BackgroundLayers: React.FC = () => {
  const { settings } = useAppSettings();

  // Déterminer la couleur de teinte du fond selon le thème
  const getThemeBgTint = (theme: string) => {
    switch (theme) {
      case "ironman":
        return "rgba(250, 204, 21, 0.15)"; // Jaune
      case "matrix":
        return "rgba(34, 197, 94, 0.15)"; // Vert
      case "copper":
        return "rgba(217, 119, 6, 0.25)"; // Ambre foncé/Cuivre
      case "classic":
      default:
        return "rgba(0, 243, 255, 0.1)"; // Cyan par défaut
    }
  };

  const bgTint = getThemeBgTint(settings.theme);

  const getThemeBgImage = (theme: string) => {
    if (theme === "copper") return "/bg-wires3Cuivre.png";
    return "/bg-wires3.png";
  };
  const bgImage = getThemeBgImage(settings.theme);

  return (
    <div className="absolute inset-0 z-0">
      <img
        src={bgImage}
        alt="Background"
        className="fixed inset-0 w-full h-full object-cover opacity-50 z-0"
      />
      {/* Calque de teinte dynamique selon le thème */}
      <div
        className="fixed inset-0 w-full h-full z-0 mix-blend-color pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: bgTint }}
      />

      <JarvisCinematicBackground />
      {/* 
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80" />
        <div className="jarvis-scanlines opacity-20" />
        <div className="jarvis-vignette opacity-50" />
        */}
    </div>
  );
};
