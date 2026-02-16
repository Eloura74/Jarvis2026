import { useState, useEffect, useRef, useCallback } from "react";
import { StatusOverlayData } from "../types/app.types";

// Configuration par défaut
const RECONNECT_INTERVAL = 3000;
const MAX_RETRY_ATTEMPTS = 3; // Maximum de tentatives de reconnexion
const BACKOFF_MULTIPLIER = 2; // Multiplicateur pour exponential backoff

interface KlipperState {
  isConnected: boolean;
  data: StatusOverlayData | null;
  error: string | null;
  retryCount: number; // 🎯 Compteur de tentatives
  isRetrying: boolean; // 🎯 État de reconnexion en cours
}

/**
 * Hook personnalisé pour interagir avec Moonraker via WebSocket
 * Permet un monitoring temps réel sans surcharge réseau
 */
export const useKlipperMoonraker = (printerIp?: string, webcamUrl?: string) => {
  const [status, setStatus] = useState<KlipperState>({
    isConnected: false,
    data: null,
    error: null,
    retryCount: 0,
    isRetrying: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const klipperDataRef = useRef<any>({});

  // Formattage du temps (secondes -> HH:MM:SS ou MM:SS)
  const formatTime = (seconds: number) => {
    if (!seconds) return "--:--";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Transformation des données Klipper vers le format HUD J.A.R.V.I.S.
  const mapKlipperToOverlay = useCallback(
    (rawData: any): StatusOverlayData => {
      const printStats = rawData.print_stats || {};
      const extruder = rawData.extruder || {};
      const heaterBed = rawData.heater_bed || {};
      const displayStatus = rawData.display_status || {};

      const progress = (displayStatus.progress || 0) * 100;
      const isPrinting = printStats.state === "printing";

      return {
        id: `klipper-live-${printerIp}`,
        title: printStats.filename || "IDLE - READY",
        type: "printer",
        lastUpdate: new Date().toLocaleTimeString(),
        image: webcamUrl || "/vzbot_330_render.png",
        // Nouveau - Données enrichies
        thumbnail: displayStatus.thumbnails?.[0]?.relative_path || null,
        nozzleTemp: extruder.temperature || 0,
        nozzleTarget: extruder.target || 0,
        bedTemp: heaterBed.temperature || 0,
        bedTarget: heaterBed.target || 0,
        currentLayer: displayStatus.layer_num || 0,
        totalLayers: displayStatus.total_layer_num || 0,
        speed: printStats.speed || 0,
        printDuration: printStats.print_duration || 0,
        eta: printStats.print_time_left || 0,
        stats: [
          {
            label: "Buse (Nozzle)",
            value: extruder.temperature ? extruder.temperature.toFixed(1) : "0",
            unit: "°C",
            progress:
              extruder.target > 0
                ? (extruder.temperature / extruder.target) * 100
                : 0,
            status: extruder.temperature > 50 ? "warning" : "normal",
          },
          {
            label: "Plateau (Bed)",
            value: heaterBed.temperature
              ? heaterBed.temperature.toFixed(1)
              : "0",
            unit: "°C",
            progress:
              heaterBed.target > 0
                ? (heaterBed.temperature / heaterBed.target) * 100
                : 0,
            status: heaterBed.temperature > 50 ? "warning" : "normal",
          },
          {
            label: "Progression",
            value: progress.toFixed(1),
            unit: "%",
            progress: progress,
            status: "normal",
          },
          {
            label: "Statut / Temps",
            value: isPrinting
              ? formatTime(printStats.print_duration || 0)
              : printStats.state?.toUpperCase() || "READY",
            status: isPrinting ? "normal" : "warning",
          },
        ],
      };
    },
    [printerIp, webcamUrl],
  );

  const connect = useCallback(() => {
    if (!printerIp || wsRef.current) return;

    try {
      const url = `ws://${printerIp}/websocket`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        // 🎯 Reset retry counter on successful connection
        setStatus((prev) => ({
          ...prev,
          isConnected: true,
          error: null,
          retryCount: 0,
          isRetrying: false,
        }));

        // Souscription aux objets Klipper via Moonraker JSON-RPC
        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            method: "printer.objects.subscribe",
            params: {
              objects: {
                print_stats: null,
                display_status: null,
                extruder: null,
                heater_bed: null,
              },
            },
            id: 1,
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // État complet initial
          if (message.id === 1 && message.result?.status) {
            klipperDataRef.current = {
              ...klipperDataRef.current,
              ...message.result.status,
            };
            setStatus((prev) => ({
              ...prev,
              data: mapKlipperToOverlay(klipperDataRef.current),
            }));
          }

          // Mises à jour incrémentales
          if (
            message.method === "notify_status_update" &&
            message.params?.[0]
          ) {
            const updates = message.params[0];
            Object.keys(updates).forEach((key) => {
              klipperDataRef.current[key] = {
                ...klipperDataRef.current[key],
                ...updates[key],
              };
            });
            setStatus((prev) => ({
              ...prev,
              data: mapKlipperToOverlay(klipperDataRef.current),
            }));
          }
        } catch (e) {
          console.error("Klipper WS Parse Error", e);
        }
      };

      ws.onclose = () => {
        wsRef.current = null;

        setStatus((prev) => {
          const newRetryCount = prev.retryCount + 1;

          // 🎯 Arrêter les tentatives après MAX_RETRY_ATTEMPTS
          if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
            return {
              ...prev,
              isConnected: false,
              isRetrying: false,
              retryCount: newRetryCount,
              error: `Impossible de se connecter après ${MAX_RETRY_ATTEMPTS} tentatives. Imprimante éteinte ou IP incorrecte.`,
            };
          }

          // 🎯 Exponential backoff: 3s, 6s, 12s
          const backoffDelay =
            RECONNECT_INTERVAL *
            Math.pow(BACKOFF_MULTIPLIER, newRetryCount - 1);

          retryTimeoutRef.current = window.setTimeout(connect, backoffDelay);

          return {
            ...prev,
            isConnected: false,
            isRetrying: true,
            retryCount: newRetryCount,
            error: `Tentative ${newRetryCount}/${MAX_RETRY_ATTEMPTS}... (prochaine dans ${backoffDelay / 1000}s)`,
          };
        });
      };

      ws.onerror = () => ws.close();
    } catch (e) {
      console.error("Klipper WS Connection Error", e);
      setStatus((prev) => ({
        ...prev,
        error: "Erreur de connexion WebSocket",
      }));
    }
  }, [printerIp, mapKlipperToOverlay]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [connect]);

  return status;
};
