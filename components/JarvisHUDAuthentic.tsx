/**
 * JarvisHUDAuthentic - Interface HUD fidèle au JARVIS d'Iron Man
 * 
 * Caractéristiques authentiques :
 * - Cercles concentriques ultra-fins avec segments d'arc
 * - Lignes de 0.5-1px d'épaisseur
 * - Fond transparent total
 * - Détails techniques subtils (chiffres, marqueurs)
 * - Rotation fluide et lente
 * - Points lumineux précis
 * - Espace vide important (minimaliste)
 */

import React, { useEffect, useRef } from 'react';

interface JarvisHUDAuthenticProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking';
  size?: number; // Taille en pixels
  showDetails?: boolean; // Afficher les détails techniques
}

export const JarvisHUDAuthentic: React.FC<JarvisHUDAuthenticProps> = ({
  status,
  size = 400,
  showDetails = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    canvas.width = size * 2; // Haute résolution
    canvas.height = size * 2;
    ctx.scale(2, 2);

    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size * 0.35;

    // Couleur selon statut
    let color = '#00e5ff'; // cyan par défaut
    let glowIntensity = 8;

    if (status === 'listening') {
      color = '#00e5ff';
      glowIntensity = 12;
    } else if (status === 'processing') {
      color = '#ffd700';
      glowIntensity = 10;
    } else if (status === 'speaking') {
      color = '#00e5ff';
      glowIntensity = 15;
    }

    let animationId: number;

    const draw = () => {
      // Clear avec fond noir transparent
      ctx.clearRect(0, 0, size, size);

      // ========================================
      // CERCLES CONCENTRIQUES (Signature JARVIS)
      // ========================================
      const circles = [
        { radius: baseRadius * 0.3, opacity: 0.2, lineWidth: 0.5 },
        { radius: baseRadius * 0.5, opacity: 0.3, lineWidth: 0.5 },
        { radius: baseRadius * 0.7, opacity: 0.4, lineWidth: 0.75 },
        { radius: baseRadius * 0.9, opacity: 0.5, lineWidth: 0.75 },
        { radius: baseRadius * 1.1, opacity: 0.6, lineWidth: 1 },
      ];

      circles.forEach((circle) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, circle.radius, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.globalAlpha = circle.opacity;
        ctx.lineWidth = circle.lineWidth;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // ========================================
      // SEGMENTS D'ARC ROTATIFS (Style film)
      // ========================================
      const arcSegments = [
        // Premier anneau de segments
        { radius: baseRadius * 0.9, start: 0, end: Math.PI / 3, rotation: rotationRef.current },
        { radius: baseRadius * 0.9, start: Math.PI * 0.6, end: Math.PI * 0.9, rotation: rotationRef.current },
        { radius: baseRadius * 0.9, start: Math.PI * 1.2, end: Math.PI * 1.5, rotation: rotationRef.current },
        
        // Deuxième anneau (rotation inverse)
        { radius: baseRadius * 0.7, start: Math.PI * 0.2, end: Math.PI * 0.5, rotation: -rotationRef.current * 1.5 },
        { radius: baseRadius * 0.7, start: Math.PI, end: Math.PI * 1.3, rotation: -rotationRef.current * 1.5 },
        { radius: baseRadius * 0.7, start: Math.PI * 1.6, end: Math.PI * 1.9, rotation: -rotationRef.current * 1.5 },
        
        // Troisième anneau (lent)
        { radius: baseRadius * 1.1, start: Math.PI * 0.1, end: Math.PI * 0.3, rotation: rotationRef.current * 0.5 },
        { radius: baseRadius * 1.1, start: Math.PI * 0.7, end: Math.PI * 0.9, rotation: rotationRef.current * 0.5 },
        { radius: baseRadius * 1.1, start: Math.PI * 1.3, end: Math.PI * 1.5, rotation: rotationRef.current * 0.5 },
      ];

      arcSegments.forEach((segment) => {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(segment.rotation);
        ctx.translate(-centerX, -centerY);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, segment.radius, segment.start, segment.end);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.8;
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        
        ctx.restore();
      });

      // ========================================
      // MARQUEURS SUR CERCLES (Petits traits)
      // ========================================
      const markerCount = 36; // 36 marqueurs = tous les 10°
      const markerRadius = baseRadius * 1.1;
      
      for (let i = 0; i < markerCount; i++) {
        const angle = (i / markerCount) * Math.PI * 2;
        const isMainMarker = i % 4 === 0; // Marqueur principal tous les 40°
        const markerLength = isMainMarker ? 8 : 4;
        const markerWidth = isMainMarker ? 1 : 0.5;
        
        const x1 = centerX + Math.cos(angle) * markerRadius;
        const y1 = centerY + Math.sin(angle) * markerRadius;
        const x2 = centerX + Math.cos(angle) * (markerRadius + markerLength);
        const y2 = centerY + Math.sin(angle) * (markerRadius + markerLength);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = markerWidth;
        ctx.globalAlpha = isMainMarker ? 0.6 : 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // ========================================
      // POINTS LUMINEUX (Aux angles principaux)
      // ========================================
      const dotAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
      dotAngles.forEach((angle) => {
        const dotX = centerX + Math.cos(angle) * (baseRadius * 1.1);
        const dotY = centerY + Math.sin(angle) * (baseRadius * 1.1);
        
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // ========================================
      // CENTRE - Point focal
      // ========================================
      // Cercle central
      ctx.beginPath();
      ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Point central lumineux
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowBlur = glowIntensity * 1.5;
      ctx.shadowColor = color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // ========================================
      // CROIX DE CIBLAGE (Centre)
      // ========================================
      const crossSize = 10;
      // Ligne horizontale
      ctx.beginPath();
      ctx.moveTo(centerX - crossSize, centerY);
      ctx.lineTo(centerX + crossSize, centerY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      
      // Ligne verticale
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - crossSize);
      ctx.lineTo(centerX, centerY + crossSize);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // ========================================
      // LIGNES DE CONNEXION (Subtiles)
      // ========================================
      if (showDetails && status !== 'idle') {
        // Lignes depuis le centre vers les points cardinaux
        const lineAngles = [Math.PI / 4, Math.PI * 3 / 4, Math.PI * 5 / 4, Math.PI * 7 / 4];
        lineAngles.forEach((angle, index) => {
          const startRadius = baseRadius * 0.3;
          const endRadius = baseRadius * 0.5;
          
          const x1 = centerX + Math.cos(angle) * startRadius;
          const y1 = centerY + Math.sin(angle) * startRadius;
          const x2 = centerX + Math.cos(angle) * endRadius;
          const y2 = centerY + Math.sin(angle) * endRadius;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = 0.2 + (Math.sin(rotationRef.current + index) * 0.2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        });
      }

      // Incrément rotation (très lent et fluide)
      rotationRef.current += 0.003; // Rotation très lente

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [status, size, showDetails]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Canvas HUD */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width: size, height: size }}
      />

      {/* Texte de statut (en dessous) */}
      {showDetails && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
          <div className="jarvis-text">
            {status === 'idle' && 'STANDBY'}
            {status === 'listening' && 'RECEIVING'}
            {status === 'processing' && 'ANALYZING'}
            {status === 'speaking' && 'TRANSMITTING'}
          </div>
        </div>
      )}

      {/* Données techniques (coins) */}
      {showDetails && (
        <>
          {/* Coin supérieur gauche */}
          <div className="absolute top-0 left-0 jarvis-data">
            SYS.01
          </div>

          {/* Coin supérieur droit */}
          <div className="absolute top-0 right-0 jarvis-data">
            {new Date().toLocaleTimeString('en-US', { hour12: false })}
          </div>

          {/* Coin inférieur gauche */}
          <div className="absolute bottom-0 left-0 jarvis-data">
            v3.0
          </div>

          {/* Coin inférieur droit */}
          <div className="absolute bottom-0 right-0 jarvis-data">
            ONLINE
          </div>
        </>
      )}
    </div>
  );
};
