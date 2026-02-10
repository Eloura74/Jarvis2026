/**
 * AudioWave - Visualiseur d'onde audio pour le recording
 * S'affiche quand l'utilisateur parle
 */

import React, { useEffect, useRef } from 'react';

interface AudioWaveProps {
  isActive: boolean;
  color?: string;
}

export const AudioWave: React.FC<AudioWaveProps> = ({
  isActive,
  color = '#ffd700',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();

    let animationId: number;
    let phase = 0;

    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const centerY = height / 2;

      // Clear
      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        // Ligne plate si inactif
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
        animationId = requestAnimationFrame(draw);
        return;
      }

      // ========================================
      // ONDE AUDIO ANIMÉE
      // ========================================
      const amplitude = height * 0.35;
      const frequency = 0.03;
      const barCount = 50;
      const barWidth = width / barCount;

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;

      // Onde principale
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * frequency + phase) * amplitude * (Math.sin(x * 0.01) * 0.5 + 0.5);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Barres de fréquence
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < barCount; i++) {
        const x = i * barWidth;
        const barHeight = Math.abs(Math.sin((i + phase) * 0.2)) * amplitude * Math.random();
        
        ctx.fillStyle = color;
        ctx.fillRect(x, centerY - barHeight / 2, barWidth - 2, barHeight);
      }

      ctx.globalAlpha = 1;

      phase += 0.1;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive, color]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
