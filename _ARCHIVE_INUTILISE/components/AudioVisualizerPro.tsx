/**
 * AudioVisualizerPro - Visualiseur audio holographique professionnel
 * 
 * Fonctionnalités :
 * - Barres de fréquence animées
 * - Forme d'onde circulaire
 * - Réactivité en temps réel
 * - Effets holographiques
 * - Plusieurs modes d'affichage
 */

import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProProps {
  audioLevel?: number; // 0-100
  isActive?: boolean;
  mode?: 'bars' | 'circle' | 'wave';
  color?: 'cyan' | 'purple' | 'gold';
}

export const AudioVisualizerPro: React.FC<AudioVisualizerProProps> = ({
  audioLevel = 0,
  isActive = false,
  mode = 'bars',
  color = 'cyan',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Nombre de barres/segments
    const barCount = mode === 'bars' ? 64 : 32;

    // Initialiser les barres
    if (barsRef.current.length === 0) {
      barsRef.current = Array(barCount).fill(0);
    }

    // Couleurs
    const colors = {
      cyan: {
        primary: '#00f3ff',
        secondary: 'rgba(0, 243, 255, 0.5)',
        glow: 'rgba(0, 243, 255, 0.8)',
      },
      purple: {
        primary: '#b000ff',
        secondary: 'rgba(176, 0, 255, 0.5)',
        glow: 'rgba(176, 0, 255, 0.8)',
      },
      gold: {
        primary: '#ffd700',
        secondary: 'rgba(255, 215, 0, 0.5)',
        glow: 'rgba(255, 215, 0, 0.8)',
      },
    };

    const currentColor = colors[color];

    let animationId: number;

    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Si inactif, diminuer progressivement
      const targetLevel = isActive ? audioLevel / 100 : 0;

      // Simuler des variations aléatoires si actif
      const randomVariation = isActive ? Math.random() * 0.3 : 0;

      // ========================================
      // MODE BARRES (Égaliseur)
      // ========================================
      if (mode === 'bars') {
        const barWidth = width / barCount;
        const maxBarHeight = height * 0.8;

        barsRef.current.forEach((bar, i) => {
          // Calculer la hauteur cible avec variation
          const variation = Math.sin(Date.now() * 0.01 + i * 0.5) * randomVariation;
          const targetHeight = (targetLevel + variation) * maxBarHeight;

          // Interpolation smooth
          barsRef.current[i] += (targetHeight - bar) * 0.15;

          const x = i * barWidth;
          const barHeight = barsRef.current[i];
          const y = height - barHeight;

          // Gradient de la barre
          const gradient = ctx.createLinearGradient(x, height, x, y);
          gradient.addColorStop(0, currentColor.secondary);
          gradient.addColorStop(0.5, currentColor.primary);
          gradient.addColorStop(1, currentColor.glow);

          // Dessiner la barre
          ctx.fillStyle = gradient;
          ctx.fillRect(x + 1, y, barWidth - 2, barHeight);

          // Glow en haut
          if (isActive) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = currentColor.glow;
            ctx.fillRect(x + 1, y, barWidth - 2, 3);
            ctx.shadowBlur = 0;
          }
        });
      }

      // ========================================
      // MODE CERCLE (Radial)
      // ========================================
      else if (mode === 'circle') {
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.3;
        const angleStep = (Math.PI * 2) / barCount;

        barsRef.current.forEach((bar, i) => {
          const variation = Math.sin(Date.now() * 0.01 + i * 0.3) * randomVariation;
          const targetHeight = (targetLevel + variation) * baseRadius * 0.6;

          barsRef.current[i] += (targetHeight - bar) * 0.15;

          const angle = i * angleStep - Math.PI / 2;
          const startX = centerX + Math.cos(angle) * baseRadius;
          const startY = centerY + Math.sin(angle) * baseRadius;
          const endX = centerX + Math.cos(angle) * (baseRadius + barsRef.current[i]);
          const endY = centerY + Math.sin(angle) * (baseRadius + barsRef.current[i]);

          // Gradient radial
          const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
          gradient.addColorStop(0, currentColor.secondary);
          gradient.addColorStop(1, currentColor.primary);

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';

          if (isActive) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = currentColor.glow;
          }

          ctx.stroke();
          ctx.shadowBlur = 0;

          // Point lumineux à l'extrémité
          if (isActive) {
            ctx.beginPath();
            ctx.arc(endX, endY, 2, 0, Math.PI * 2);
            ctx.fillStyle = currentColor.primary;
            ctx.shadowBlur = 8;
            ctx.shadowColor = currentColor.glow;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });

        // Cercle central
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fill();
        ctx.strokeStyle = currentColor.primary;
        ctx.lineWidth = 2;

        if (isActive) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = currentColor.glow;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // ========================================
      // MODE ONDE (Waveform)
      // ========================================
      else if (mode === 'wave') {
        const centerY = height / 2;
        const amplitude = height * 0.3;
        const frequency = 0.05;
        const offset = Date.now() * 0.005;

        ctx.beginPath();
        ctx.moveTo(0, centerY);

        for (let x = 0; x < width; x++) {
          // Créer une onde sinusoïdale avec variations
          const baseWave = Math.sin(x * frequency + offset) * amplitude;
          const noiseWave = Math.sin(x * frequency * 3 + offset * 2) * amplitude * 0.2;
          const y = centerY + (baseWave + noiseWave) * targetLevel;

          ctx.lineTo(x, y);
        }

        // Gradient de l'onde
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, currentColor.secondary);
        gradient.addColorStop(0.5, currentColor.primary);
        gradient.addColorStop(1, currentColor.secondary);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;

        if (isActive) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = currentColor.glow;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;

        // Ligne centrale
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = currentColor.secondary;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [audioLevel, isActive, mode, color]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
