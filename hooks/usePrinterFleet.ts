/**
 * Hook React pour le Printer Fleet Manager
 *
 * Vue temps réel du parc d'imprimantes 3D
 */

import { useState, useEffect } from "react";
import {
  getFleetStatus,
  getFleetSummary,
  getQueue,
  addToQueue,
  removeFromQueue,
  getFilamentStats,
  checkFilamentAlert,
  type PrinterStatus,
  type PrintJob,
  type FilamentStats,
} from "../services/printerFleet";

interface FleetHookReturn {
  /** Status de toutes les imprimantes */
  printers: PrinterStatus[];
  /** Résumé du parc */
  summary: {
    total: number;
    idle: number;
    printing: number;
    offline: number;
    error: number;
  };
  /** File d'attente */
  queue: PrintJob[];
  /** Stats filament */
  filament: FilamentStats;
  /** Alerte filament */
  filamentAlert: { alert: boolean; message?: string };
  /** Ajouter job à la queue */
  addJob: (job: Omit<PrintJob, "id" | "submittedAt">) => string;
  /** Retirer job */
  removeJob: (jobId: string) => boolean;
}

export function usePrinterFleet(
  totalFilamentStock: number = 1000,
): FleetHookReturn {
  const [printers, setPrinters] = useState<PrinterStatus[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    idle: 0,
    printing: 0,
    offline: 0,
    error: 0,
  });
  const [queue, setQueue] = useState<PrintJob[]>([]);
  const [filament, setFilament] = useState<FilamentStats>({
    totalUsed: 0,
    byPrinter: {},
  });
  const [filamentAlert, setFilamentAlert] = useState<{
    alert: boolean;
    message?: string;
  }>({
    alert: false,
  });

  // Rafraîchir toutes les 2 secondes
  useEffect(() => {
    const refresh = () => {
      setPrinters(getFleetStatus());
      setSummary(getFleetSummary());
      setQueue(getQueue());
      setFilament(getFilamentStats());
      setFilamentAlert(checkFilamentAlert(totalFilamentStock));
    };

    refresh();
    const interval = setInterval(refresh, 2000);

    return () => clearInterval(interval);
  }, [totalFilamentStock]);

  const addJob = (job: Omit<PrintJob, "id" | "submittedAt">) => {
    const id = addToQueue(job);
    setQueue(getQueue());
    return id;
  };

  const removeJob = (jobId: string) => {
    const success = removeFromQueue(jobId);
    if (success) {
      setQueue(getQueue());
    }
    return success;
  };

  return {
    printers,
    summary,
    queue,
    filament,
    filamentAlert,
    addJob,
    removeJob,
  };
}
