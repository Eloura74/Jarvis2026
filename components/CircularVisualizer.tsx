/**
 * CircularVisualizer - Visualiseur circulaire style JARVIS
 * Affiche un cercle avec barres radiales animées
 */

import React, { useEffect, useRef } from 'react';

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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size * 2;
    canvas.height = size * 2;
    ctx.scale(2, 2);

    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size * 0.3;

    let animationId: number;
    let rotation = 0;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // Cercle extérieur
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.3, 0, Math.PI * 2);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (!isActive) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      // Barres radiales
      const barCount = 24;
      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2 + rotation;
        const barHeight = Math.abs(Math.sin((i + rotation * 10) * 0.5)) * baseRadius * 0.5;
        
        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0.8)');

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffd700';
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // Cercle central
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.stroke();

      rotation += 0.02;
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
      className="w-full h-full"
      style={{ width: size, height: size }}
    />
  );
};
