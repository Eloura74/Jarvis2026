import { useEffect, useRef } from "react";
import { scanForQuantumLinks, QMSScanResult } from "../../services/qmsService";

interface QuantumObserverProps {
  logs: string[];
  currentTask: string;
  onSuggestion: (suggestion: QMSScanResult) => void;
  isEnabled: boolean;
  executeTool: (name: string, args: any) => Promise<any>;
}

/**
 * Hook qui surveille l'activité système et propose des actions "magiques" (QMS).
 * Inclut maintenant le "Ghost Mode" : analyse d'écran proactive en cas d'inactivité.
 */
export function useQuantumObserver({
  logs,
  currentTask,
  onSuggestion,
  isEnabled,
  executeTool,
}: QuantumObserverProps) {
  const lastScanTime = useRef(0);
  const lastActionTime = useRef(Date.now());
  const scanInterval = 60000; // 1 minute
  const ghostModeIdleThreshold = 300000; // 5 minutes d'inactivité

  useEffect(() => {
    if (!isEnabled) return;

    const timer = setInterval(async () => {
      const now = Date.now();

      // 1. Quantum Memory Stitching (Lien entre les logs)
      if (now - lastScanTime.current >= scanInterval) {
        console.log("🌌 [QMS] Neural Observation start...");
        const result = await scanForQuantumLinks(logs.slice(-10), currentTask);
        if (result.hasSuggestion) {
          onSuggestion(result);
          lastScanTime.current = now;
        }
      }

      // 2. Ghost Mode (Analyse d'écran proactive si Monsieur est inactif)
      if (now - lastActionTime.current >= ghostModeIdleThreshold) {
        console.log("👻 [Ghost Mode] Vision proactive activée...");
        await executeTool("analyze_screen", {
          type: "general",
          prompt: "Que fait Monsieur ? Propose une aide magique.",
        });
        lastActionTime.current = now; // Évite de boucler trop vite
      }
    }, 10000); // Check toutes les 10s

    return () => clearInterval(timer);
  }, [logs, currentTask, onSuggestion, isEnabled, executeTool]);

  // Exposer une méthode pour reset l'inactivité
  const resetInactivity = () => {
    lastActionTime.current = Date.now();
  };

  return { resetInactivity };
}
