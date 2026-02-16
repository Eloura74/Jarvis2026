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
  updatePrinterStatus,
  type PrinterStatus,
  type PrintJob,
  type FilamentStats,
} from "../services/printerFleet";
import { useKlipperMoonraker } from "./useKlipperMoonraker";
// import {
//   subscribeBambuStatus,
//   getBambuStatus,
// } from "../services/bambulabsMqtt";

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

  // 🔌 Connexion Moonraker VZ330
  const vz330 = useKlipperMoonraker("192.168.1.130");

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

  // ⚡ Mettre à jour le status VZ330 depuis Moonraker
  useEffect(() => {
    if (vz330.isConnected && vz330.data) {
      const klipperData = vz330.data;
      const isPrinting = !klipperData.title.includes("IDLE");

      // Mapper les données Klipper vers PrinterStatus
      updatePrinterStatus("vz330", {
        status: isPrinting ? "printing" : "idle",
        temps: {
          nozzle: klipperData.nozzleTemp || 0,
          nozzleTarget: klipperData.nozzleTarget || 0,
          bed: klipperData.bedTemp || 0,
          bedTarget: klipperData.bedTarget || 0,
        },
        currentJob: isPrinting
          ? {
              fileName: klipperData.title,
              progress: parseFloat(
                String(
                  klipperData.stats.find((s) => s.label.includes("Progress"))
                    ?.value || "0",
                ),
              ),
              eta: klipperData.eta || 0,
              startTime: Date.now(),
              filamentUsed: 0,
              // Nouvelles données enrichies
              thumbnail: klipperData.thumbnail || undefined,
              printDuration: klipperData.printDuration || 0,
              totalDuration:
                (klipperData.printDuration || 0) + (klipperData.eta || 0),
              currentLayer: klipperData.currentLayer || 0,
              totalLayers: klipperData.totalLayers || 0,
              speed: klipperData.speed || 0,
            }
          : undefined,
      });
    } else if (!vz330.isConnected && !vz330.isRetrying) {
      // Si déconnecté et pas en retry, marquer offline
      updatePrinterStatus("vz330", {
        status: "offline",
      });
    }
  }, [vz330.isConnected, vz330.data, vz330.isRetrying]);

  // 🔌 Subscription MQTT Bambu A1 mini (temps réel)
  // 🔌 Polling Bambu A1 mini (via Backend Proxy)
  useEffect(() => {
    const fetchBambuStatus = async () => {
      try {
        // Direct call to backend to bypass Vite proxy (which points to HA)
        const res = await fetch("http://localhost:3001/api/bambu/status");
        if (!res.ok) return;

        const json = await res.json();
        if (json.success && json.data) {
          const bambuStatus = json.data;

          if (!bambuStatus.connected) {
            updatePrinterStatus("bambu_a1mini", {
              status: "offline",
            });
            return;
          }

          updatePrinterStatus("bambu_a1mini", {
            status: bambuStatus.printing ? "printing" : "idle",
            temps: {
              nozzle: bambuStatus.temps.nozzle,
              nozzleTarget: 0,
              bed: bambuStatus.temps.bed,
              bedTarget: 0,
            },
            currentJob: bambuStatus.printing
              ? {
                  fileName: bambuStatus.fileName || "Job A1 mini",
                  progress: bambuStatus.progress,
                  eta: bambuStatus.eta,
                  startTime: Date.now(), // Approximation
                  filamentUsed: 0,
                  thumbnail: undefined,
                  printDuration: 0, // Pas dispo via simple status
                  totalDuration: bambuStatus.eta,
                  currentLayer: bambuStatus.layer.current,
                  totalLayers: bambuStatus.layer.total,
                  speed: bambuStatus.speed,
                }
              : undefined,
          });
        }
      } catch (error) {
        // Silent fail (offline or backend down)
        // console.debug("Bambu polling failed", error);
      }
    };

    // Poll immédiat puis toutes les 3s
    fetchBambuStatus();
    const interval = setInterval(fetchBambuStatus, 3000);

    return () => clearInterval(interval);
  }, []);

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
