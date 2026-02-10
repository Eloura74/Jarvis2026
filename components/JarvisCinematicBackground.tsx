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
        canvas.width * 0.8
      );
      gradient.addColorStop(0, "#0a1628");
      gradient.addColorStop(1, "#000000");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ========================================
      // PATTERN HEXAGONAL (Nid d'abeille) - GAUCHE
      // ========================================
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 1.5;

      const hexSize = 18;
      const hexHeight = hexSize * Math.sqrt(2.5);
      const hexWidth = hexSize * 2.2;
      const offsetX = 70; // Position visible à gauche
      const offsetY = canvas.height * 0.48; // Centré verticalement

      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 5; col++) {
          const x = offsetX + col * hexWidth * 0.75;
          const y = offsetY + row * hexHeight + ((col % 2) * hexHeight) / 2;

          // Dessiner hexagone
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const hx = x + hexSize * Math.cos(angle);
            const hy = y + hexSize * Math.sin(angle);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();

          // Effet glow léger
          ctx.shadowBlur = 5;
          ctx.shadowColor = "#00e5ff";
          ctx.stroke();
        }
      }

      ctx.shadowBlur = 0;
      ctx.restore();

      // ========================================
      // GRILLE PERSPECTIVE (Dorée/Cyan)
      // ========================================
      ctx.save();

      const horizonY = canvas.height * 0.68;
      const gridSize = 50;

      // Lignes horizontales (dégradé cyan -> doré)
      for (let i = 0; i < 20; i++) {
        const y =
          horizonY +
          Math.pow(i / 20, 1.5) * (canvas.height - horizonY) +
          (gridOffset % gridSize);
        const ratio = i / 20;

        // Dégradé de couleur
        const gradient = ctx.createLinearGradient(0, y, canvas.width, y);
        gradient.addColorStop(0, `rgba(0, 229, 255, ${0.4 - ratio * 0.3})`); // Cyan
        gradient.addColorStop(0.5, `rgba(255, 215, 0, ${0.5 - ratio * 0.3})`); // Doré
        gradient.addColorStop(1, `rgba(0, 229, 255, ${0.4 - ratio * 0.3})`); // Cyan

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ffd700";
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // Lignes verticales
      const lineCount = 25;
      for (let i = 0; i <= lineCount; i++) {
        const ratio = i / lineCount;
        const x = ratio * canvas.width;
        const perspectiveX = canvas.width / 2 + (x - canvas.width / 2) * 1.3;

        ctx.strokeStyle =
          ratio < 0.3 || ratio > 0.7
            ? "rgba(0, 229, 255, 0.3)" // Cyan sur les côtés
            : "rgba(255, 215, 0, 0.3)"; // Doré au centre
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, horizonY);
        ctx.lineTo(perspectiveX, canvas.height);
        ctx.stroke();
      }

      ctx.restore();

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
