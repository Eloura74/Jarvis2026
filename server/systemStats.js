/**
 * Module de récupération des statistiques système en temps réel
 * 
 * Fournit les métriques système suivantes :
 * - Utilisation CPU (%)
 * - Utilisation RAM (%)
 * - Activité réseau (octets reçus/envoyés par seconde)
 * - Nombre de processus actifs
 * - Température CPU (si disponible)
 * 
 * Utilise le package 'systeminformation' pour accéder aux données système.
 * 
 * @module systemStats
 */

import si from "systeminformation";
import os from "os";

// ============================================================================
// CACHE DES DONNÉES RÉSEAU
// ============================================================================

/**
 * Cache pour calculer le débit réseau
 * Stocke les valeurs précédentes pour calculer le delta
 */
let previousNetworkStats = null;
let previousNetworkTime = null;

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Calcule le pourcentage d'utilisation de la RAM
 * 
 * @returns Pourcentage d'utilisation de la RAM (0-100)
 */
const getMemoryUsagePercent = () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  return ((usedMem / totalMem) * 100).toFixed(1);
};

/**
 * Calcule la RAM utilisée en GB
 * 
 * @returns RAM utilisée en gigaoctets
 */
const getMemoryUsageGB = () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  return (usedMem / (1024 ** 3)).toFixed(1);
};

/**
 * Calcule le débit réseau en KB/s
 * 
 * Mesure la différence entre deux appels pour obtenir le débit instantané.
 * 
 * @param {Object} currentStats - Statistiques réseau actuelles
 * @returns {Object} Débit réseau rx (download) et tx (upload) en KB/s
 */
const calculateNetworkSpeed = (currentStats) => {
  if (!previousNetworkStats || !previousNetworkTime) {
    // Premier appel : initialiser le cache
    previousNetworkStats = currentStats;
    previousNetworkTime = Date.now();
    return { rx: 0, tx: 0 };
  }

  const currentTime = Date.now();
  const timeDelta = (currentTime - previousNetworkTime) / 1000; // en secondes

  // Calculer le delta d'octets transférés
  const rxDelta = currentStats.rx_bytes - previousNetworkStats.rx_bytes;
  const txDelta = currentStats.tx_bytes - previousNetworkStats.tx_bytes;

  // Calculer le débit en KB/s
  const rxSpeed = (rxDelta / timeDelta / 1024).toFixed(1);
  const txSpeed = (txDelta / timeDelta / 1024).toFixed(1);

  // Mettre à jour le cache
  previousNetworkStats = currentStats;
  previousNetworkTime = currentTime;

  return {
    rx: Math.max(0, parseFloat(rxSpeed)), // Éviter les valeurs négatives
    tx: Math.max(0, parseFloat(txSpeed)),
  };
};

// ============================================================================
// FONCTION PRINCIPALE : RÉCUPÉRATION DES STATS
// ============================================================================

/**
 * Récupère toutes les statistiques système en temps réel
 * 
 * Cette fonction agrège plusieurs sources de données :
 * - CPU : Charge instantanée et moyenne
 * - RAM : Utilisation en % et en GB
 * - Réseau : Débit download/upload
 * - Processus : Nombre de processus actifs
 * - Température : Si capteurs disponibles
 * 
 * @returns {Promise<Object>} Objet contenant toutes les métriques système
 * 
 * @example
 * const stats = await getSystemStats();
 * console.log(`CPU: ${stats.cpu}%`);
 * console.log(`RAM: ${stats.memoryGB} GB (${stats.memoryPercent}%)`);
 */
export const getSystemStats = async () => {
  try {
    // Récupération parallèle de toutes les métriques (optimisation performance)
    const [cpuLoad, processes, networkStats, temperature] = await Promise.all([
      si.currentLoad(),
      si.processes(),
      si.networkStats(),
      si.cpuTemperature().catch(() => ({ main: null })), // Température pas toujours disponible
    ]);

    // ========================================
    // CPU
    // ========================================
    const cpuPercent = cpuLoad.currentLoad.toFixed(1);
    const cpuAverage = cpuLoad.avgLoad || 0;

    // ========================================
    // MÉMOIRE
    // ========================================
    const memoryPercent = getMemoryUsagePercent();
    const memoryGB = getMemoryUsageGB();

    // ========================================
    // RÉSEAU
    // ========================================
    // Utiliser la première interface réseau active
    const activeInterface = networkStats.find((iface) => iface.operstate === "up") || networkStats[0];
    const networkSpeed = calculateNetworkSpeed(activeInterface);

    // ========================================
    // PROCESSUS
    // ========================================
    const processCount = processes.all.length;
    
    // Top 5 processus par utilisation CPU
    const topProcesses = processes.list
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 5)
      .map((p) => ({
        name: p.name,
        cpu: p.cpu.toFixed(1),
        mem: p.mem.toFixed(1),
        pid: p.pid,
      }));

    // ========================================
    // TEMPÉRATURE
    // ========================================
    const cpuTemp = temperature.main || null;

    // ========================================
    // DONNÉES SYSTÈME GÉNÉRALES
    // ========================================
    const systemInfo = {
      platform: os.platform(),
      hostname: os.hostname(),
      uptime: Math.floor(os.uptime() / 3600), // Uptime en heures
      totalMemGB: (os.totalmem() / (1024 ** 3)).toFixed(1),
    };

    // ========================================
    // OBJET DE RETOUR COMPLET
    // ========================================
    return {
      // Métriques principales (affichées dans le HUD)
      cpu: parseFloat(cpuPercent),
      memoryPercent: parseFloat(memoryPercent),
      memoryGB: parseFloat(memoryGB),
      processes: processCount,
      
      // Réseau
      network: {
        download: parseFloat(networkSpeed.rx), // KB/s
        upload: parseFloat(networkSpeed.tx),   // KB/s
        interface: activeInterface.iface,
      },
      
      // Détails CPU
      cpuDetails: {
        average: cpuAverage,
        cores: os.cpus().length,
        temperature: cpuTemp,
      },
      
      // Top processus
      topProcesses,
      
      // Informations système
      system: systemInfo,
      
      // Timestamp
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("❌ Erreur récupération stats système :", error);
    
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      cpu: 0,
      memoryPercent: 0,
      memoryGB: 0,
      processes: 0,
      network: { download: 0, upload: 0, interface: "N/A" },
      cpuDetails: { average: 0, cores: os.cpus().length, temperature: null },
      topProcesses: [],
      system: {
        platform: os.platform(),
        hostname: os.hostname(),
        uptime: 0,
        totalMemGB: (os.totalmem() / (1024 ** 3)).toFixed(1),
      },
      timestamp: Date.now(),
      error: error.message,
    };
  }
};

/**
 * Récupère uniquement les métriques légères (CPU, RAM, Processus)
 * 
 * Version optimisée pour polling fréquent (toutes les 1-2 secondes).
 * Ne récupère pas le réseau ni la température pour économiser les ressources.
 * 
 * @returns {Promise<Object>} Métriques système de base
 */
export const getLightStats = async () => {
  try {
    const [cpuLoad, processes] = await Promise.all([
      si.currentLoad(),
      si.processes(),
    ]);

    return {
      cpu: parseFloat(cpuLoad.currentLoad.toFixed(1)),
      memoryPercent: parseFloat(getMemoryUsagePercent()),
      memoryGB: parseFloat(getMemoryUsageGB()),
      processes: processes.all.length,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("❌ Erreur récupération stats légères :", error);
    return {
      cpu: 0,
      memoryPercent: 0,
      memoryGB: 0,
      processes: 0,
      timestamp: Date.now(),
      error: error.message,
    };
  }
};
