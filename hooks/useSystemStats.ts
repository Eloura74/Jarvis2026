import { useState, useEffect } from "react";

export interface SystemStats {
  cpuUsage: number;
  memoryUsage: number; // En GB (ou % si relatif)
  memoryTotal: number; // En GB
  networkRx: number; // En MB/s
  networkTx: number; // En MB/s
  temperature: number; // En °C
  processes: number;
  cpuHistory: number[]; // Historique pour le mini-graphique (20 points)
}

/**
 * Hook hybride : Réel (si dispo) + Simulation réaliste
 */
export const useSystemStats = () => {
  const [stats, setStats] = useState<SystemStats>({
    cpuUsage: 10,
    memoryUsage: 0,
    memoryTotal: 16,
    networkRx: 0,
    networkTx: 0,
    temperature: 40,
    processes: 80,
    cpuHistory: Array(20).fill(10),
  });

  useEffect(() => {
    // Détection des capacités du navigateur
    const nav = navigator as any;
    const navConnection =
      nav.connection || nav.mozConnection || nav.webkitConnection;
    const perf = performance as any;
    const perfMemory = perf.memory;
    // const cpuCores = navigator.hardwareConcurrency || 4; // Unused for now

    let lastFrameTime = performance.now();
    // let frameCount = 0; // Unused
    let estimatedLoad = 10;

    const updateStats = () => {
      setStats((prev) => {
        const now = performance.now();
        const deltaTime = now - lastFrameTime;
        lastFrameTime = now;

        // 1. CPU LOAD ESTIMATION (Basé sur le lag de la main loop)
        // Idéalement à 60fps, deltaTime ~ 16.6ms.
        // Si deltaTime monte, la charge monte.
        const targetFrameTime = 16.6;
        const load = Math.min(
          100,
          Math.max(
            5,
            ((deltaTime - targetFrameTime) / targetFrameTime) * 100 + 10,
          ),
        ); // Base 10% + lag

        // Lissage (Moyenne mobile)
        estimatedLoad = estimatedLoad * 0.8 + load * 0.2;

        // 2. MEMORY (Real if Chrome)
        let memUsage = prev.memoryUsage;
        let memTotal = prev.memoryTotal;

        if (perfMemory) {
          // Conversion bytes -> GB
          memUsage = parseFloat(
            (perfMemory.usedJSHeapSize / (1024 * 1024 * 1024)).toFixed(2),
          );
          memTotal = Math.round(
            perfMemory.jsHeapSizeLimit / (1024 * 1024 * 1024),
          );
        } else {
          // Fallback Simulation
          memUsage = Math.min(
            16,
            Math.max(2, prev.memoryUsage + (Math.random() - 0.5) * 0.05),
          );
          memTotal = 16;
        }

        // 3. NETWORK (Real approximation if supported)
        let netRx = prev.networkRx;
        if (navConnection) {
          // downlink est en Mbps -> conversion MB/s approx
          const mbps = navConnection.downlink || 10;
          netRx = mbps / 8;
          // Variation légère pour faire "vivant"
          netRx += (Math.random() - 0.5) * 0.1;
        } else {
          netRx = Math.max(0, prev.networkRx + (Math.random() - 0.5) * 1);
        }

        // Tx souvent non dispo, simulation proportionnelle
        const netTx = netRx * 0.1 + Math.random() * 0.05;

        // 4. PROCESSES (Mocké car inaccessible, mais stable)
        // On peut utiliser le nombre de noeuds DOM comme proxy amusant ? Non, restons sur une valeur "OS-like"
        const procBase = 140;

        // 5. TEMPERATURE (Fake, corrélée au CPU)
        const temp = 40 + (estimatedLoad / 100) * 40;

        // Historique
        const newHistory = [
          ...prev.cpuHistory.slice(1),
          Math.round(estimatedLoad),
        ];

        return {
          cpuUsage: Math.round(estimatedLoad),
          memoryUsage: memUsage,
          memoryTotal: memTotal,
          networkRx: parseFloat(Math.max(0, netRx).toFixed(1)),
          networkTx: parseFloat(Math.max(0, netTx).toFixed(1)),
          temperature: Math.round(temp),
          processes: procBase + Math.floor(estimatedLoad / 5), // Plus de load = plus de process (fake logic)
          cpuHistory: newHistory,
        };
      });
    };

    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, []);

  return stats;
};
