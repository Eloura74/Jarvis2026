/**
 * @fileoverview Composant DecryptedText - Effet d'animation de déchiffrement progressif
 *
 * Ce composant affiche du texte avec un effet visuel de "déchiffrement" type Matrix/hacker :
 * - Le texte final se révèle progressivement lettre par lettre (de gauche à droite)
 * - Les lettres non encore révélées sont remplacées par des caractères aléatoires changeants
 * - Crée un effet de "brute force decrypt" qui donne une ambiance futuriste/cyberpunk
 *
 * Fonctionnalités :
 * - Vitesse configurable via prop `speed` (ms par frame, défaut 30ms)
 * - Callback `onComplete` appelée quand toute l'animation est terminée
 * - Classe CSS custom via prop `className` pour styliser le texte
 * - Protection memory leak : flag `mounted` pour éviter setState après démontage
 *
 * Algorithme :
 * - Chaque frame (interval de `speed` ms) :
 *   1. Les `iteration` premières lettres affichent le texte réel
 *   2. Les lettres suivantes affichent un caractère aléatoire
 *   3. `iteration` augmente de 1/3 (ralentissement pour effet plus visible)
 * - Quand `iteration >= text.length`, l'animation s'arrête
 *
 * @module components/DecryptedText
 */

import React, { useState, useEffect } from "react";

/**
 * Props du composant DecryptedText
 * @interface DecryptedTextProps
 * @property {string} text - Texte final à afficher (sera déchiffré progressivement)
 * @property {number} [speed=30] - Vitesse d'animation en ms par frame (plus petit = plus rapide)
 * @property {string} [className] - Classes CSS Tailwind à appliquer au span
 * @property {Function} [onComplete] - Callback appelée quand l'animation est terminée
 */
interface DecryptedTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

/**
 * Alphabet de caractères aléatoires utilisés pour l'effet de déchiffrement
 * Majuscules + chiffres + symboles spéciaux
 */
const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

/**
 * Composant affichant du texte avec effet de déchiffrement progressif
 * Simule un effet de "brute force decrypt" où le texte se révèle lettre par lettre.
 *
 * @param {DecryptedTextProps} props - Props du composant
 * @returns {JSX.Element} Span contenant le texte en cours de déchiffrement
 */
const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 30,
  className,
  onComplete,
}) => {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    // Flag pour vérifier si le composant est toujours monté (anti-memory leak)
    let mounted = true;
    let iteration = 0; // Compteur de progression (augmente de 1/3 par frame)
    const maxIterations = text.length;

    /**
     * Interval principal d'animation
     * Chaque `speed` ms, met à jour le texte affiché :
     * - index < iteration : afficher lettre réelle
     * - index >= iteration : afficher caractère aléatoire
     */
    const interval = setInterval(() => {
      // Vérification sécurité : arrêter si composant démonté
      if (!mounted) {
        clearInterval(interval);
        return;
      }

      // Mise à jour du texte affiché
      setDisplayText(() => {
        return text
          .split("")
          .map((_letter, index) => {
            // Lettres déjà déchiffrées : afficher la vraie lettre
            if (index < iteration) {
              return text[index];
            }
            // Lettres non déchiffrées : afficher caractère aléatoire
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join("");
      });

      // Si animation terminée, arrêter l'interval et appeler onComplete
      if (iteration >= maxIterations) {
        clearInterval(interval);
        if (onComplete && mounted) onComplete(); // Appeler onComplete seulement si monté
      }

      // Incrémenter progression (1/3 par frame = ralentissement pour effet plus visible)
      iteration += 1 / 3;
    }, speed);

    // Cleanup au démontage : marquer le composant comme démonté et nettoyer l'interval
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [text, speed, onComplete]);

  return <span className={className}>{displayText}</span>;
};

export default DecryptedText;
