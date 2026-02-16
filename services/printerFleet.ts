/**
 * Printer Fleet Manager pour J.A.R.V.I.S.
 *
 * Gère un parc d'imprimantes 3D avec :
 * - Vue unifiée de toutes les imprimantes
 * - File d'attente intelligente des impressions
 * - Tracking du filament consommé
 * - Time-lapse automatique (TODO: intégration caméra)
 * - Statistiques globales
 *
 * @module printerFleet
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PrinterConfig {
  /** Identifiant unique */
  id: string;
  /** Nom d'affichage */
  name: string;
  /** IP Moonraker/Klipper */
  ip: string;
  /** URL webcam (optionnel) */
  webcamUrl?: string;
  /** Volume de build (mm³) */
  buildVolume: { x: number; y: number; z: number };
  /** Vitesse max (mm/s) */
  maxSpeed: number;
}

export interface PrinterStatus {
  /** Config de base */
  config: PrinterConfig;
  /** État actuel */
  status: "idle" | "printing" | "paused" | "error" | "offline";
  /** Job en cours (si printing) */
  currentJob?: {
    fileName: string;
    progress: number; // 0-100
    eta: number; // Secondes restantes
    startTime: number; // Timestamp
    filamentUsed: number; // Grammes
  };
  /** Températures */
  temps: {
    nozzle: number;
    bed: number;
  };
  /** Dernière mise à jour */
  lastUpdate: number;
}

export interface PrintJob {
  /** ID unique du job */
  id: string;
  /** Nom du fichier G-code */
  fileName: string;
  /** Temps estimé (secondes) */
  estimatedTime: number;
  /** Filament estimé (grammes) */
  estimatedFilament: number;
  /** Priorité (1-10, 10 = urgent) */
  priority: number;
  /** Timestamp de soumission */
  submittedAt: number;
  /** Imprimante assignée (si déjà assigné) */
  assignedPrinter?: string;
}

export interface FilamentStats {
  /** Total consommé (grammes) */
  totalUsed: number;
  /** Par imprimante */
  byPrinter: Record<string, number>;
  /** Par couleur/type (TODO: future) */
  byType?: Record<string, number>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Configuration des imprimantes du parc */
const printerConfigs: PrinterConfig[] = [
  {
    id: "vz330",
    name: "VZ330 CoreXY",
    ip: "192.168.1.130",
    webcamUrl: "http://192.168.1.130/webcam/?action=stream",
    buildVolume: { x: 330, y: 330, z: 400 },
    maxSpeed: 500,
  },
  {
    id: "switchwire",
    name: "Switchwire",
    ip: "192.168.1.128",
    buildVolume: { x: 250, y: 210, z: 200 },
    maxSpeed: 300,
  },
  {
    id: "bambu_a1mini",
    name: "Bambulab A1 mini",
    ip: "", // Pas de Moonraker, utilise Bambu Connect
    buildVolume: { x: 180, y: 180, z: 180 },
    maxSpeed: 500,
  },
];

// ============================================================================
// STATE
// ============================================================================

/** État actuel des imprimantes (mis à jour par WebSocket) */
const fleetStatus = new Map<string, PrinterStatus>();

/** File d'attente d'impressions */
const printQueue: PrintJob[] = [];

/** Historique de consommation filament */
const filamentHistory: FilamentStats = {
  totalUsed: 0,
  byPrinter: {},
};

// ============================================================================
// GESTION DU PARC
// ============================================================================

/**
 * Initialise le parc d'imprimantes
 */
export function initFleet(): void {
  for (const config of printerConfigs) {
    fleetStatus.set(config.id, {
      config,
      status: "offline",
      temps: { nozzle: 0, bed: 0 },
      lastUpdate: 0,
    });

    filamentHistory.byPrinter[config.id] = 0;
  }

  console.log(`🖨️ Parc initialisé: ${printerConfigs.length} imprimantes`);
}

/**
 * Met à jour le statut d'une imprimante
 * Appelé par le hook Klipper/Moonraker
 */
export function updatePrinterStatus(
  printerId: string,
  status: Partial<PrinterStatus>,
): void {
  const current = fleetStatus.get(printerId);

  if (!current) {
    console.warn(`⚠️ Imprimante inconnue: ${printerId}`);
    return;
  }

  // Merge avec état existant
  fleetStatus.set(printerId, {
    ...current,
    ...status,
    lastUpdate: Date.now(),
  });

  // Tracking filament si job en cours
  if (status.currentJob?.filamentUsed) {
    const delta =
      status.currentJob.filamentUsed - (current.currentJob?.filamentUsed || 0);
    if (delta > 0) {
      filamentHistory.totalUsed += delta;
      filamentHistory.byPrinter[printerId] =
        (filamentHistory.byPrinter[printerId] || 0) + delta;
    }
  }

  // Auto-assign prochain job si imprimante devient idle
  if (status.status === "idle" && printQueue.length > 0) {
    assignNextJob(printerId);
  }
}

/**
 * Récupère le statut global du parc
 */
export function getFleetStatus(): PrinterStatus[] {
  return Array.from(fleetStatus.values());
}

/**
 * Récupère le statut d'une imprimante spécifique
 */
export function getPrinterStatus(printerId: string): PrinterStatus | null {
  return fleetStatus.get(printerId) || null;
}

/**
 * Compte les imprimantes par état
 */
export function getFleetSummary(): {
  total: number;
  idle: number;
  printing: number;
  offline: number;
  error: number;
} {
  const statuses = Array.from(fleetStatus.values());

  return {
    total: statuses.length,
    idle: statuses.filter((s) => s.status === "idle").length,
    printing: statuses.filter((s) => s.status === "printing").length,
    offline: statuses.filter((s) => s.status === "offline").length,
    error: statuses.filter((s) => s.status === "error").length,
  };
}

// ============================================================================
// GESTION DE LA FILE D'ATTENTE
// ============================================================================

/**
 * Ajoute un job à la file d'attente
 *
 * @param job - Job à ajouter
 * @returns ID du job
 */
export function addToQueue(job: Omit<PrintJob, "id" | "submittedAt">): string {
  const fullJob: PrintJob = {
    ...job,
    id: `job_${Date.now()}`,
    submittedAt: Date.now(),
  };

  printQueue.push(fullJob);

  // Trier par priorité descendante
  printQueue.sort((a, b) => b.priority - a.priority);

  console.log(
    `📥 Job ajouté: ${fullJob.fileName} (priorité ${fullJob.priority})`,
  );

  // Essayer d'assigner immédiatement
  tryAutoAssign();

  return fullJob.id;
}

/**
 * Récupère la file d'attente
 */
export function getQueue(): PrintJob[] {
  return [...printQueue];
}

/**
 * Supprime un job de la file
 */
export function removeFromQueue(jobId: string): boolean {
  const index = printQueue.findIndex((j) => j.id === jobId);

  if (index === -1) return false;

  printQueue.splice(index, 1);
  console.log(`🗑️ Job retiré: ${jobId}`);

  return true;
}

/**
 * Récupère la prochaine imprimante disponible
 */
export function getNextAvailable(): PrinterStatus | null {
  const idle = Array.from(fleetStatus.values()).filter(
    (p) => p.status === "idle",
  );

  if (idle.length === 0) return null;

  // Retourner la moins utilisée récemment
  return idle.sort((a, b) => a.lastUpdate - b.lastUpdate)[0];
}

/**
 * Assigne le prochain job à une imprimante spécifique
 */
function assignNextJob(printerId: string): void {
  if (printQueue.length === 0) return;

  const job = printQueue[0]; // Plus haute priorité
  job.assignedPrinter = printerId;

  printQueue.shift(); // Retirer de la queue

  console.log(`✅ Job assigné: ${job.fileName} → ${printerId}`);

  // TODO: Déclencher impression via Moonraker API
}

/**
 * Essaie d'assigner automatiquement les jobs en attente
 */
function tryAutoAssign(): void {
  while (printQueue.length > 0) {
    const nextPrinter = getNextAvailable();
    if (!nextPrinter) break;

    assignNextJob(nextPrinter.config.id);
  }
}

// ============================================================================
// STATISTIQUES FILAMENT
// ============================================================================

/**
 * Récupère les stats de consommation filament
 */
export function getFilamentStats(): FilamentStats {
  return { ...filamentHistory };
}

/**
 * Estime le stock restant (TODO: intégration capteurs)
 */
export function estimateFilamentRemaining(totalStock: number): {
  remaining: number;
  percentUsed: number;
  daysLeft: number; // Basé sur moyenne
} {
  const remaining = totalStock - filamentHistory.totalUsed;
  const percentUsed = (filamentHistory.totalUsed / totalStock) * 100;

  // Moyenne daily usage (last 7 days)
  const avgDaily = filamentHistory.totalUsed / 7; // Placeholder
  const daysLeft = remaining / Math.max(avgDaily, 1);

  return { remaining, percentUsed, daysLeft };
}

/**
 * Alerte si stock faible
 */
export function checkFilamentAlert(totalStock: number): {
  alert: boolean;
  message?: string;
} {
  const { percentUsed, daysLeft } = estimateFilamentRemaining(totalStock);

  if (percentUsed > 90) {
    return {
      alert: true,
      message: `⚠️ Stock critique: ${(100 - percentUsed).toFixed(0)}% restant`,
    };
  }

  if (daysLeft < 2) {
    return {
      alert: true,
      message: `⚠️ Stock faible: environ ${daysLeft.toFixed(1)} jours restants`,
    };
  }

  return { alert: false };
}

// ============================================================================
// INITIALISATION
// ============================================================================

initFleet();
