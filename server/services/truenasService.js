/**
 * Service TrueNAS API
 * - État pools de stockage
 * - Espace disponible
 * - Santé disques (SMART)
 * - Services actifs/inactifs
 */

/**
 * Récupère l'état des pools de stockage TrueNAS
 * 
 * @returns {Promise<Object>} État des pools
 */
export async function getPoolsStatus() {
  const TRUENAS_URL = process.env.TRUENAS_URL || "http://192.168.1.100";
  const TRUENAS_API_KEY = process.env.TRUENAS_API_KEY;

  if (!TRUENAS_API_KEY) {
    throw new Error("TRUENAS_API_KEY manquante dans .env");
  }

  try {
    const response = await fetch(`${TRUENAS_URL}/api/v2.0/pool`, {
      headers: {
        "Authorization": `Bearer ${TRUENAS_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`TrueNAS API error: ${response.status}`);
    }

    const pools = await response.json();

    const poolsStatus = pools.map(pool => ({
      name: pool.name,
      status: pool.status,
      healthy: pool.healthy,
      size: {
        total: pool.size,
        used: pool.allocated,
        available: pool.free,
        usedPercent: Math.round((pool.allocated / pool.size) * 100),
      },
      topology: pool.topology,
    }));

    console.log(`💾 [TrueNAS] ${poolsStatus.length} pool(s) récupéré(s)`);
    return poolsStatus;
  } catch (error) {
    console.error("❌ [TrueNAS] Erreur pools:", error.message);
    throw error;
  }
}

/**
 * Récupère la santé des disques (SMART)
 * 
 * @returns {Promise<Array>} Santé des disques
 */
export async function getDisksHealth() {
  const TRUENAS_URL = process.env.TRUENAS_URL || "http://192.168.1.100";
  const TRUENAS_API_KEY = process.env.TRUENAS_API_KEY;

  if (!TRUENAS_API_KEY) {
    throw new Error("TRUENAS_API_KEY manquante dans .env");
  }

  try {
    const response = await fetch(`${TRUENAS_URL}/api/v2.0/disk`, {
      headers: {
        "Authorization": `Bearer ${TRUENAS_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`TrueNAS API error: ${response.status}`);
    }

    const disks = await response.json();

    const disksHealth = disks.map(disk => ({
      name: disk.name,
      serial: disk.serial,
      model: disk.model,
      size: disk.size,
      temperature: disk.temperature,
      smartStatus: disk.smart_enabled ? "enabled" : "disabled",
      healthy: !disk.smart_critical_warning,
      type: disk.type, // HDD, SSD
    }));

    console.log(`💿 [TrueNAS] ${disksHealth.length} disque(s) récupéré(s)`);
    return disksHealth;
  } catch (error) {
    console.error("❌ [TrueNAS] Erreur disques:", error.message);
    throw error;
  }
}

/**
 * Récupère l'état des services TrueNAS
 * 
 * @returns {Promise<Array>} État des services
 */
export async function getServicesStatus() {
  const TRUENAS_URL = process.env.TRUENAS_URL || "http://192.168.1.100";
  const TRUENAS_API_KEY = process.env.TRUENAS_API_KEY;

  if (!TRUENAS_API_KEY) {
    throw new Error("TRUENAS_API_KEY manquante dans .env");
  }

  try {
    const response = await fetch(`${TRUENAS_URL}/api/v2.0/service`, {
      headers: {
        "Authorization": `Bearer ${TRUENAS_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`TrueNAS API error: ${response.status}`);
    }

    const services = await response.json();

    const servicesStatus = services.map(service => ({
      name: service.service,
      state: service.state, // RUNNING, STOPPED
      enabled: service.enable,
      running: service.state === "RUNNING",
    }));

    console.log(`⚙️ [TrueNAS] ${servicesStatus.length} service(s) récupéré(s)`);
    return servicesStatus;
  } catch (error) {
    console.error("❌ [TrueNAS] Erreur services:", error.message);
    throw error;
  }
}

/**
 * Récupère les statistiques système TrueNAS
 * 
 * @returns {Promise<Object>} Statistiques système
 */
export async function getSystemStats() {
  const TRUENAS_URL = process.env.TRUENAS_URL || "http://192.168.1.100";
  const TRUENAS_API_KEY = process.env.TRUENAS_API_KEY;

  if (!TRUENAS_API_KEY) {
    throw new Error("TRUENAS_API_KEY manquante dans .env");
  }

  try {
    const response = await fetch(`${TRUENAS_URL}/api/v2.0/system/info`, {
      headers: {
        "Authorization": `Bearer ${TRUENAS_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`TrueNAS API error: ${response.status}`);
    }

    const info = await response.json();

    const stats = {
      hostname: info.hostname,
      version: info.version,
      uptime: info.uptime_seconds,
      loadAverage: info.loadavg,
      cpuModel: info.cpu_model,
      physicalMemory: info.physmem,
    };

    console.log(`📊 [TrueNAS] Stats système récupérées`);
    return stats;
  } catch (error) {
    console.error("❌ [TrueNAS] Erreur stats système:", error.message);
    throw error;
  }
}
