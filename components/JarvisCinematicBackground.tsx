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

    let animationId: number;

    const draw = () => {
      // Fond sombre avec transparence extrême pour laisser voir pleinement l'image CSS
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /*
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 1.0,
      );
      // Ajustement pour être quasi-transparent mais garder un effet vignette léger
      gradient.addColorStop(0, "rgba(15, 28, 48, 0.1)"); // Très transparent
      gradient.addColorStop(0.6, "rgba(5, 10, 18, 0.2)"); // Très transparent
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.4)"); // Bords un peu moins transparents

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      */

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
