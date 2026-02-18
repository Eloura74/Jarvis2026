/**
 * [DEPRECATED] Service MQTT Bambulab côté frontend
 *
 * ⚠️ NE PLUS UTILISER ⚠️
 * Remplacé par le backend proxy (server/services/bambuMqtt.js)
 * pour éviter les problèmes de WebSocket/TCP dans le navigateur.
 *
 * Ce fichier est conservé uniquement pour éviter de casser les imports
 * existants le temps de la migration complète.
 */

export interface BambuStatus {
  connected: boolean;
  printing: boolean;
  progress: number; // 0-100
  fileName: string;
  temps: {
    bed: number;
    nozzle: number;
  };
  speed: number; // mm/s
  layer: {
    current: number;
    total: number;
  };
  eta: number; // secondes restantes
}

export function initBambuMqtt(
  _ip?: string,
  _accessCode?: string,
  _serial?: string,
): void {
  console.warn(
    "⚠️ initBambuMqtt (frontend) est déprécié. Le backend gère désormais la connexion MQTT.",
  );
}

export function subscribeBambuStatus(
  _callback: (status: BambuStatus) => void,
): () => void {
  console.warn(
    "⚠️ subscribeBambuStatus est déprécié. Utilisez le polling API via usePrinterFleet.",
  );
  return () => {};
}

export function getBambuStatus(): BambuStatus {
  return {
    connected: false,
    printing: false,
    progress: 0,
    fileName: "",
    temps: { bed: 0, nozzle: 0 },
    speed: 0,
    layer: { current: 0, total: 0 },
    eta: 0,
  };
}

export function disconnectBambuMqtt(): void {}
