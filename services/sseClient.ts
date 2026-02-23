/**
 * sseClient.ts — Singleton SSE pour J.A.R.V.I.S. (B1)
 *
 * Problème résolu : useJarvisBrain ET useProactiveEvents ouvraient chacun
 * une connexion EventSource vers /api/events → double annonce vocale.
 *
 * Solution : Un seul EventSource partagé avec pattern pub/sub.
 * Les abonnés s'enregistrent via subscribe() et reçoivent les événements.
 * La connexion est ouverte au premier abonné et fermée au dernier désabonnement.
 *
 * Avantages :
 * - Une seule connexion réseau permanente
 * - Reconnexion automatique gérée centralement
 * - Aucune duplication d'événements
 */

export interface SSEPayload {
  type: string;
  payload?: unknown;
  messageToSpeak?: string;
}

type SSEListener = (payload: SSEPayload) => void;

// ============================================================================
// ÉTAT INTERNE DU SINGLETON
// ============================================================================

let eventSource: EventSource | null = null;
const listeners = new Set<SSEListener>();
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const SSE_URL = "http://localhost:3001/api/events";
const RECONNECT_DELAY_MS = 3000;

// ============================================================================
// GESTION DE LA CONNEXION
// ============================================================================

/**
 * Ouvre la connexion SSE si elle n'est pas déjà active.
 * Appelé automatiquement au premier subscribe().
 */
function connect(): void {
  if (eventSource && eventSource.readyState !== EventSource.CLOSED) return;

  console.log(`🔌 [SSE Singleton] Connexion à ${SSE_URL}`);
  eventSource = new EventSource(SSE_URL);

  eventSource.onopen = () => {
    console.log("✅ [SSE Singleton] Connecté");
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  eventSource.onmessage = (event: MessageEvent) => {
    try {
      const payload: SSEPayload = JSON.parse(event.data);
      // Diffuser à tous les abonnés actifs
      listeners.forEach((listener) => listener(payload));
    } catch (err) {
      console.error("❌ [SSE Singleton] Erreur parsing:", err);
    }
  };

  eventSource.onerror = () => {
    console.warn("⚠️ [SSE Singleton] Erreur — reconnexion dans", RECONNECT_DELAY_MS, "ms");
    eventSource?.close();
    eventSource = null;

    // Reconnexion automatique si des abonnés sont encore actifs
    if (listeners.size > 0) {
      reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
    }
  };
}

/**
 * Ferme la connexion SSE si aucun abonné n'est actif.
 */
function disconnectIfIdle(): void {
  if (listeners.size === 0) {
    console.log("🔌 [SSE Singleton] Fermeture (aucun abonné)");
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    eventSource?.close();
    eventSource = null;
  }
}

// ============================================================================
// API PUBLIQUE
// ============================================================================

/**
 * S'abonne aux événements SSE.
 * Ouvre la connexion si c'est le premier abonné.
 *
 * @param listener - Fonction appelée à chaque événement SSE reçu
 * @returns Fonction de désabonnement à appeler dans le cleanup (useEffect return)
 */
export function subscribe(listener: SSEListener): () => void {
  listeners.add(listener);
  connect(); // Ouvre la connexion si nécessaire

  return () => {
    listeners.delete(listener);
    disconnectIfIdle();
  };
}

/**
 * Retourne l'état actuel de la connexion SSE (pour debug/monitoring).
 */
export function getSSEStatus(): "connecting" | "open" | "closed" | "none" {
  if (!eventSource) return "none";
  switch (eventSource.readyState) {
    case EventSource.CONNECTING: return "connecting";
    case EventSource.OPEN: return "open";
    case EventSource.CLOSED: return "closed";
    default: return "none";
  }
}
