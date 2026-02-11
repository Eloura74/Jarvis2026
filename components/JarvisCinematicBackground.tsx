/**
 * JarvisCinematicBackground - Arrière-plan cinématique style film
 *
 * Fonctionnalités :
 * - Bokeh doré/ambré (particules lumineuses floues)
 * - Grille perspective dorée/cyan en bas
 * - Particules lumineuses flottantes
 * - Effets de profondeur et lumière
 */

import React, { useEffect, useRef } from "react";

export const JarvisCinematicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Plus de particules bokeh

    let gridOffset = 0;
    let animationId: number;

    const draw = () => {
      // Fond noir avec gradient subtil
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.8,
      );
      gradient.addColorStop(0, "#0a1628");
      gradient.addColorStop(1, "#000000");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Incrément grille
      gridOffset += 0.3;

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};
