import { useState, useEffect, useRef, useCallback } from "react";
import { StatusOverlayData } from "../types/app.types";

// Configuration par défaut
const RECONNECT_INTERVAL = 3000;
const MAX_RETRY_ATTEMPTS = 3; // Maximum de tentatives de reconnexion
const BACKOFF_MULTIPLIER = 2; // Multiplicateur pour exponential backoff

interface KlipperHookState {
  isConnected: boolean;
  data: StatusOverlayData | null;
  error: string | null;
  retryCount: number;
  isRetrying: boolean;
}

// Interfaces locales pour le typage WebSocket
interface KlipperWSMessage {
  print_stats?: {
    state?: string;
    filename?: string;
    total_layer_num?: number;
    print_duration?: number;
    speed?: number; // Added
    print_time_left?: number; // Added
    info?: {
      total_layer?: number;
      current_layer?: number;
    };
  };
  display_status?: {
    progress?: number;
    message?: string;
    layer_num?: number; // Added
    total_layer_num?: number; // Added
  };
  heater_bed?: {
    temperature?: number;
    target?: number;
  };
  extruder?: {
    temperature?: number;
    target?: number;
  };
  metadata?: {
    thumbnails?: Array<{
      relative_path: string;
      width: number;
      height: number;
    }>;
  };
  virtual_sdcard?: {
    progress?: number;
  };
  gcode_move?: {
    speed_factor?: number;
    speed?: number;
  };
  toolhead?: {
    max_velocity?: number;
    max_accel?: number;
  };
}

/**
 * Hook personnalisé pour interagir avec Moonraker via WebSocket
 * Permet un monitoring temps réel sans surcharge réseau
 */
export const useKlipperMoonraker = (printerIp?: string, webcamUrl?: string) => {
  const [status, setStatus] = useState<KlipperHookState>({
    isConnected: false,
    data: null,
    error: null,
    retryCount: 0,
    isRetrying: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const klipperDataRef = useRef<Record<string, unknown>>({});

  // Formattage du temps (secondes -> HH:MM:SS ou MM:SS)
  const formatTime = (seconds: number) => {
    if (!seconds) return "--:--";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Interfaces locales pour le typage

  // Transformation des données Klipper vers le format HUD J.A.R.V.I.S.
  const mapKlipperToOverlay = useCallback(
    (rawData: Record<string, unknown>): StatusOverlayData => {
      const data = rawData as KlipperWSMessage;
      const printStats = data.print_stats;
      const extruder = data.extruder;
      const heaterBed = data.heater_bed;
      const displayStatus = data.display_status;

      const progress = (displayStatus?.progress || 0) * 100;
      const isPrinting = printStats?.state === "printing";

      return {
        id: `klipper-live-${printerIp}`,
        title: printStats?.filename || "IDLE - READY",
        type: "printer",
        lastUpdate: new Date().toLocaleTimeString(),
        image: webcamUrl || "/vzbot_330_render.png",
        // Nouveau - Données enrichies
        thumbnail: data.metadata?.thumbnails?.[0]?.relative_path || null,
        nozzleTemp: extruder?.temperature || 0,
        nozzleTarget: extruder?.target || 0,
        bedTemp: heaterBed?.temperature || 0,
        bedTarget: heaterBed?.target || 0,
        currentLayer: displayStatus?.layer_num || 0,
        totalLayers: displayStatus?.total_layer_num || 0,
        speed: printStats?.speed || 0,
        printDuration: printStats?.print_duration || 0,
        eta: printStats?.print_time_left || 0,
        stats: [
          {
            label: "Buse (Nozzle)",
            value: extruder?.temperature
              ? extruder.temperature.toFixed(1)
              : "0",
            unit: "°C",
            progress:
              (extruder?.target || 0) > 0
                ? ((extruder?.temperature || 0) / (extruder?.target || 1)) * 100
                : 0,
            status: (extruder?.temperature || 0) > 50 ? "warning" : "normal",
          },
          {
            label: "Plateau (Bed)",
            value: heaterBed?.temperature
              ? heaterBed.temperature.toFixed(1)
              : "0",
            unit: "°C",
            progress:
              (heaterBed?.target || 0) > 0
                ? ((heaterBed?.temperature || 0) / (heaterBed?.target || 1)) *
                  100
                : 0,
            status: (heaterBed?.temperature || 0) > 50 ? "warning" : "normal",
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
              ? formatTime(printStats?.print_duration || 0)
              : printStats?.state?.toUpperCase() || "READY",
            status: isPrinting ? "normal" : "warning",
          },
        ],
      };
    },
    [printerIp, webcamUrl],
  );

  useEffect(() => {
    if (!printerIp) return;

    let ws: WebSocket | null = null;
    let retryTimeout: number | null = null;
    let isActive = true; // Pour éviter les updates si le composant est démonté

    const connect = () => {
      if (!isActive) return;
      // Si déjà un socket ouvert, on ne fait rien (sauf si c'est une reconnexion forcée qui aurait clean avant)
      if (ws) return;

      try {
        const url = `ws://${printerIp}/websocket`;
        ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isActive) return;
          // 🎯 Reset retry counter on successful connection
          setStatus((prev) => ({
            ...prev,
            isConnected: true,
            error: null,
            retryCount: 0,
            isRetrying: false,
          }));

          // Souscription aux objets Klipper via Moonraker JSON-RPC
          ws?.send(
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
          if (!isActive) return;
          try {
            const message = JSON.parse(event.data);

            // État complet initial
            if (message.id === 1 && message.result?.status) {
              klipperDataRef.current = {
                ...klipperDataRef.current,
                ...(message.result.status as Record<string, unknown>),
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
                  ...(klipperDataRef.current[key] as object),
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
          if (!isActive) return;
          ws = null;
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

            // Planifier la reconnexion
            retryTimeout = window.setTimeout(connect, backoffDelay);

            return {
              ...prev,
              isConnected: false,
              isRetrying: true,
              retryCount: newRetryCount,
              error: `Tentative ${newRetryCount}/${MAX_RETRY_ATTEMPTS}... (prochaine dans ${backoffDelay / 1000}s)`,
            };
          });
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch (e) {
        if (!isActive) return;
        console.error("Klipper WS Connection Error", e);
        setStatus((prev) => ({
          ...prev,
          error: "Erreur de connexion WebSocket",
        }));
      }
    };

    connect();

    // Cleanup
    return () => {
      isActive = false;
      if (ws) {
        ws.close();
        ws = null;
      }
      wsRef.current = null;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [printerIp, mapKlipperToOverlay]);

  return status;
};
