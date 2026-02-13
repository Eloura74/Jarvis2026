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
     * Récupère les stats système depuis l'API backend
     * Utilise l'endpoint /light pour optimiser les performances
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
      } catch (error) {
        // En cas d'erreur (backend offline, etc.), ne pas crasher l'app
        console.error("Erreur récupération stats système :", error);

        // Garder les dernières valeurs connues (ne pas réinitialiser à 0)
        // Cela évite un "clignotement" visuel en cas d'erreur ponctuelle
      }
    };

    // Récupération initiale
    fetchStats();

    // Rafraîchissement automatique toutes les 2 secondes
    const interval = setInterval(fetchStats, 2000);

    // Cleanup : arrêter le polling quand le composant se démonte
    return () => clearInterval(interval);
  }, []);

  return stats;
};
