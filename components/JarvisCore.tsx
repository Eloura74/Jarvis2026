/**
 * @fileoverview Composant JarvisCore - Cœur visuel de l'interface J.A.R.V.I.S.
 *
 * Ce composant affiche le "réacteur arc" central animé qui visualise l'état du système.
 * Il s'inspire de l'arc reactor d'Iron Man avec des anneaux concentriques en rotation,
 * des particules en orbite, et des effets de lueur holographiques.
 *
 * Les couleurs changent dynamiquement en fonction du statut système :
 * - IDLE : Cyan (repos, attente de commande)
 * - LISTENING : Rouge (écoute vocale active)
 * - PROCESSING : Violet (traitement IA en cours)
 *
 * Structure visuelle en 6 couches :
 * 1. Anneaux 3D en rotation (bordures)
 * 2. Core reactor central (cercle lumineux)
 * 3. Particules en orbite
 * 4. Lignes HUD holographiques
 * 5. Texte de statut flottant
 *
 * @module components/JarvisCore
 */

import React from "react";
import { motion } from "framer-motion";

/**
 * Props du composant JarvisCore
 * @interface JarvisCoreProps
 * @property {string} status - Statut système actuel (IDLE, LISTENING, PROCESSING, etc.)
 */
interface JarvisCoreProps {
  status: string;
}

/**
 * Composant visuel principal représentant le réacteur arc de J.A.R.V.I.S.
 * Affiche un core animé avec anneaux en rotation et effets holographiques.
 *
 * @param {JarvisCoreProps} props - Props du composant
 * @returns {JSX.Element} Le réacteur arc animé
 */
const JarvisCore: React.FC<JarvisCoreProps> = ({ status }) => {
  const isProcessing = status !== "IDLE" && status !== "LISTENING";
  const isListening = status === "LISTENING";
  const isError = status === "ERROR";

  // Palette dynamique
  const getColors = () => {
    if (isError)
      return {
        primary: "#ef4444",
        secondary: "#7f1d1d",
        glow: "rgba(239, 68, 68, 0.6)",
      };
    if (isListening)
      return {
        primary: "#ef4444",
        secondary: "#b91c1c",
        glow: "rgba(239, 68, 68, 0.6)",
      };
    if (isProcessing)
      return {
        primary: "#a855f7",
        secondary: "#6b21a8",
        glow: "rgba(168, 85, 247, 0.6)",
      };
    return {
      primary: "#06b6d4",
      secondary: "#155e75",
      glow: "rgba(6, 182, 212, 0.5)",
    };
  };

  const colors = getColors();

  return (
    <div className="relative w-96 h-96 flex items-center justify-center pointer-events-none select-none">
      {/* Fond lumineux global (Ambiance) */}
      <motion.div
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 rounded-full blur-[100px]"
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
        }}
      />

      {/* SVG COMPLEXE : Anneaux Mécaniques */}
      <svg className="w-full h-full absolute inset-0" viewBox="0 0 400 400">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* CERCLE EXTERNE (Structure) - Fixe */}
        <circle
          cx="200"
          cy="200"
          r="190"
          fill="none"
          stroke={colors.secondary}
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="5 5"
        />

        {/* ANNEAU 1 : Segments Rotatifs (Lent) */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ originX: "200px", originY: "200px" }}
        >
          <circle
            cx="200"
            cy="200"
            r="170"
            fill="none"
            stroke={colors.primary}
            strokeWidth="1"
            opacity="0.2"
          />
          <path
            d="M 200 30 A 170 170 0 0 1 370 200"
            fill="none"
            stroke={colors.primary}
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.6"
            filter="url(#glow)"
          />
          <path
            d="M 200 370 A 170 170 0 0 1 30 200"
            fill="none"
            stroke={colors.primary}
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.6"
            filter="url(#glow)"
          />
        </motion.g>

        {/* ANNEAU 2 : Indicateurs Tech (Rapide Inverse) */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ originX: "200px", originY: "200px" }}
        >
          <circle
            cx="200"
            cy="200"
            r="140"
            fill="none"
            stroke={colors.secondary}
            strokeWidth="1"
            strokeDasharray="20 40"
            opacity="0.4"
          />
          {/* Triangles décoratifs */}
          <polygon
            points="200,60 205,70 195,70"
            fill={colors.primary}
            opacity="0.8"
          />
          <polygon
            points="200,340 205,330 195,330"
            fill={colors.primary}
            opacity="0.8"
          />
        </motion.g>

        {/* ANNEAU 3 : Core Inner Ring (Pulsant) */}
        <motion.g
          animate={{ scale: isListening ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ originX: "200px", originY: "200px" }}
        >
          <circle
            cx="200"
            cy="200"
            r="90"
            fill="none"
            stroke={colors.primary}
            strokeWidth="2"
            opacity="0.8"
            filter="url(#glow)"
          />
          {/* Détails internes */}
          <path
            d="M 200 110 L 200 130"
            stroke={colors.primary}
            strokeWidth="2"
          />
          <path
            d="M 290 200 L 270 200"
            stroke={colors.primary}
            strokeWidth="2"
          />
          <path
            d="M 200 290 L 200 270"
            stroke={colors.primary}
            strokeWidth="2"
          />
          <path
            d="M 110 200 L 130 200"
            stroke={colors.primary}
            strokeWidth="2"
          />
        </motion.g>

        {/* CENTRAL REACTOR */}
        <motion.circle
          cx="200"
          cy="200"
          r="60"
          fill={isListening ? colors.primary : "none"}
          stroke={colors.primary}
          strokeWidth="3"
          opacity="0.9"
          animate={{
            fillOpacity: isListening ? [0.2, 0.5, 0.2] : 0.1,
            strokeWidth: isProcessing ? [3, 8, 3] : 3,
          }}
          transition={{ duration: isProcessing ? 1 : 2, repeat: Infinity }}
          filter="url(#glow)"
        />

        {/* Noyau Blanc Pur */}
        <circle
          cx="200"
          cy="200"
          r="40"
          fill="white"
          fillOpacity="0.8"
          filter="url(#glow)"
        />
      </svg>

      {/* Lignes de connexion HUD (HTML/CSS pour faciliter le layout textuel si besoin) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[1px] h-[400px] bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent"></div>
        <div className="h-[1px] w-[400px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
      </div>

      {/* Status Text (Tech Typography) */}
      <div className="absolute -bottom-20 text-center flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2 opacity-60">
          <div className="h-[1px] w-12 bg-cyan-500/50"></div>
          <span className="text-[10px] tracking-[0.3em] text-cyan-400 font-mono">
            SYSTEM_STATUS
          </span>
          <div className="h-[1px] w-12 bg-cyan-500/50"></div>
        </div>
        <motion.div
          key={status} // Key change triggers animation
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-widest uppercase font-mono"
          style={{
            color: colors.primary,
            textShadow: `0 0 20px ${colors.glow}`,
          }}
        >
          {status}
        </motion.div>
      </div>
    </div>
  );
};

export default JarvisCore;
