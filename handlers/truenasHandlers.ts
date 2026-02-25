/**
 * Handlers pour TrueNAS
 * - État pools de stockage
 * - Santé disques (SMART)
 * - Services actifs/inactifs
 */

import type { HandlerContext } from "../types/app.types";
import { SystemStatus } from "../types";

const API_BASE = "http://localhost:3001";

/**
 * Handler statut stockage TrueNAS
 * Récupère état des pools et espace disponible
 */
export const handleStorageStatus = async (
  _args: Record<string, never>,
  ctx: HandlerContext,
) => {
  const { addLog, setStatus, speak } = ctx;

  addLog("Récupération statut stockage TrueNAS...", "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/truenas/pools`);
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    const pools = data.pools;

    // Construire réponse vocale
    let message = "";
    
    if (pools.length === 0) {
      message = "Aucun pool de stockage trouvé, Monsieur.";
    } else {
      const poolsInfo = pools.map((pool: any) => {
        const totalTB = (pool.size.total / (1024 ** 4)).toFixed(1);
        const usedPercent = pool.size.usedPercent;
        const status = pool.healthy ? "sain" : "attention";
        
        return `${pool.name} : ${usedPercent}% utilisé sur ${totalTB} téraoctets, statut ${status}`;
      });

      message = `État du stockage TrueNAS : ${poolsInfo.join(". ")}.`;
      
      // Alerte si >90% utilisé
      const fullPools = pools.filter((p: any) => p.size.usedPercent > 90);
      if (fullPools.length > 0) {
        message += ` Attention, ${fullPools.map((p: any) => p.name).join(" et ")} presque plein.`;
      }
    }

    speak(message);
    addLog(`Pools TrueNAS: ${pools.length} pool(s)`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    // TODO: Afficher overlay HUD TrueNAS
    return {
      status: "success",
      data: pools,
      message,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    addLog(`Erreur TrueNAS: ${errorMsg}`, "SYSTEM", "error");
    speak("Impossible de récupérer le statut du stockage, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
    
    return {
      status: "error",
      message: errorMsg,
    };
  }
};

/**
 * Handler santé disques TrueNAS
 * Récupère état SMART et températures des disques
 */
export const handleDiskHealth = async (
  _args: Record<string, never>,
  ctx: HandlerContext,
) => {
  const { addLog, setStatus, speak } = ctx;

  addLog("Récupération santé disques TrueNAS...", "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/truenas/disks`);
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    const disks = data.disks;

    // Analyser santé disques
    const unhealthyDisks = disks.filter((d: any) => !d.healthy);
    const hotDisks = disks.filter((d: any) => d.temperature > 50);

    let message = `${disks.length} disque${disks.length > 1 ? 's' : ''} dans le NAS. `;

    if (unhealthyDisks.length > 0) {
      message += `Attention : ${unhealthyDisks.length} disque${unhealthyDisks.length > 1 ? 's' : ''} en mauvaise santé. `;
    } else {
      message += "Tous les disques sont en bonne santé. ";
    }

    if (hotDisks.length > 0) {
      const hotList = hotDisks.map((d: any) => `${d.name} à ${d.temperature} degrés`).join(", ");
      message += `Disques chauds : ${hotList}.`;
    }

    speak(message);
    addLog(`Disques TrueNAS: ${disks.length} disque(s), ${unhealthyDisks.length} problème(s)`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    // TODO: Afficher overlay HUD santé disques
    return {
      status: "success",
      data: disks,
      message,
      alerts: {
        unhealthy: unhealthyDisks.length,
        hot: hotDisks.length,
      },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    addLog(`Erreur santé disques: ${errorMsg}`, "SYSTEM", "error");
    speak("Impossible de récupérer la santé des disques, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
    
    return {
      status: "error",
      message: errorMsg,
    };
  }
};

/**
 * Handler services TrueNAS
 * Récupère état des services (SMB, NFS, etc.)
 */
export const handleTrueNASServices = async (
  _args: Record<string, never>,
  ctx: HandlerContext,
) => {
  const { addLog, setStatus, speak } = ctx;

  addLog("Récupération services TrueNAS...", "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/truenas/services`);
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    const services = data.services;

    const running = services.filter((s: any) => s.running);
    const stopped = services.filter((s: any) => !s.running && s.enabled);

    let message = `${running.length} service${running.length > 1 ? 's' : ''} actif${running.length > 1 ? 's' : ''} sur TrueNAS`;

    if (stopped.length > 0) {
      message += `. Attention : ${stopped.map((s: any) => s.name).join(", ")} arrêté${stopped.length > 1 ? 's' : ''}`;
    }

    message += ", Monsieur.";

    speak(message);
    addLog(`Services TrueNAS: ${running.length}/${services.length} actifs`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      data: services,
      message,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    addLog(`Erreur services TrueNAS: ${errorMsg}`, "SYSTEM", "error");
    speak("Impossible de récupérer les services TrueNAS, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
    
    return {
      status: "error",
      message: errorMsg,
    };
  }
};
