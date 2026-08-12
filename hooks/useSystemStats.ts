/**
 * useSystemStats - Hook pour récupérer les statistiques système réelles
 *
 * Appelle l'API backend pour obtenir :
 * - Utilisation CPU en %
 * - Utilisation RAM en GB
 * - Nombre de processus actifs
 *
 * Les données sont rafraîchies toutes les 2 secondes.
 */

import { useState, useEffect } from "react";

/** Interface des statistiques système */
interface SystemStats {
  /** Utilisation CPU en pourcentage (0-100) */
  cpuUsage: number;
  /** Utilisation mémoire en GB (ex: "8.5") */
  memoryUsage: string;
  /** Nombre de processus actifs */
  processes: number;
}

/** URL de l'API backend (configurable via variable d'environnement) */
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Hook pour récupérer et rafraîchir les stats système
 *
 * @returns Objet contenant les stats système actuelles
 *
 * @example
 * ```tsx
 * const { cpuUsage, memoryUsage, processes } = useSystemStats();
 * console.log(`CPU: ${cpuUsage}%`);
 * ```
 */
export const useSystemStats = (): SystemStats => {
  const [stats, setStats] = useState<SystemStats>({
    cpuUsage: 0,
    memoryUsage: "0",
    processes: 0,
  });

  useEffect(() => {
    /**
     * Récupère les stats système depuis l'API backend.
     * Silencieux si le backend n'est pas encore prêt (ERR_CONNECTION_REFUSED).
     */
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/system/stats/light`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          setStats({
            cpuUsage: Math.round(data.data.cpu),
            memoryUsage: data.data.memoryGB.toString(),
            processes: data.data.processes,
          });
        }
      } catch (error: unknown) {
        // Silencer ERR_CONNECTION_REFUSED au démarrage (backend pas encore prêt)
        const msg = error instanceof Error ? error.message : String(error);
        const isConnRefused =
          msg.includes("Failed to fetch") ||
          msg.includes("ERR_CONNECTION_REFUSED") ||
          msg.includes("NetworkError");
        if (!isConnRefused) {
          console.error("Erreur récupération stats système :", error);
        }
        // Garder les dernières valeurs connues pour éviter un clignotement visuel
      }
    };

    // Délai initial de 2 secondes pour laisser le backend démarrer
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const initTimer = setTimeout(() => {
      fetchStats();
      intervalId = setInterval(fetchStats, 2000);
    }, 2000);

    return () => {
      clearTimeout(initTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return stats;
};
