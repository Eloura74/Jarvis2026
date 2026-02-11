/**
 * JarvisSubtleBackground - Arrière-plan minimaliste et épuré
 * Fidèle aux références du film Iron Man.
 * 
 * Caractéristiques :
 * - Grille perspective subtile en bas de l'écran
 * - Très peu de particules lentes et espacées
 * - Pas de connexions, pas de lignes d'énergie
 * - Fond noir quasi-total
 */

import React, { useEffect, useRef } from 'react';

interface Debris {
  x: number;
  y: number;
  z: number; // Profondeur
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export const JarvisSubtleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particules (très peu)
    const debris: Debris[] = [];
    const debrisCount = 15; // Très peu de particules

    for (let i = 0; i < debrisCount; i++) {
      debris.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.8, // Apparaissent surtout en haut
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.1, // Très lent
        vy: (Math.random() - 0.5) * 0.1,
        size: Math.random() * 1 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }

    let gridOffset = 0;
    let animationId: number;

    const draw = () => {
      // Fond noir avec très léger fade
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ========================================
      // GRILLE PERSPECTIVE (Bas de l'écran uniquement)
      // ========================================
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 0.5;
      
      const gridSize = 60;
      const horizonY = canvas.height * 0.65; // Ligne d'horizon plus haute
      const perspectiveStrength = 0.4;

      // Lignes horizontales
      for (let i = 0; i < 15; i++) {
        const y = horizonY + Math.pow(i / 15, 2) * (canvas.height - horizonY);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Lignes verticales
      const lineCount = 30;
      for (let i = 0; i <= lineCount; i++) {
        const ratio = i / lineCount;
        const x = ratio * canvas.width;
        const perspectiveX = canvas.width / 2 + (x - canvas.width / 2) * (1 + perspectiveStrength);
        
        ctx.beginPath();
        ctx.moveTo(x, horizonY);
        ctx.lineTo(perspectiveX, canvas.height);
        ctx.stroke();
      }

      ctx.restore();

      // ========================================
      // PARTICULES SUBTILES
      // ========================================
      debris.forEach(particle => {
        // Mouvement
        particle.x += particle.vx * (particle.z + 0.2);
        particle.y += particle.vy * (particle.z + 0.2);

        // Wrap
        if (particle.x < -10) particle.x = canvas.width + 10;
        if (particle.x > canvas.width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = canvas.height + 10;
        if (particle.y > canvas.height + 10) particle.y = -10;

        // Rendu
        const scale = particle.z * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#00e5ff';
        ctx.globalAlpha = particle.opacity * scale;
        ctx.fill();
      });

      ctx.globalAlpha = 1;

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
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
