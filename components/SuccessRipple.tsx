/**
 * Composant SuccessRipple - Animation feedback succès
 *
 * Affiche une animation de vague verte lors d'une action réussie
 */

import React, { useEffect, useState } from "react";

interface SuccessRippleProps {
  trigger: number; // Timestamp du dernier succès
}

export const SuccessRipple: React.FC<SuccessRippleProps> = ({ trigger }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;

    // eslint-disable-next-line
    setIsVisible(true);

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [trigger]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998]">
      <div className="absolute inset-0 bg-green-500/10 animate-pulse" />
      <div className="absolute inset-0 border-4 border-green-500/30 animate-ping" />
    </div>
  );
};
