import { useCallback } from "react";

const BACKEND_URL = "http://localhost:3001";

interface BriefingSection {
  title: string;
  content: string;
  icon: string;
}

interface BriefingResult {
  text: string;
  sections: BriefingSection[];
  generatedAt: string;
}

interface UseMorningBriefingProps {
  speak: (text: string) => void;
  city?: string;
}

/**
 * Hook pour déclencher le Briefing Vocal Matinal.
 *
 * - Appelle GET /api/briefing pour obtenir le résumé structuré
 * - Vocalise le texte via speak()
 * - Retourne les sections pour affichage UI optionnel
 *
 * Usage : appelé au démarrage (useGreeting) ou sur commande vocale
 * "Jarvis, donne-moi mon briefing du matin"
 */
export function useMorningBriefing({ speak, city = "Annecy" }: UseMorningBriefingProps) {
  /**
   * Déclenche le briefing matinal complet.
   * @returns {Promise<BriefingResult | null>}
   */
  const triggerBriefing = useCallback(async (): Promise<BriefingResult | null> => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/briefing?city=${encodeURIComponent(city)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: BriefingResult = await res.json();

      // Vocaliser le texte complet du briefing
      if (data.text) {
        speak(data.text);
      }

      return data;
    } catch (err) {
      console.error("[MorningBriefing] Erreur:", err);
      speak("Désolé Monsieur, je n'ai pas pu générer votre briefing matinal.");
      return null;
    }
  }, [speak, city]);

  return { triggerBriefing };
}
