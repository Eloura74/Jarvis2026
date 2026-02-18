/**
 * JarvisHUDAuthentic - Interface HUD fidèle au JARVIS d'Iron Man
 *
 * Caractéristiques authentiques :
 * - Cercles concentriques ultra-fins avec segments d'arc
 * - Lignes de 0.5-1px d'épaisseur
 * - Fond transparent total
 * - Détails techniques subtils (chiffres, marqueurs)
 * - Rotation fluide et lente
 * - Points lumineux précis
 * - Espace vide important (minimaliste)
 */

import React, { useEffect, useRef } from "react";

interface JarvisHUDAuthenticProps {
  status: "idle" | "listening" | "processing" | "speaking";
  size?: number; // Taille en pixels
  showDetails?: boolean; // Afficher les détails techniques
}

export const JarvisHUDAuthentic: React.FC<JarvisHUDAuthenticProps> = ({
  status,
  size = 400,
  showDetails = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Couleur selon statut (Déplacé pour accès dans JSX)
  let color = "#00e5ff"; // cyan par défaut
  let glowIntensity = 8;

  if (status === "listening") {
    color = "#00e5ff";
    glowIntensity = 12;
  } else if (status === "processing") {
    color = "#ffd700";
    glowIntensity = 10;
  } else if (status === "speaking") {
    color = "#00e5ff";
    glowIntensity = 15;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configuration
    canvas.width = size * 2; // Haute résolution
    canvas.height = size * 2;
    ctx.scale(2, 2);

    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size * 0.35;

    let animationId: number;

    const draw = () => {
      // Clear avec fond noir transparent
      ctx.clearRect(0, 0, size, size);

      // Parallax Effect Calculation
      const parallaxX = (mouseRef.current.x - window.innerWidth / 2) * 0.02;
      const parallaxY = (mouseRef.current.y - window.innerHeight / 2) * 0.02;

      ctx.save();
      // Apply parallax translation
      ctx.translate(parallaxX, parallaxY);

      // Incrément rotation (très lent et fluide)
      rotationRef.current += 0.513; // Rotation très lente

      animationId = requestAnimationFrame(draw);
    };

    // Mouse Tracking Logic
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [status, size, showDetails]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Canvas HUD */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width: size, height: size }}
      />

      {/* Texte de statut (en dessous) */}
      {showDetails && (
        <div className="absolute bottom-14 w-full flex justify-center pb-8 pointer-events-none">
          <div
            className="jarvis-text text-center tracking-[0.2em] font-bold"
            style={{ textShadow: `0 0 10px ${color}` }}
          >
            {status === "idle" && "STANDBY"}
            {status === "listening" && "RECEIVING"}
            {status === "processing" && "ANALYZING"}
            {status === "speaking" && "TRANSMITTING"}
          </div>
        </div>
      )}

      {/* Données techniques (coins) */}
      {showDetails && (
        <>
          {/* Coin supérieur gauche */}
          <div className="absolute top-0 left-0 jarvis-data">SYS.01</div>

          {/* Coin supérieur droit */}
          <div className="absolute top-0 right-0 jarvis-data">
            {new Date().toLocaleTimeString("en-US", { hour12: false })}
          </div>

          {/* Coin inférieur gauche */}
          <div className="absolute bottom-0 left-0 jarvis-data">v3.0</div>

          {/* Coin inférieur droit */}
          <div className="absolute bottom-0 right-0 jarvis-data">ONLINE</div>
        </>
      )}
    </div>
  );
};
