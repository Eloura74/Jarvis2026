/**
 * JarvisBackground - Arrière-plan animé style JARVIS
 * 
 * Fonctionnalités :
 * - Grille perspective 3D
 * - Particules connectées subtiles
 * - Lignes d'énergie animées
 * - Profondeur et mouvement
 */

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export const JarvisBackground: React.FC = () => {
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

    // Particules
    const particles: Particle[] = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
      });
    }

    // Variables d'animation
    let gridOffset = 0;
    let animationId: number;

    const draw = () => {
      // Clear avec fade pour effet de traînée
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ========================================
      // GRILLE PERSPECTIVE (Fond)
      // ========================================
      ctx.save();
      ctx.globalAlpha = 0.15;
      
      const gridSize = 50;
      const vanishingY = canvas.height * 0.7;
      
      // Lignes horizontales (perspective)
      for (let i = 0; i < 20; i++) {
        const y = vanishingY + (i * gridSize) - (gridOffset % gridSize);
        const scale = 1 - (i / 30);
        const startX = canvas.width * 0.5 - (canvas.width * scale);
        const endX = canvas.width * 0.5 + (canvas.width * scale);
        
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      
      // Lignes verticales (perspective)
      for (let i = -10; i <= 10; i++) {
        const startX = canvas.width * 0.5 + (i * gridSize);
        const endY = canvas.height;
        
        ctx.beginPath();
        ctx.moveTo(startX, vanishingY);
        ctx.lineTo(startX + (i * gridSize * 0.3), endY);
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      
      ctx.restore();

      // ========================================
      // PARTICULES ET CONNEXIONS
      // ========================================
      particles.forEach((particle, i) => {
        // Mouvement
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Dessiner particule
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = '#00e5ff';
        ctx.globalAlpha = 0.4;
        ctx.fill();

        // Connexions avec particules proches
        particles.slice(i + 1).forEach((other) => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 150;

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.2;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = '#00e5ff';
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      ctx.globalAlpha = 1;

      // ========================================
      // LIGNES D'ÉNERGIE (Horizontales animées)
      // ========================================
      const energyLines = 5;
      for (let i = 0; i < energyLines; i++) {
        const y = (canvas.height / energyLines) * i + ((Date.now() * 0.03 + i * 100) % canvas.height);
        const gradient = ctx.createLinearGradient(0, y, canvas.width, y);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, 'rgba(0, 229, 255, 0.1)');
        gradient.addColorStop(1, 'transparent');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // ========================================
      // CERCLES CONCENTRIQUES (Coins)
      // ========================================
      const drawCornerCircles = (x: number, y: number) => {
        for (let i = 1; i <= 3; i++) {
          const radius = i * 40 + Math.sin(Date.now() * 0.001 + i) * 5;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = '#00e5ff';
          ctx.globalAlpha = 0.1;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      };

      // Cercles dans les coins
      drawCornerCircles(50, 50);
      drawCornerCircles(canvas.width - 50, 50);
      drawCornerCircles(50, canvas.height - 50);
      drawCornerCircles(canvas.width - 50, canvas.height - 50);

      ctx.globalAlpha = 1;

      // Incrémenter offset grille
      gridOffset += 0.5;

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
