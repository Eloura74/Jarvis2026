import React, { useEffect, useRef } from "react";

interface ParticleSphereProps {
  isActive: boolean; // Speaking state
  isListening: boolean; // Listening state
  size?: number;
  baseColor?: string;
  activeColor?: string;
}

class Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  size: number;
  theta: number;
  phi: number;
  speed: number;

  constructor(radius: number) {
    // Random point on sphere surface (uniform distribution)
    this.theta = Math.random() * Math.PI * 2;
    this.phi = Math.acos(Math.random() * 2 - 1);

    // Position
    this.x = radius * Math.sin(this.phi) * Math.cos(this.theta);
    this.y = radius * Math.sin(this.phi) * Math.sin(this.theta);
    this.z = radius * Math.cos(this.phi);

    this.baseX = this.x;
    this.baseY = this.y;
    this.baseZ = this.z;

    this.size = Math.random() * 1.5 + 0.5;
    this.speed = Math.random() * 0.02 + 0.005;
  }

  update(radiusFactor: number, time: number) {
    // Rotation orbitale complexe
    const rotX = time * this.speed;
    const rotY = time * this.speed * 0.8;

    // Apply expansion
    const currentX = this.baseX * radiusFactor;
    const currentY = this.baseY * radiusFactor;
    const currentZ = this.baseZ * radiusFactor;

    // Rotate
    let y1 = currentY * Math.cos(rotX) - currentZ * Math.sin(rotX);
    let z1 = currentZ * Math.cos(rotX) + currentY * Math.sin(rotX);

    let x2 = currentX * Math.cos(rotY) - z1 * Math.sin(rotY);
    let z2 = z1 * Math.cos(rotY) + currentX * Math.sin(rotY);

    this.x = x2;
    this.y = y1;
    this.z = z2;
  }
}

export const ParticleSphere: React.FC<ParticleSphereProps> = ({
  isActive,
  isListening,
  size = 300,
  baseColor = "#00e5ff",
  activeColor = "#ffd700", // Gold/Orange quand il parle
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Génération Particules
    const particleCount = 800; // Dense
    const particles: Particle[] = [];
    const baseRadius = size * 0.3; // Rayon de base

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(baseRadius));
    }

    let time = 0;
    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      time += 1;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Paramètres basés sur l'état
      // Expansion si actif
      let targetRadiusFactor = 1;
      if (isActive) {
        // Pulsation rythmique + expansion
        targetRadiusFactor = 1.3 + Math.sin(time * 0.1) * 0.1;
      } else if (isListening) {
        // Respiration lente
        targetRadiusFactor = 1.1 + Math.sin(time * 0.05) * 0.05;
      }

      // Lissage factor (simple approach, could be improved with lerp state)
      // Pour l'instant on utilise le calcul direct pour réactivé immédiate

      // Couleur
      const currentColor = isActive ? activeColor : baseColor;

      particles.forEach((p) => {
        p.update(targetRadiusFactor, time);

        // Projection
        const fov = 300;
        const scale = fov / (fov + p.z);

        const px = centerX + p.x * scale;
        const py = centerY + p.y * scale;

        const pSize = p.size * scale;

        // Dessin
        ctx.fillStyle = currentColor;
        ctx.globalAlpha = 0.6 + Math.sin(time * 0.1 + p.phi) * 0.4; // Scintillement

        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      });

      // Glow central
      const glowRadius = baseRadius * targetRadiusFactor * 0.8;
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        glowRadius * 2,
      );
      gradient.addColorStop(0, currentColor); // Centre brillant
      gradient.addColorStop(1, "transparent");

      ctx.globalAlpha = 0.15;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowRadius * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isActive, isListening, size, baseColor, activeColor]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, zIndex: 10 }}
      />
    </div>
  );
};
