import { useState, useCallback, useEffect } from "react";

const BACKEND_URL = "http://localhost:3001";

export interface SleepModeState {
  active: boolean;
  wakeUpAt: string | null;
}

interface UseSleepModeProps {
  speak: (text: string) => void;
}

/**
 * Hook de gestion du Mode Veille Intelligente.
 *
 * - Expose activate/deactivate/status
 * - Écoute les événements SSE SLEEP_MODE pour synchroniser l'état
 *   (réveil automatique déclenché côté serveur)
 * - Réduit visuellement l'interface quand la veille est active
 */
export function useSleepMode({ speak }: UseSleepModeProps) {
  const [sleepState, setSleepState] = useState<SleepModeState>({
    active: false,
    wakeUpAt: null,
  });

  /**
   * Active le mode veille.
   * @param wakeUpTime - Heure de réveil ISO 8601 (optionnel, défaut 8h)
   */
  const activateSleep = useCallback(
    async (wakeUpTime?: string) => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/sleep/activate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wakeUpTime: wakeUpTime || null }),
        });
        const data = await res.json();
        if (data.success) {
          setSleepState({ active: true, wakeUpAt: data.wakeUpAt });
        } else {
          speak(`Impossible d'activer la veille : ${data.message}`);
        }
      } catch (err) {
        console.error("[SleepMode] Erreur activation:", err);
      }
    },
    [speak],
  );

  /**
   * Désactive le mode veille manuellement.
   */
  const deactivateSleep = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sleep/deactivate`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setSleepState({ active: false, wakeUpAt: null });
      }
    } catch (err) {
      console.error("[SleepMode] Erreur désactivation:", err);
    }
  }, []);

  /**
   * Synchronise l'état depuis le serveur au montage du composant.
   * Utile si le serveur a été redémarré avec une veille active.
   */
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/sleep/status`)
      .then((r) => r.json())
      .then((data) => {
        setSleepState({ active: data.active, wakeUpAt: data.wakeUpAt });
      })
      .catch(() => {});
  }, []);

  return {
    sleepState,
    activateSleep,
    deactivateSleep,
    isSleeping: sleepState.active,
  };
}
