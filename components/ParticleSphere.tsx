import React, { useEffect, useRef } from "react";

interface ParticleSphereProps {
  isActive: boolean; // Speaking state (Assistant)
  isListening: boolean; // Listening state (User)
  audioLevel?: number; // 0-100 (Volume simulé ou réel)
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
  randomOffset: number;

  constructor(radius: number) {
    // Random point on sphere surface (uniform distribution)
    this.theta = Math.random() * Math.PI * 2;
    this.phi = Math.acos(Math.random() * 2 - 1);

    // Position de base
    this.x = radius * Math.sin(this.phi) * Math.cos(this.theta);
    this.y = radius * Math.sin(this.phi) * Math.sin(this.theta);
    this.z = radius * Math.cos(this.phi);

    this.baseX = this.x;
    this.baseY = this.y;
    this.baseZ = this.z;

    this.size = Math.random() * 1.5 + 0.5;
    this.speed = Math.random() * 0.02 + 0.005;
    this.randomOffset = Math.random() * 100;
  }

  update(radiusFactor: number, time: number, speedMultiplier: number) {
    // Rotation orbitale complexe mais fluide
    // speedMultiplier augmente avec l'audioLevel
    const rotX = time * this.speed * speedMultiplier + this.randomOffset;
    const rotY = time * this.speed * 0.8 * speedMultiplier;

    // Apply expansion (Audio Reactivity)
    // radiusFactor est boosté par l'audio
    const currentX = this.baseX * radiusFactor;
    const currentY = this.baseY * radiusFactor;
    const currentZ = this.baseZ * radiusFactor;

    // Rotate 3D
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
  audioLevel = 0,
  size = 300,
  baseColor = "#00e5ff",
  activeColor = "#ff0033", // Rouge Néon par défaut
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
    const baseRadius = size * 0.35; // Rayon de base un peu plus grand

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(baseRadius));
    }

    let time = 0;
    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Logique de vitesse et d'expansion basée sur l'état et l'audio
      let timeIncrement = 1;
      let targetRadius = 1;

      // Normalisation audioLevel (0-100 -> 0-1)
      const audioFactor = Math.min(1, Math.max(0, audioLevel / 100));

      if (isActive) {
        // SPEAKING (Assistant) -> Rouge Néon, Rapide, Expansif
        timeIncrement = 2 + audioFactor * 3; // Vitesse x2 à x5
        targetRadius = 1.1 + audioFactor * 0.4; // Expansion +10% à +50%
      } else if (isListening) {
        // LISTENING (User) -> Cyan, Réactif à sa voix aussi
        timeIncrement = 1 + audioFactor * 2; // Vitesse x1 à x3
        targetRadius = 1.05 + audioFactor * 0.3; // Expansion +5% à +35%
      } else {
        // IDLE -> Très lent, calme
        timeIncrement = 0.5; // Ralenti
        targetRadius = 1.0 + Math.sin(time * 0.02) * 0.02; // Respiration minime
      }

      time += timeIncrement;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Couleur : Rouge si active (parle), sinon BaseColor (Cyan par défaut)
      // On pourrait interpoler mais le switch immédiat est plus "digital"
      const currentColor = isActive ? activeColor : baseColor;

      particles.forEach((p) => {
        // Update avec le radius et la vitesse calculés
        p.update(targetRadius, time * 0.01, 1);

        // Projection Perspective Simple
        const fov = 300;
        const scale = fov / (fov + p.z);

        const px = centerX + p.x * scale;
        const py = centerY + p.y * scale;

        const pSize = p.size * scale;

        // Dessin
        ctx.fillStyle = currentColor;

        // Opacité variable pour scintillement + effet profondeur
        const alpha =
          (0.6 + Math.sin(time * 0.05 + p.phi) * 0.4) * (scale * 0.8);
        ctx.globalAlpha = Math.min(1, Math.max(0, alpha));

        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      });

      // Glow Central (Noyau d'énergie)
      if (isActive || isListening) {
        const glowRadius = baseRadius * targetRadius * 0.9;
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          glowRadius * 2,
        );
        gradient.addColorStop(0, currentColor);
        gradient.addColorStop(1, "transparent");

        ctx.globalAlpha = 0.1 + audioFactor * 0.2; // Glow s'intensifie avec la voix
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isActive, isListening, audioLevel, size, baseColor, activeColor]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, zIndex: 10 }}
      />
      {/* Optionnel: Effet de bloom CSS pour renforcer le néon */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${isActive ? activeColor : baseColor}44 0%, transparent 70%)`,
          width: "100%",
          height: "100%",
          filter: "blur(40px)",
          opacity: 0.3 + (audioLevel ? audioLevel / 200 : 0),
        }}
      />
    </div>
  );
};
