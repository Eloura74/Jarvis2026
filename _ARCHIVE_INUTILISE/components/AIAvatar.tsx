import React, { useEffect, useRef, useMemo } from "react";
import { generateFaceMesh, FaceMesh } from "../utils/faceGeometry";

interface AIAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  size?: number;
  color?: string;
}

export const AIAvatar: React.FC<AIAvatarProps> = ({
  isSpeaking,
  isListening,
  size = 400,
  color = "#00e5ff",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Générer le mesh une seule fois
  const mesh = useMemo(() => generateFaceMesh(40, 50), []);

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

    let time = 0;
    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      time += 0.04;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2; // Monter un peu le visage
      const scale = size * 0.4;

      // Setup Animation
      const rotY = Math.sin(time * 0.1) * 0.15; // Rotation lente
      const rotX = Math.sin(time * 0.07) * 0.05 + 0.1; // Légère vue de haut

      let mouthOpen = 0;
      if (isSpeaking) {
        // Onde vocale (rapide)
        mouthOpen = Math.max(
          0,
          Math.sin(time * 2) * 0.15 + Math.cos(time * 5) * 0.05,
        );
      }

      // Projection Buffer
      const projected = new Array(mesh.vertices.length);

      // 1. TRANSFORM & PROJECT
      for (let i = 0; i < mesh.vertices.length; i++) {
        const v = mesh.vertices[i];

        let vx = v.x;
        let vy = v.y;
        let vz = v.z;

        // ANIMATION (Jaw Drop)
        // La mâchoire est grosso modo sous y = -0.3
        if (vy < -0.3) {
          // Interpolation lissée
          const factor = Math.min(1, Math.abs(vy - -0.3) * 2);
          vy -= mouthOpen * factor; // Vers le bas
          vz -= mouthOpen * factor * 0.3; // Et vers l'arrière (ouverture naturelle)
        }

        // ROTATION
        // Rot Y
        let x1 = vx * Math.cos(rotY) - vz * Math.sin(rotY);
        let z1 = vz * Math.cos(rotY) + vx * Math.sin(rotY);
        // Rot X
        let y2 = vy * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = z1 * Math.cos(rotX) + vy * Math.sin(rotX);

        // PROJECTION
        const fov = 4;
        const persp = fov / (fov - z2);

        projected[i] = {
          x: centerX + x1 * scale * persp,
          y: centerY - y2 * scale * persp, // Inverser Y car Canvas Y est vers le bas
          z: z2, // Garder Z pour culling
        };
      }

      // 2. DRAW WIREFRAME
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8; // Lines un peu plus épaisses pour visibilité
      ctx.globalAlpha = 0.6;

      // Dessin des quadrillages
      // Optimisation : Dessiner lignes H et V séparément

      // Lignes VERTICALES (cols)
      // Les mesh vertices sont organisés row par row
      const cols = 50;
      const rows = 40;

      ctx.beginPath();
      for (let j = 0; j <= cols; j += 2) {
        // 1 colonne sur 2 pour clarifier
        let drawing = false;
        for (let i = 0; i <= rows; i++) {
          const idx = i * (cols + 1) + j;
          const p = projected[idx];

          // Backface culling simple
          if (p.z < -0.5) {
            // Trop loin/derrière
            drawing = false;
            continue;
          }

          if (!drawing) {
            ctx.moveTo(p.x, p.y);
            drawing = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
      }
      ctx.stroke();

      // Lignes HORIZONTALES (rows)
      ctx.beginPath();
      for (let i = 0; i <= rows; i++) {
        let drawing = false;
        for (let j = 0; j <= cols; j++) {
          const idx = i * (cols + 1) + j;
          const p = projected[idx];

          if (p.z < -0.5) {
            drawing = false;
            continue;
          }

          if (!drawing) {
            ctx.moveTo(p.x, p.y);
            drawing = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
      }
      ctx.stroke();

      ctx.globalAlpha = 1;

      // EYES GLOW SUBTLE
      if (isListening) {
        // Position approx yeux projetée
        // Row ~ 15 (y=0.2), Col ~ 15 & 35
        const idxL = 14 * (cols + 1) + 15;
        const idxR = 14 * (cols + 1) + 35;

        [idxL, idxR].forEach((idx) => {
          const p = projected[idx];
          if (p) {
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 15);
            g.addColorStop(0, "white");
            g.addColorStop(1, "transparent");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [mesh, isSpeaking, isListening, size, color]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Fond ambiance */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
          filter: "blur(60px)",
          width: size * 1.2,
          height: size * 1.2,
        }}
      />
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, zIndex: 10 }}
      />
    </div>
  );
};
