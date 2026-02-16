import { useEffect, useRef } from "react";
import { scanForQuantumLinks, QMSScanResult } from "../../services/qmsService";
import { checkNeuralStatus } from "../../services/geminiService";

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
  // Utiliser le localStorage pour garder trace du dernier scan même après un refresh/HMR
  const lastScanTime = useRef<number>(
    parseInt(localStorage.getItem("jarvis_last_qms_scan") || "0"),
  );
  const lastActionTime = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scanInterval = 300000; // 5 minutes (Encore plus calme)
  const ghostModeIdleThreshold = 900000; // 15 minutes d'inactivité

  useEffect(() => {
    if (!isEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Délai initial pour laisser le système se stabiliser
    const initialDelay = setTimeout(() => {
      const timer = setInterval(async () => {
        const now = Date.now();

        // Éviter de scanner si on a déjà fait une action récemment ou si le noyau est saturé
        const { isOverloaded } = checkNeuralStatus();
        if (isOverloaded || now - lastActionTime.current < 30000) return;

        // 1. Quantum Memory Stitching
        if (now - lastScanTime.current >= scanInterval) {
          console.log("🌌 [QMS] Neural Observation heartbeat check...");
          try {
            const result = await scanForQuantumLinks(
              logs.slice(-10),
              currentTask,
            );
            if (result && result.hasSuggestion) {
              onSuggestion(result);
              lastScanTime.current = now;
              localStorage.setItem("jarvis_last_qms_scan", now.toString());
            }
          } catch (e) {
            console.warn("QMS Scan paused.");
          }
        }

        // 2. Ghost Mode
        if (now - lastActionTime.current >= ghostModeIdleThreshold) {
          console.log("👻 [Ghost Mode] Vision proactive activée...");
          try {
            await executeTool("analyze_screen", {
              type: "general",
              prompt: "Que fait Monsieur ? Propose une aide magique.",
            });
            lastActionTime.current = now;
          } catch (e) {
            console.warn("Ghost Mode failed.");
          }
        }
      }, 60000); // Check toutes les 1 minute

      intervalRef.current = timer as any;
    }, 30000); // 30s de pause au démarrage

    return () => {
      clearTimeout(initialDelay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [logs, currentTask, onSuggestion, isEnabled, executeTool]);

  // Exposer une méthode pour reset l'inactivité
  const resetInactivity = () => {
    lastActionTime.current = Date.now();
  };

  return { resetInactivity };
}
