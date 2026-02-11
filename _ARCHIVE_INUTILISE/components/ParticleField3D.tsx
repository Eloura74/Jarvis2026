/**
 * ParticleField3D - Système de particules 3D holographique
 * 
 * Fonctionnalités :
 * - Particules avec profondeur Z
 * - Interactivité souris (repousse/attire)
 * - Connexions entre particules proches
 * - Effet de parallaxe
 * - Couleurs dynamiques selon état
 */

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number; // Profondeur (0-1)
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  opacity: number;
}

interface ParticleField3DProps {
  count?: number;
  interactive?: boolean;
  status?: 'idle' | 'listening' | 'processing' | 'speaking';
}

export const ParticleField3D: React.FC<ParticleField3DProps> = ({
  count = 100,
  interactive = true,
  status = 'idle',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration canvas
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialisation des particules
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random(), // 0 = loin, 1 = proche
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          vz: (Math.random() - 0.5) * 0.02,
          size: Math.random() * 2 + 1,
          color: '#00f3ff',
          opacity: Math.random() * 0.5 + 0.3,
        });
      }
    };
    initParticles();

    // Gestion souris
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseleave', handleMouseLeave);
    }

    // Couleurs selon statut
    const getColor = (): string => {
      switch (status) {
        case 'listening':
          return '#ff006a';
        case 'processing':
          return '#ffd700';
        case 'speaking':
          return '#b000ff';
        default:
          return '#00f3ff';
      }
    };

    // Animation
    let animationId: number;

    const draw = () => {
      // Fond semi-transparent pour effet de traînée
      ctx.fillStyle = 'rgba(5, 5, 16, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const primaryColor = getColor();

      // Mise à jour et dessin des particules
      particles.forEach((particle, i) => {
        // ========================================
        // INTERACTION SOURIS
        // ========================================
        if (interactive && mouseRef.current.active) {
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 150;

          if (distance < maxDistance) {
            // Force de repousse (ou attraction si on veut)
            const force = (maxDistance - distance) / maxDistance;
            const angle = Math.atan2(dy, dx);
            
            // Repousse
            particle.vx -= Math.cos(angle) * force * 0.5;
            particle.vy -= Math.sin(angle) * force * 0.5;
          }
        }

        // ========================================
        // MOUVEMENT
        // ========================================
        particle.x += particle.vx * (particle.z + 0.5); // Plus rapide si proche
        particle.y += particle.vy * (particle.z + 0.5);
        particle.z += particle.vz;

        // Friction
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Wrap autour de l'écran
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.z < 0) particle.z = 1;
        if (particle.z > 1) particle.z = 0;

        // ========================================
        // RENDU AVEC PROFONDEUR
        // ========================================
        const scale = particle.z * 0.5 + 0.5; // 0.5 à 1.0
        const size = particle.size * scale;
        const opacity = particle.opacity * scale;

        // Particule
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fillStyle = primaryColor;
        ctx.globalAlpha = opacity;
        ctx.shadowBlur = 10 * scale;
        ctx.shadowColor = primaryColor;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // ========================================
        // CONNEXIONS ENTRE PARTICULES PROCHES
        // ========================================
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const dz = particle.z - otherParticle.z;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 120;

          if (distance < maxDistance && Math.abs(dz) < 0.3) {
            const lineOpacity = (1 - distance / maxDistance) * 0.3;
            
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = primaryColor;
            ctx.globalAlpha = lineOpacity * scale;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        });
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationId);
    };
  }, [count, interactive, status]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};
