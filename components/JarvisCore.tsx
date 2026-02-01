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
  // Calcul des états basés sur le statut système
  // Processing = tout sauf IDLE et LISTENING (ex: PROCESSING, ERROR, etc.)
  const isProcessing = status !== "IDLE" && status !== "LISTENING";
  const isListening = status === "LISTENING";

  // Sélection des classes Tailwind pour couleurs principales (texte + bordures)
  // Rouge = écoute vocale | Violet = traitement IA | Cyan = repos/idle
  const mainColor = isListening
    ? "text-red-500 border-red-500"
    : isProcessing
      ? "text-purple-500 border-purple-500"
      : "text-cyan-400 border-cyan-400";

  // Classes pour effet glow/lueur autour des éléments
  // Utilise des box-shadows personnalisées avec rgba pour transparence
  const glowColor = isListening
    ? "shadow-[0_0_50px_rgba(239,68,68,0.5)]"
    : isProcessing
      ? "shadow-[0_0_50px_rgba(168,85,247,0.5)]"
      : "shadow-[0_0_50px_rgba(34,211,238,0.3)]";

  // Couleurs de fond pour éléments solides (particules, core)
  const bgGlow = isListening
    ? "bg-red-500"
    : isProcessing
      ? "bg-purple-500"
      : "bg-cyan-400";

  return (
    // Conteneur principal 320x320px, centré, non interactif
    // pointer-events-none = désactive clics (purement visuel)
    // select-none = désactive sélection texte
    <div className="relative w-80 h-80 flex items-center justify-center pointer-events-none select-none perspective-1000">
      {/* COUCHE 1 : Anneaux 3D en rotation (3 cercles concentriques) */}

      {/* Anneau extérieur (100%) - Bordure pointillée, rotation lente 20s */}
      <div
        className={`absolute w-full h-full rounded-full border border-dashed opacity-20 animate-[spin_20s_linear_infinite] ${mainColor}`}
      ></div>

      {/* Anneau intermédiaire (90%) - Rotation inverse 15s, incliné 45° (effet 3D) */}
      <div
        className={`absolute w-[90%] h-[90%] rounded-full border-[1px] opacity-40 animate-[spin_15s_linear_infinite_reverse] ${mainColor}`}
        style={{ transform: "rotateX(45deg)" }}
      ></div>

      {/* Anneau interne (80%) - Bordure 2px, glow actif, rotation 8s */}
      <div
        className={`absolute w-[80%] h-[80%] rounded-full border-[2px] opacity-60 animate-[spin_8s_linear_infinite] ${mainColor} ${glowColor}`}
      ></div>

      {/* COUCHE 2 : Core Reactor Central (réacteur arc) */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Halo lumineux extérieur (blur, pulse) */}
        <div
          className={`absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse ${bgGlow}`}
        ></div>
        {/* Anneau central avec bordure double, rotation rapide 3s */}
        <div
          className={`absolute inset-2 rounded-full border-4 border-double opacity-80 animate-[spin_3s_linear_infinite] ${mainColor}`}
        ></div>
        {/* Cœur blanc lumineux (centre du reactor) */}
        {/* mix-blend-overlay = effet de fusion avec arrière-plan */}
        <div className="absolute inset-8 bg-white rounded-full blur-md opacity-90 mix-blend-overlay"></div>
      </div>

      {/* COUCHE 3 : Particules de données en orbite */}
      {/* Orbite 120% (plus large que le reactor), rotation lente 30s */}
      <div
        className={`absolute w-[120%] h-[120%] rounded-full border-[1px] border-slate-700/30 animate-[spin_30s_linear_infinite]`}
      >
        {/* Particule 1 (top) - Suit la rotation de l'orbite */}
        <div
          className={`absolute top-0 left-1/2 w-2 h-2 rounded-full ${bgGlow} blur-[1px]`}
        ></div>
        {/* Particule 2 (bottom) - Opposée à la particule 1 */}
        <div
          className={`absolute bottom-0 left-1/2 w-2 h-2 rounded-full ${bgGlow} blur-[1px]`}
        ></div>
      </div>

      {/* COUCHE 4 : Lignes HUD holographiques (croix centrale) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Ligne horizontale avec dégradé depuis le centre */}
        <div className="w-[150%] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent absolute top-1/2"></div>
        {/* Ligne verticale avec dégradé depuis le centre */}
        <div className="h-[150%] w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent absolute left-1/2"></div>
      </div>

      {/* COUCHE 5 : Texte de statut flottant (en dessous du reactor) */}
      <div className="absolute -bottom-16 text-center transform transition-all duration-300">
        {/* Label "CURRENT PROTOCOL" en petites majuscules espacées */}
        <div className="text-[10px] tracking-[0.5em] text-slate-500 font-mono mb-1">
          CURRENT PROTOCOL
        </div>
        {/* Nom du statut en gros (IDLE, LISTENING, PROCESSING...) */}
        {/* Couleur change selon l'état : rouge (listening), violet (processing), cyan (idle) */}
        {/* neon-text = classe CSS custom pour effet néon (définie dans index.css) */}
        <div
          className={`text-2xl font-bold tracking-widest neon-text uppercase ${isListening ? "text-red-400" : isProcessing ? "text-purple-400" : "text-cyan-400"}`}
        >
          {status}
        </div>
      </div>
    </div>
  );
};

export default JarvisCore;
