import React, { useEffect, useRef } from "react";

interface ParticleSphereProps {
  isActive: boolean;
  isListening: boolean;
  audioLevel?: number;
  size?: number;
  baseColor?: string;
  activeColor?: string;
}

// Classe pour les points de la grille (Latitude/Longitude)
class GridPoint {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  lat: number;
  lon: number;

  constructor(radius: number, lat: number, lon: number) {
    this.lat = lat;
    this.lon = lon;

    // Conversion Sphérique -> Cartésien
    // phi (lat) de -PI/2 à PI/2
    // theta (lon) de 0 à 2PI
    const phi = (lat * Math.PI) / 180;
    const theta = (lon * Math.PI) / 180;

    this.x = radius * Math.cos(phi) * Math.cos(theta);
    this.y = radius * Math.sin(phi); // Y est l'axe vertical ici pour simplifier la rotation
    this.z = radius * Math.cos(phi) * Math.sin(theta);

    this.baseX = this.x;
    this.baseY = this.y;
    this.baseZ = this.z;
  }

  update(radiusFactor: number, rotationY: number, rotationX: number) {
    const currentX = this.baseX * radiusFactor;
    const currentY = this.baseY * radiusFactor;
    const currentZ = this.baseZ * radiusFactor;

    // Rotation Y (Principale)
    let x1 = currentX * Math.cos(rotationY) - currentZ * Math.sin(rotationY);
    let z1 = currentZ * Math.cos(rotationY) + currentX * Math.sin(rotationY);

    // Rotation X (Légère inclinaison -23.5deg pour effet Terre)
    const tilt = (23.5 * Math.PI) / 180;
    let y2 = currentY * Math.cos(tilt) - z1 * Math.sin(tilt);
    let z2 = z1 * Math.cos(tilt) + currentY * Math.sin(tilt);

    // Ajout rotation animée sur X si besoin (rotationX)
    let y3 = y2 * Math.cos(rotationX) - z2 * Math.sin(rotationX);
    let z3 = z2 * Math.cos(rotationX) + y2 * Math.sin(rotationX);

    this.x = x1;
    this.y = y3;
    this.z = z3;
  }
}

export const ParticleSphere: React.FC<ParticleSphereProps> = ({
  isActive,
  isListening,
  audioLevel = 0,
  size = 300,
  baseColor = "#00e5ff",
  activeColor = "#ff0033",
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

    // --- CONFIGURATION DU GLOBE ---
    const radius = size * 0.35;
    const points: GridPoint[] = [];

    // Création des Latitudes (Parallèles)
    for (let lat = -80; lat <= 80; lat += 10) {
      // Plus on est proche des pôles, moins on a de points pour maintenir la densité visuelle constante
      const circumference = Math.cos((lat * Math.PI) / 180);
      const step = 15 / Math.max(0.1, circumference); // Espacement longitudinal

      for (let lon = 0; lon < 360; lon += step) {
        points.push(new GridPoint(radius, lat, lon));
      }
    }

    // Ajout de particules aléatoires "Data" internes
    const dataPoints: GridPoint[] = [];
    for (let i = 0; i < 150; i++) {
      const lat = (Math.random() - 0.5) * 160;
      const lon = Math.random() * 360;
      // Rayon légèrement variable pour effet de volume
      const rVar = radius * (0.5 + Math.random() * 0.4);
      dataPoints.push(new GridPoint(rVar, lat, lon));
    }

    let rotationY = 0;
    let rotationX = 0; // Légère oscillation
    let time = 0;
    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // --- LOGIQUE D'ANIMATION ---
      let targetRadius = 1;
      let rotSpeed = 0.002;

      const audioFactor = Math.min(1, Math.max(0, audioLevel / 100));

      if (isActive) {
        // SPEAKING (Assistant)
        targetRadius = 1.05 + audioFactor * 0.2;
        rotSpeed = 0.02; // Rotation rapide quand parle
      } else if (isListening) {
        // LISTENING (User) - LE MICRO EST ACTIVÉ
        // L'utilisateur veut que ça "s'anime légèrement plus" et "grossisse un peu"
        targetRadius = 1.15 + audioFactor * 0.15; // + ~15% en base + reaction audio
        rotSpeed = 0.01; // Rotation plus rapide que l'idle (0.002)
        // Ajout d'une oscillation plus marquée sur X pour l'effet " vivant "
        rotationX = Math.sin(time * 0.02) * 0.1;
      } else {
        // IDLE
        targetRadius = 1 + Math.sin(time * 0.01) * 0.01;
      }

      rotationY += rotSpeed;
      if (!isActive) rotationX = Math.sin(time * 0.005) * 0.005; // Oscillation légère en idle
      time += 1;

      // Couleur active
      const color = isActive ? activeColor : baseColor;

      // Perspective pour le centre (pour les anneaux globaux)
      const fov = 300;
      const centerScale = fov / (fov + 400);

      // --- DESSIN GRILLE ---
      points.forEach((p) => {
        p.update(targetRadius, rotationY, rotationX);

        // Perspective
        const scale = fov / (fov + p.z + 400); // +400 pour reculer la caméra
        const px = centerX + p.x * scale;
        const py = centerY + p.y * scale;

        // On ne dessine que ce qui est "devant" ou légèrement derrière pour transparence
        // Z range approx -radius à +radius
        // Opacité basée sur Z (Depth Cueing)
        const alpha = Math.max(0.1, (p.z + radius) / (2 * radius)); // 0 à 1 approx

        if (alpha > 0.1) {
          ctx.fillStyle = color;
          ctx.globalAlpha = alpha * 0.6;
          ctx.beginPath();
          ctx.arc(px, py, 1.5 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // --- DESSIN DATA POINTS (Interne) ---
      dataPoints.forEach((p) => {
        p.update(targetRadius, -rotationY * 1.5, time * 0.005); // Tourne en sens inverse

        const scale = fov / (fov + p.z + 400);
        const px = centerX + p.x * scale;
        const py = centerY + p.y * scale;

        const alpha = Math.max(0, (p.z + radius) / (2 * radius));

        if (alpha > 0.05) {
          ctx.fillStyle = isActive ? "#ffffff" : color; // Data blanc si actif
          ctx.globalAlpha = alpha * 0.8;
          ctx.beginPath();
          ctx.arc(px, py, 2 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // --- EFFET SCAN VERTICAL / ANNEAU ---
      // const scanY = centerY + Math.sin(time * 0.05) * radius * centerScale;

      /* Anneau équatorial brillant */
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      // Utilisation de centerScale défini plus haut
      ctx.ellipse(
        centerX,
        centerY,
        radius * 1.2 * centerScale,
        radius * 0.4 * centerScale,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
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
      {/* Bloom Central */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${isActive ? activeColor : baseColor}33 0%, transparent 60%)`,
          filter: "blur(30px)",
        }}
      />
    </div>
  );
};
