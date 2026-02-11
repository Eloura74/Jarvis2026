/**
 * @fileoverview Composant ParticleBackground - Arrière-plan animé avec particules interactives
 *
 * Ce composant crée un effet visuel de fond holographique avec des particules en mouvement
 * qui se connectent entre elles via des lignes lorsqu'elles sont proches.
 *
 * Caractéristiques :
 * - Particules animées en Canvas 2D (performance optimale)
 * - Connexions dynamiques entre particules proches (<120px)
 * - Interaction souris : les particules sont attirées par le curseur (<150px)
 * - Vitesse modulée selon le statut système (x3 si actif)
 * - Couleurs cyan (normal) ou rouge (erreur)
 * - Responsive : redimensionnement auto du canvas
 *
 * Optimisations anti-memory leak :
 * - Flag `mounted` pour prévenir setState après démontage
 * - Vérification ctx existe avant chaque draw
 * - Cleanup complet : annulation animationFrame, event listeners, particules
 * - Recréation conditionnelle des particules au resize (seuil 50000px²)
 *
 * @module components/ParticleBackground
 */

import React, { useRef, useEffect } from "react";
import { SystemStatus } from "../types";

/**
 * Props du composant ParticleBackground
 * @interface ParticleBackgroundProps
 * @property {SystemStatus} status - Statut système actuel (détermine couleur et vitesse)
 */
interface ParticleBackgroundProps {
  status: SystemStatus;
}

/**
 * Composant d'arrière-plan animé avec système de particules interactives.
 * Utilise Canvas 2D pour dessiner et animer des particules qui se connectent entre elles.
 *
 * @param {ParticleBackgroundProps} props - Props du composant
 * @returns {JSX.Element} Canvas plein écran avec particules animées
 */
const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ status }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Récupération du canvas et du contexte 2D
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flag pour vérifier si le composant est toujours monté
    let mounted = true;
    let particles: Particle[] = [];
    let animationFrameId: number;
    let mouseX = 0;
    let mouseY = 0;

    // Fonction de redimensionnement du canvas
    // Optimisé pour ne recréer les particules que lors de changements significatifs
    const resize = () => {
      if (!mounted) return; // Ne rien faire si le composant est démonté

      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      // Éviter les recalculs inutiles si les dimensions n'ont pas changé
      if (canvas.width === newWidth && canvas.height === newHeight) return;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Recréer les particules seulement si nécessaire
      if (
        particles.length === 0 ||
        Math.abs(canvas.width * canvas.height - particles.length * 15000) >
          50000
      ) {
        initParticles();
      }
    };

    /**
     * Classe représentant une particule individuelle
     * Chaque particule possède une position, une vélocité et une taille.
     */
    class Particle {
      x: number; // Position X actuelle (px)
      y: number; // Position Y actuelle (px)
      vx: number; // Vélocité X (vitesse horizontale)
      vy: number; // Vélocité Y (vitesse verticale)
      size: number; // Taille de la particule (rayon en px)

      /**
       * Constructeur : initialise une particule avec position et vélocité aléatoires
       * Position : n'importe où dans le canvas
       * Vélocité : entre -0.25 et +0.25 px/frame
       * Taille : entre 1 et 3 px de rayon
       */
      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 0.5; // -0.25 à +0.25
        this.vy = (Math.random() - 0.5) * 0.5; // -0.25 à +0.25
        this.size = Math.random() * 2 + 1; // 1 à 3
      }

      /**
       * Met à jour la position de la particule
       * Applique comportements selon le statut système :
       * - IDLE : Mouvement lent aléatoire (x1)
       * - LISTENING : Convergence douce vers le centre de l'écran
       * - PROCESSING : Rotation en spirale autour du centre
       * - EXECUTING : Mouvement rapide (x3)
       * - ERROR : Dispersion explosive depuis le centre
       * + Rebond sur les bords + Attraction souris
       */
      update() {
        // 1. Vitesse de base selon statut système
        let speedMultiplier = status === SystemStatus.IDLE ? 1 : 3;

        // 2. Comportements spéciaux selon statut
        const centerX = canvas!.width / 2;
        const centerY = canvas!.height / 2;
        const dx = centerX - this.x;
        const dy = centerY - this.y;
        const distanceToCenter = Math.sqrt(dx * dx + dy * dy);

        switch (status) {
          case SystemStatus.LISTENING:
            // LISTENING : Convergence douce vers le centre
            // Les particules sont attirées vers le point focal (microphone)
            if (distanceToCenter > 50) {
              this.x += dx * 0.02; // 2% vers le centre à chaque frame
              this.y += dy * 0.02;
            }
            speedMultiplier = 0.5; // Ralentir le mouvement aléatoire
            break;

          case SystemStatus.PROCESSING:
            // PROCESSING : Rotation en spirale autour du centre
            // Animation hypnotique pendant le traitement AI
            const angle = Math.atan2(dy, dx);
            const rotationSpeed = 0.03;
            const spiralRadius = distanceToCenter;

            // Rotation + convergence progressive
            this.x =
              centerX + Math.cos(angle + rotationSpeed) * spiralRadius * 0.98;
            this.y =
              centerY + Math.sin(angle + rotationSpeed) * spiralRadius * 0.98;
            speedMultiplier = 0.3;
            break;

          case SystemStatus.ERROR:
            // ERROR : Dispersion explosive depuis le centre
            // Particules fuient le centre comme une explosion
            if (distanceToCenter < 300) {
              this.x -= dx * 0.05; // Repousser depuis le centre
              this.y -= dy * 0.05;
              this.vx += (Math.random() - 0.5) * 0.1; // Ajouter chaos
              this.vy += (Math.random() - 0.5) * 0.1;
            }
            speedMultiplier = 4; // Mouvement très rapide
            break;

          case SystemStatus.SEARCHING:
          case SystemStatus.EXECUTING:
          case SystemStatus.NETWORKING:
            // États actifs : mouvement rapide standard
            speedMultiplier = 3;
            break;

          default:
            // IDLE et autres : mouvement lent
            speedMultiplier = 1;
            break;
        }

        // 3. Appliquer mouvement de base
        this.x += this.vx * speedMultiplier;
        this.y += this.vy * speedMultiplier;

        // 4. Rebond sur les bords (inversion vélocité)
        if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;

        // 5. Interaction souris : attraction douce si distance <150px
        const mouseDistance = Math.sqrt(
          (mouseX - this.x) ** 2 + (mouseY - this.y) ** 2,
        );

        // Si proche de la souris, déplacer de 1% vers la souris chaque frame
        if (mouseDistance < 150) {
          this.x += (mouseX - this.x) * 0.01;
          this.y += (mouseY - this.y) * 0.01;
        }
      }

      /**
       * Dessine la particule sur le canvas
       * Couleur : Rouge si ERROR, Cyan sinon
       * Forme : Cercle plein avec opacité 50%
       */
      draw() {
        // Vérification de sécurité : ne dessiner que si le contexte existe ET que le composant est monté
        if (!ctx || !mounted) return;

        // Sélection couleur selon statut système
        if (status === SystemStatus.ERROR) {
          ctx.fillStyle = "rgba(255, 42, 42, 0.8)"; // Red
        } else if (
          status === SystemStatus.PROCESSING ||
          status === SystemStatus.NETWORKING
        ) {
          ctx.fillStyle = "rgba(192, 132, 252, 0.8)"; // Purple
        } else if (status === SystemStatus.LISTENING) {
          ctx.fillStyle = "rgba(255, 215, 0, 0.8)"; // Gold
        } else {
          ctx.fillStyle = "rgba(0, 243, 255, 0.4)"; // Cyan
        }

        // Dessin du cercle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /**
     * Initialise le tableau de particules selon la taille de l'écran
     * Formule : 1 particule par tranche de 15000px² (densité adaptative)
     * Exemple : 1920x1080 (2073600px²) = ~138 particules
     */
    const initParticles = () => {
      particles = [];
      const count = Math.floor(
        (window.innerWidth * window.innerHeight) / 15000,
      );
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    };

    /**
     * Boucle d'animation principale (requestAnimationFrame)
     *
     * Processus par frame :
     * 1. Effacer le canvas
     * 2. Pour chaque particule :
     *    - Mettre à jour position (update)
     *    - Dessiner (draw)
     *    - Connecter aux particules proches (<120px) avec lignes
     * 3. Relancer une nouvelle frame
     */
    const animate = () => {
      // Vérification de sécurité : arrêter l'animation si le composant est démonté
      if (!ctx || !mounted) return;

      // Effacer le canvas entier
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Boucle principale sur toutes les particules
      particles.forEach((p, index) => {
        p.update();
        p.draw();

        // Dessiner les lignes de connexion entre particules proches
        // Boucle optimisée : commence à index+1 pour éviter doublons (AB = BA)
        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];

          // Calcul distance euclidienne entre les deux particules
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Si distance < 120px, tracer une ligne entre les deux
          if (distance < 120) {
            ctx.beginPath();

            // Opacité de la ligne proportionnelle à la distance
            // Plus proche = plus opaque
            let strokeColor;

            if (status === SystemStatus.ERROR) {
              strokeColor = `rgba(255, 42, 42, ${1 - distance / 120})`; // Red Alert
            } else if (
              status === SystemStatus.PROCESSING ||
              status === SystemStatus.NETWORKING
            ) {
              strokeColor = `rgba(168, 85, 247, ${0.8 * (1 - distance / 120)})`; // Purple
            } else if (status === SystemStatus.LISTENING) {
              strokeColor = `rgba(255, 215, 0, ${0.8 * (1 - distance / 120)})`; // Gold
            } else {
              strokeColor = `rgba(0, 243, 255, ${0.2 * (1 - distance / 120)})`; // Cyan Primary
            }

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = status === SystemStatus.IDLE ? 0.5 : 1.5; // Lignes plus fines en idle
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      // Relancer la boucle pour la frame suivante (~60fps)
      animationFrameId = requestAnimationFrame(animate);
    };

    /**
     * Callback mousemove : enregistre la position actuelle de la souris
     * Utilisé dans Particle.update() pour l'attraction vers le curseur
     *
     * @param {MouseEvent} e - Event souris
     */
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    resize();
    animate();

    // Cleanup au démontage du composant
    return () => {
      // Marquer le composant comme démonté AVANT de nettoyer
      mounted = false;

      // Retirer les event listeners
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);

      // Annuler l'animation en cours
      cancelAnimationFrame(animationFrameId);

      // Nettoyer le tableau de particules
      particles = [];
    };
  }, [status]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
};

export default ParticleBackground;
