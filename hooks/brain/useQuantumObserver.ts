import { useEffect, useRef } from "react";
import { scanForQuantumLinks, QMSScanResult } from "../../services/qmsService";
import { checkNeuralStatus } from "../../services/geminiService";

interface QuantumObserverProps {
  logs: string[];
  currentTask: string;
  onSuggestion: (suggestion: QMSScanResult) => void;
  isEnabled: boolean;
  executeTool: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<unknown>;
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
  // Guard contre undefined lors du HMR (hot module replacement)
  const safeLogs = logs ?? [];
  // Utiliser le localStorage pour garder trace du dernier scan même après un refresh/HMR
  const lastScanTime = useRef<number>(
    parseInt(localStorage.getItem("jarvis_last_qms_scan") || "0"),
  );
  const lastActionTime = useRef(0);
  useEffect(() => {
    if (lastActionTime.current === 0) lastActionTime.current = Date.now();
  }, []);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scanInterval = 300000; // 5 minutes (Encore plus calme)
  const ghostModeIdleThreshold = 900000; // 15 minutes d'inactivité

  useEffect(() => {
    if (!isEnabled || !logs) {
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

        // 🛑 OPTIMISATION: Si surchargé ou action < 1 min, on skip
        if (isOverloaded || now - lastActionTime.current < 60000) return;

        // 1. Quantum Memory Stitching (Toutes les 10 min au lieu de 5)
        // 🛑 OPTIMISATION: Vérifier si les logs ont changé depuis le dernier scan (TODO plus tard)
        // Pour l'instant on augmente juste l'intervalle drastiquement
        if (now - lastScanTime.current >= 600000) {
          // 10 minutes
          console.log("🌌 [QMS] Neural Observation heartbeat check...");
          try {
            // On ne scanne que si on a au moins 5 logs
            if (safeLogs.length < 5) return;

            const result = await scanForQuantumLinks(
              safeLogs.slice(-10),
              currentTask,
            );
            if (result && result.hasSuggestion) {
              onSuggestion(result);
            }
            // On update le temps de scan MÊME si pas de suggestion pour éviter boucle
            lastScanTime.current = now;
            localStorage.setItem("jarvis_last_qms_scan", now.toString());
          } catch {
            console.warn("QMS Scan paused or failed.");
          }
        }

        // 2. Ghost Mode (Désactivé temporairement pour sauver les quotas)
        /*
        if (now - lastActionTime.current >= ghostModeIdleThreshold) {
           // ...code...
        }
        */
      }, 60000); // Check toutes les 1 minute

      intervalRef.current = timer as unknown as NodeJS.Timeout;
    }, 60000); // 1 minute de pause au démarrage (augmenté)

    return () => {
      clearTimeout(initialDelay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [safeLogs, currentTask, onSuggestion, isEnabled, executeTool]);

  // Exposer une méthode pour reset l'inactivité
  const resetInactivity = () => {
    lastActionTime.current = Date.now();
  };

  return { resetInactivity };
}
