import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface IntroSequenceProps {
  onComplete: () => void;
}

/**
 * IntroSequence - J.A.R.V.I.S.
 *
 * Ce composant gère la vidéo de démarrage cinématique.
 * Il s'affiche en plein écran et se retire une fois la vidéo terminée.
 */
export const IntroSequence: React.FC<IntroSequenceProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Tenter de jouer la vidéo dès le montage
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn(
          "Échec de la lecture automatique de la vidéo d'intro:",
          err,
        );
        // Si échec (souvent dû aux restrictions navigateur sans interaction préalable),
        // on passe directement à la suite ou on attend une interaction.
        // Ici, comme StartOverlay a déjà eu un clic, ça devrait passer.
      });
    }
  }, []);

  const handleVideoEnd = () => {
    // Petit délai pour savourer la fin de l'animation avant de passer au dashboard
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-[10000] bg-black flex items-center justify-center overflow-hidden"
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        onEnded={handleVideoEnd}
        playsInline
        // On ne met pas 'muted' car l'utilisateur a déjà cliqué sur StartOverlay
      >
        <source src="/Vidéo_de_lancement_pour_Jarvis.mp4" type="video/mp4" />
        Votre navigateur ne prend pas en charge la lecture de vidéos.
      </video>

      {/* Bouton Skip discret en bas à droite */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        whileHover={{ opacity: 1 }}
        onClick={onComplete}
        className="absolute bottom-8 right-8 text-cyan-400/50 hover:text-cyan-400 text-sm font-mono tracking-widest border border-cyan-400/20 px-4 py-2 rounded uppercase transition-all"
      >
        Passer l'intro [ESC]
      </motion.button>
    </motion.div>
  );
};
