/**
 * HolographicHUD - Interface HUD circulaire style JARVIS (Iron Man)
 * 
 * Fonctionnalités :
 * - Cercles concentriques animés
 * - Segments radiaux rotatifs
 * - Visualisation audio réactive
 * - État système centralisé
 * - Effets holographiques avancés
 */

import React, { useEffect, useRef } from 'react';

interface HolographicHUDProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking';
  audioLevel?: number; // 0-100
  systemLoad?: number; // 0-100
}

export const HolographicHUD: React.FC<HolographicHUDProps> = ({
  status,
  audioLevel = 0,
  systemLoad = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration canvas
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Animation
    let animationId: number;
    let rotation = 0;

    const draw = () => {
      const centerX = canvas.offsetWidth / 2;
      const centerY = canvas.offsetHeight / 2;
      const baseRadius = Math.min(centerX, centerY) * 0.6;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Couleur selon statut
      let primaryColor = '#00f3ff'; // cyan par défaut
      let secondaryColor = 'rgba(0, 243, 255, 0.3)';
      
      if (status === 'listening') {
        primaryColor = '#ff006a'; // rose/rouge
        secondaryColor = 'rgba(255, 0, 106, 0.3)';
      } else if (status === 'processing') {
        primaryColor = '#ffd700'; // gold
        secondaryColor = 'rgba(255, 215, 0, 0.3)';
      } else if (status === 'speaking') {
        primaryColor = '#b000ff'; // purple
        secondaryColor = 'rgba(176, 0, 255, 0.3)';
      }

      // ========================================
      // CERCLES CONCENTRIQUES
      // ========================================
      for (let i = 1; i <= 4; i++) {
        const radius = baseRadius * (i / 4);
        const opacity = 1 - (i / 5);

        // Cercle externe
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 243, 255, ${opacity * 0.3})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = primaryColor;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // ========================================
      // SEGMENTS RADIAUX ROTATIFS
      // ========================================
      const segmentCount = 12;
      for (let i = 0; i < segmentCount; i++) {
        const angle = (rotation + (i * (360 / segmentCount))) * (Math.PI / 180);
        const startRadius = baseRadius * 0.7;
        const endRadius = baseRadius * 0.95;

        const startX = centerX + Math.cos(angle) * startRadius;
        const startY = centerY + Math.sin(angle) * startRadius;
        const endX = centerX + Math.cos(angle) * endRadius;
        const endY = centerY + Math.sin(angle) * endRadius;

        // Gradient du segment
        const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, secondaryColor);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // ========================================
      // VISUALISATION AUDIO (CERCLE RÉACTIF)
      // ========================================
      if (status === 'listening' || status === 'speaking') {
        const audioRadius = baseRadius * (1 + (audioLevel / 200));
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, audioRadius, 0, Math.PI * 2);
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = primaryColor;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Particules audio
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
          const particleAngle = (rotation * 2 + (i * (360 / particleCount))) * (Math.PI / 180);
          const particleX = centerX + Math.cos(particleAngle) * audioRadius;
          const particleY = centerY + Math.sin(particleAngle) * audioRadius;

          ctx.beginPath();
          ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
          ctx.fillStyle = primaryColor;
          ctx.shadowBlur = 10;
          ctx.shadowColor = primaryColor;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // ========================================
      // CENTRE - ICÔNE STATUT
      // ========================================
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 243, 255, 0.1)`;
      ctx.fill();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = primaryColor;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Point central
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fillStyle = primaryColor;
      ctx.shadowBlur = 10;
      ctx.shadowColor = primaryColor;
      ctx.fill();
      ctx.shadowBlur = 0;

      // ========================================
      // BARRE DE CHARGE SYSTÈME (ARC)
      // ========================================
      const loadAngle = (systemLoad / 100) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.5, -Math.PI / 2, -Math.PI / 2 + loadAngle);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffd700';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Incrément rotation
      rotation += status === 'processing' ? 2 : 0.5;

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [status, audioLevel, systemLoad]);

  // Classe de statut pour le container
  const getStatusClass = () => {
    switch (status) {
      case 'listening':
        return 'glow-purple';
      case 'processing':
        return 'glow-gold';
      case 'speaking':
        return 'animate-glow-pulse';
      default:
        return 'glow-cyan';
    }
  };

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${getStatusClass()}`}>
      {/* Canvas HUD */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Texte de statut */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="holo-text text-sm uppercase tracking-wider">
          {status === 'idle' && 'READY'}
          {status === 'listening' && 'LISTENING'}
          {status === 'processing' && 'PROCESSING'}
          {status === 'speaking' && 'SPEAKING'}
        </div>
      </div>

      {/* Indicateurs d'angle (style Iron Man) */}
      {[0, 90, 180, 270].map((angle) => (
        <div
          key={angle}
          className="absolute w-6 h-6"
          style={{
            transform: `rotate(${angle}deg) translateY(-45%) translateX(-50%)`,
            left: '50%',
            top: angle === 0 ? '10%' : angle === 180 ? '90%' : '50%',
          }}
        >
          <div className="w-full h-0.5 bg-cyan-400/50" />
          <div className="w-0.5 h-full bg-cyan-400/50 absolute left-1/2 top-0 -translate-x-1/2" />
        </div>
      ))}

      {/* Effet scanline par-dessus */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-scanlineMove" />
    </div>
  );
};
