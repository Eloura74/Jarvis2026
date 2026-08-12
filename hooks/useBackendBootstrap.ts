import { useEffect, useState, useRef } from "react";
import { checkBackendStatus } from "../services/backendApi";

import { LogEntry } from "../types";

type AddLogFn = (
  message: string,
  source?: LogEntry["source"],
  type?: LogEntry["type"],
) => void;

/**
 * Hook de bootstrap backend avec retry exponentiel.
 * Tente de contacter le backend jusqu'à ce qu'il soit disponible.
 * Retourne `isBackendOnline` que les composants peuvent utiliser pour gater leurs appels.
 *
 * Délais : 500ms → 1s → 2s → 4s → 8s (max) jusqu'à succès
 */
export function useBackendBootstrap({ addLog }: { addLog: AddLogFn }) {
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const attempt = async () => {
      if (cancelled) return;

      const isOnline = await checkBackendStatus();

      if (cancelled) return;

      if (isOnline) {
        setIsBackendOnline(true);
        addLog("✅ Backend connecté (port 3001)", "SYSTEM", "success");
        console.log("✅ Backend online - Ready to execute commands");
        return;
      }

      attemptRef.current += 1;

      // Première tentative uniquement → afficher le message d'erreur
      if (attemptRef.current === 1) {
        addLog(
          "⚠️ BACKEND OFFLINE - Tentatives de reconnexion en cours...",
          "SYSTEM",
          "warning",
        );
        console.warn(
          "\n═══════════════════════════════════════\n" +
          "  ⚠️  BACKEND NON ACCESSIBLE (port 3001)\n" +
          "  Reconnexion automatique en cours...\n" +
          "═══════════════════════════════════════",
        );
      }

      // Délai exponentiel : 500ms, 1s, 2s, 4s, 8s (max)
      const delayMs = Math.min(500 * Math.pow(2, attemptRef.current - 1), 8000);
      timerRef.current = setTimeout(attempt, delayMs);
    };

    attempt();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [addLog]);

  return { isBackendOnline };
}
