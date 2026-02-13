import { useState, useEffect } from "react";

export interface SystemStats {
  cpuUsage: number;
  memoryUsage: number; // En GB
  memoryTotal: number; // En GB
  networkRx: number; // En MB/s
  networkTx: number; // En MB/s
  temperature: number; // En °C
  processes: number;
  cpuHistory: number[]; // Historique pour le mini-graphique (20 points)
}

/**
 * Hook pour simuler des statistiques système réalistes et dynamiques
 */
export const useSystemStats = () => {
  const [stats, setStats] = useState<SystemStats>({
    cpuUsage: 15,
    memoryUsage: 4.2,
    memoryTotal: 16,
    networkRx: 0.5,
    networkTx: 0.1,
    temperature: 45,
    processes: 124,
    cpuHistory: Array(20).fill(10),
  });

  useEffect(() => {
    const updateStats = () => {
      setStats((prev) => {
        // Simulation CPU : variation autour d'une base, avec des pics occasionnels
        const baseCpu = 25;
        const volatility = Math.random() > 0.9 ? 30 : 5; // Pic soudain
        const newCpu = Math.min(
          100,
          Math.max(5, prev.cpuUsage + (Math.random() - 0.5) * volatility),
        );

        // Simulation Mémoire : variation lente
        const newMem = Math.min(
          prev.memoryTotal,
          Math.max(2, prev.memoryUsage + (Math.random() - 0.5) * 0.1),
        );

        // Simulation Réseau : très volatile
        const newRx = Math.max(0, prev.networkRx + (Math.random() - 0.5) * 2);
        const newTx = Math.max(0, prev.networkTx + (Math.random() - 0.5) * 0.5);

        // Température corrélée au CPU
        const newTemp = 40 + (newCpu / 100) * 30; // 40°C min, 70°C max

        // Historique CPU (FIFO)
        const newHistory = [...prev.cpuHistory.slice(1), newCpu];

        return {
          cpuUsage: Math.round(newCpu),
          memoryUsage: parseFloat(newMem.toFixed(1)),
          memoryTotal: 16,
          networkRx: parseFloat(newRx.toFixed(1)),
          networkTx: parseFloat(newTx.toFixed(1)),
          temperature: Math.round(newTemp),
          processes: Math.max(
            80,
            prev.processes + (Math.random() > 0.5 ? 1 : -1),
          ),
          cpuHistory: newHistory,
        };
      });
    };

    // Mise à jour rapide pour l'effet "Live"
    const interval = setInterval(updateStats, 800);

    return () => clearInterval(interval);
  }, []);

  return stats;
};
