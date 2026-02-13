/**
 * CircularVisualizer - Visualiseur circulaire style JARVIS
 * Anneaux technologiques rotatifs avec segments et scan
 */

import React, { useEffect, useRef } from "react";

interface CircularVisualizerProps {
  isActive: boolean;
  size?: number;
}

export const CircularVisualizer: React.FC<CircularVisualizerProps> = ({
  isActive,
  size = 150,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = size * 2;
    canvas.height = size * 2;
    ctx.scale(2, 2);

    const centerX = size / 2;
    const centerY = size / 2;
    // Rayon légèrement plus grand que la sphère pour l'entourer
    const baseRadius = size * 0.38;

    let animationId: number;
    let time = 0;

    const drawRing = (
      r: number,
      width: number,
      color: string,
      rotation: number,
      segments: number,
      gap: number,
      opacity: number = 1,
    ) => {
      ctx.beginPath();
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;

      const segmentSize = (Math.PI * 2) / segments;
      const dashSize = segmentSize * (1 - gap);

      for (let i = 0; i < segments; i++) {
        const angle = i * segmentSize + rotation;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, angle, angle + dashSize);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      const cyan = "#00e5ff";
      const brightCyan = "#e0fbff"; // Cyan presque blanc pour l'activité

      time += 0.01;

      // Anneau 1 : Externe Fin (Rotation lente)
      drawRing(baseRadius * 1.4, 1, cyan, time * 0.2, 3, 0.2, 0.4);

      // Anneau 2 : Segments techniques (Rotation contre-sens)
      drawRing(baseRadius * 1.3, 2, cyan, -time * 0.5, 8, 0.4, 0.6);

      // Anneau 3 : Cercle quasi complet (Fixe + pulse opacity)
      ctx.beginPath();
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2 + Math.sin(time) * 0.1;
      ctx.arc(centerX, centerY, baseRadius * 1.25, 0, Math.PI * 2);
      ctx.stroke();

      // Anneau 4 : Activité (Si actif -> Cyan Brillant, pas jaune)
      if (isActive) {
        drawRing(baseRadius * 1.35, 3, brightCyan, time * 2, 12, 0.8, 0.8);
      }

      // Décors de coins (Reticles)
      const r = baseRadius * 1.6;
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent"; // Reset glow jaune précédent

      // 4 coins
      [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((angle) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, angle - 0.1, angle + 0.1);
        ctx.stroke();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive, size]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full pointer-events-none"
      style={{ width: size, height: size }}
    />
  );
};
