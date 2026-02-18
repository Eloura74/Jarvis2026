import React, { useEffect, useRef } from "react";

interface ParticleSphereProps {
  isActive: boolean;
  isListening: boolean;
  audioLevel?: number;
  size?: number;
  baseColor?: string;
  activeColor?: string;
}

class GridPoint {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  lat: number;
  lon: number;
  isLand: boolean;

  constructor(radius: number, lat: number, lon: number) {
    this.lat = lat;
    this.lon = lon;

    // Conversion Sphérique -> Cartésien
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    //
    this.x = -(radius * Math.sin(phi) * Math.cos(theta));
    this.z = radius * Math.sin(phi) * Math.sin(theta);
    this.y = radius * Math.cos(phi);

    this.baseX = this.x;
    this.baseY = this.y;
    this.baseZ = this.z;

    // Simulation simpliste de "continents" via bruit
    const noise =
      Math.sin(lat * 0.1) * Math.cos(lon * 0.1) +
      Math.sin(lat * 0.3 + lon * 0.2) * 0.5;
    this.isLand = noise > 0.2;
  }

  update(radiusFactor: number, rotationY: number, rotationX: number) {
    const currentX = this.baseX * radiusFactor;
    const currentY = this.baseY * radiusFactor;
    const currentZ = this.baseZ * radiusFactor;

    // Rotation Y (Principale)
    const x1 = currentX * Math.cos(rotationY) - currentZ * Math.sin(rotationY);
    const z1 = currentZ * Math.cos(rotationY) + currentX * Math.sin(rotationY);

    // Rotation X (Tilt fixe ~23deg)
    const tilt = (23 * Math.PI) / 180;
    const y2 = currentY * Math.cos(tilt) - z1 * Math.sin(tilt);
    const z2 = z1 * Math.cos(tilt) + currentY * Math.sin(tilt);

    // Oscillation additionnelle X
    const y3 = y2 * Math.cos(rotationX) - z2 * Math.sin(rotationX);
    const z3 = z2 * Math.cos(rotationX) + y2 * Math.sin(rotationX);

    this.x = x1;
    this.y = y3;
    this.z = z3;
  }
}

export const ParticleSphere: React.FC<ParticleSphereProps> = ({
  isActive,
  isListening,
  audioLevel = 0,
  size = 600,
  baseColor = "#00e5ff",
  activeColor = "#00e5ff",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    // --- CONFIGURATION DU GLOBE ---
    // Rayon AUGMENTÉ pour effet MAXIMAL (était 0.36 -> 0.42)
    const radius = size * 0.42;
    const points: GridPoint[] = [];

    for (let lat = -90; lat <= 90; lat += 3) {
      const r_lat = Math.cos((lat * Math.PI) / 180) * radius;
      const circumference = 2 * Math.PI * r_lat;
      const pointsOnLat = Math.floor(circumference / 4);

      if (pointsOnLat > 0) {
        const step = 360 / pointsOnLat;
        for (let lon = -180; lon < 180; lon += step) {
          points.push(new GridPoint(radius, lat, lon));
        }
      }
    }

    let rotationY = 0;
    let rotationX = 0;
    let time = 0;
    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      const centerX = size / 2;
      const centerY = size / 2;

      // --- LOGIQUE D'ANIMATION ---
      let targetRadius = 1;
      let rotSpeed = 0.003;

      if (isActive) {
        // Speaking: LOCK SIZE (Animation vitesse seulement)
        targetRadius = 1;
        rotSpeed = 0.03;
      } else if (isListening) {
        // Listening: LOCK SIZE (Animation vitesse + oscillation seulement)
        targetRadius = 1;
        rotSpeed = 0.02;
        rotationX = Math.sin(time * 0.05) * 0.1;
      } else {
        // Idle
        targetRadius = 1 + Math.sin(time * 0.01) * 0.005;
        rotationX = Math.sin(time * 0.01) * 0.02;
      }

      rotationY += rotSpeed;
      time += 1;

      // --- 1. GLOBE (POINTS) ---
      points.forEach((p) => {
        p.update(targetRadius, rotationY, rotationX);

        const fov = 400;
        const scale = fov / (fov + p.z + 400);
        const px = centerX + p.x * scale;
        const py = centerY + p.y * scale;

        if (p.z > -radius * 1.5) {
          const baseAlpha = (p.z + radius) / (2 * radius);

          if (p.isLand) {
            ctx.fillStyle = isListening || isActive ? "#ffffff" : baseColor;
            ctx.globalAlpha = Math.max(0.1, baseAlpha);
            ctx.beginPath();
            ctx.arc(px, py, 1.2 * scale, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = baseColor;
            ctx.globalAlpha = Math.max(0, baseAlpha * 0.3);
            ctx.beginPath();
            ctx.arc(px, py, 0.8 * scale, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // --- 2. ANNEAUX (RINGS) - SUPPRIMÉS ---
      // L'utilisateur veut uniquement la sphère, sans traits autour.

      // --- 3. DÉCORS (TEXTE SUPPRIMÉ) ---
      // Le texte est géré par JarvisHUDAuthentic pour un meilleur alignement.

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
      {/* Glow Central Diffus */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${isListening ? "#ef4444" : baseColor}22 0%, transparent 60%)`,
          filter: "blur(40px)",
          transition: "background 0.3s ease",
        }}
      />
    </div>
  );
};
