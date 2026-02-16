/**
 * Unified Overlay Manager pour J.A.R.V.I.S.
 *
 * Gère de manière centralisée tous les overlays holographiques
 * (status imprimantes, météo, images, vidéos, etc.)
 *
 * Fonctionnalités :
 * - Empilage intelligent (max 3 overlays simultanés)
 * - Mode exclusif (ferme tous les autres avant d'afficher)
 * - Animations de transition (fade in/out)
 * - Auto-close après timeout (optionnel)
 * - Position management (éviter superposition)
 *
 * @module overlayManager
 */

import { StatusOverlayData } from "../types/app.types";

// ============================================================================
// TYPES
// ============================================================================

export type OverlayType = "printer" | "weather" | "image" | "video" | "generic";

export interface OverlayConfig {
  /** ID unique de l'overlay */
  id: string;
  /** Type d'overlay */
  type: OverlayType;
  /** Données à afficher */
  data: StatusOverlayData | any;
  /** Fermer automatiquement après N ms (optionnel) */
  autoCloseMs?: number;
  /** Position suggérée (optionnel, sinon auto) */
  position?: { x: number; y: number };
  /** Mode exclusif : ferme tous les autres overlays */
  exclusive?: boolean;
}

export interface ActiveOverlay extends OverlayConfig {
  /** Timestamp de création */
  createdAt: number;
  /** Timeout ID pour auto-close */
  timeoutId?: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Nombre maximum d'overlays simultanés */
const MAX_CONCURRENT_OVERLAYS = 3;

/** Espacement vertical entre overlays (pixels) */
const OVERLAY_VERTICAL_SPACING = 20;

/** Position initiale des overlays */
const INITIAL_POSITION = { x: 100, y: 100 };

// ============================================================================
// STATE
// ============================================================================

/** Overlays actuellement affichés */
const activeOverlays = new Map<string, ActiveOverlay>();

/** Callbacks pour notifier les composants React */
type OverlayCallback = (overlays: ActiveOverlay[]) => void;
const subscribers: Set<OverlayCallback> = new Set();

// ============================================================================
// GESTION DES OVERLAYS
// ============================================================================

/**
 * Affiche un overlay
 *
 * @param config - Configuration de l'overlay
 * @returns ID de l'overlay créé
 */
export function showOverlay(config: OverlayConfig): string {
  // Mode exclusif : fermer tous les autres
  if (config.exclusive) {
    closeAllOverlays();
  }

  // Limite atteinte : fermer le plus ancien
  if (activeOverlays.size >= MAX_CONCURRENT_OVERLAYS && !config.exclusive) {
    closeOldestOverlay();
  }

  // Calculer position automatique si non spécifiée
  const position = config.position || calculateNextPosition();

  // Créer l'overlay
  const overlay: ActiveOverlay = {
    ...config,
    createdAt: Date.now(),
    position,
  };

  // Auto-close si configuré
  if (config.autoCloseMs) {
    overlay.timeoutId = window.setTimeout(() => {
      closeOverlay(config.id);
    }, config.autoCloseMs);
  }

  activeOverlays.set(config.id, overlay);
  notifySubscribers();

  console.log(`🌌 Overlay affiché: ${config.id} (${config.type})`);

  return config.id;
}

/**
 * Remplace un overlay existant par un nouveau
 * Utile pour mettre à jour sans flash visuel
 *
 * @param oldId - ID de l'overlay à remplacer
 * @param newConfig - Configuration du nouvel overlay
 */
export function replaceOverlay(oldId: string, newConfig: OverlayConfig): void {
  const oldOverlay = activeOverlays.get(oldId);

  if (oldOverlay) {
    // Hériter de la position de l'ancien
    if (!newConfig.position) {
      newConfig.position = oldOverlay.position;
    }

    // Fermer l'ancien
    closeOverlay(oldId);
  }

  // Afficher le nouveau (avec un micro-délai pour l'animation)
  setTimeout(() => showOverlay(newConfig), 100);
}

/**
 * Ferme un overlay spécifique
 *
 * @param id - ID de l'overlay à fermer
 * @returns true si fermé, false si inexistant
 */
export function closeOverlay(id: string): boolean {
  const overlay = activeOverlays.get(id);

  if (!overlay) return false;

  // Annuler auto-close
  if (overlay.timeoutId) {
    clearTimeout(overlay.timeoutId);
  }

  activeOverlays.delete(id);
  notifySubscribers();

  console.log(`✖️ Overlay fermé: ${id}`);

  return true;
}

/**
 * Ferme tous les overlays
 */
export function closeAllOverlays(): void {
  // Annuler tous les timeouts
  for (const overlay of activeOverlays.values()) {
    if (overlay.timeoutId) {
      clearTimeout(overlay.timeoutId);
    }
  }

  activeOverlays.clear();
  notifySubscribers();

  console.log("✖️ Tous les overlays fermés");
}

/**
 * Ferme le plus ancien overlay (LRU)
 */
function closeOldestOverlay(): void {
  if (activeOverlays.size === 0) return;

  // Trouver le plus ancien par timestamp
  let oldest: [string, ActiveOverlay] | null = null;

  for (const entry of activeOverlays.entries()) {
    if (!oldest || entry[1].createdAt < oldest[1].createdAt) {
      oldest = entry;
    }
  }

  if (oldest) {
    closeOverlay(oldest[0]);
  }
}

/**
 * Récupère tous les overlays actifs
 */
export function getActiveOverlays(): ActiveOverlay[] {
  return Array.from(activeOverlays.values());
}

/**
 * Récupère un overlay spécifique
 */
export function getOverlay(id: string): ActiveOverlay | null {
  return activeOverlays.get(id) || null;
}

/**
 * Vérifie si un overlay est affiché
 */
export function isOverlayActive(id: string): boolean {
  return activeOverlays.has(id);
}

// ============================================================================
// POSITIONNEMENT AUTOMATIQUE
// ============================================================================

/**
 * Calcule la position du prochain overlay pour éviter superposition
 */
function calculateNextPosition(): { x: number; y: number } {
  const count = activeOverlays.size;

  // Empiler verticalement avec offset
  return {
    x: INITIAL_POSITION.x,
    y: INITIAL_POSITION.y + count * OVERLAY_VERTICAL_SPACING,
  };
}

// ============================================================================
// SYSTÈME DE SOUSCRIPTION (REACT)
// ============================================================================

/**
 * S'abonner aux changements d'overlays
 * Utilisé par les composants React pour réagir aux mises à jour
 *
 * @param callback - Fonction appelée à chaque changement
 * @returns Fonction de désinscription
 */
export function subscribeToOverlays(callback: OverlayCallback): () => void {
  subscribers.add(callback);

  // Envoyer état initial
  callback(getActiveOverlays());

  // Retourner fonction de cleanup
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Notifie tous les subscribers d'un changement
 */
function notifySubscribers(): void {
  const overlays = getActiveOverlays();
  subscribers.forEach((callback) => callback(overlays));
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Compte les overlays par type
 */
export function getOverlayCountByType(type: OverlayType): number {
  return Array.from(activeOverlays.values()).filter((o) => o.type === type)
    .length;
}

/**
 * Ferme tous les overlays d'un type spécifique
 */
export function closeOverlaysByType(type: OverlayType): void {
  const toClose: string[] = [];

  for (const [id, overlay] of activeOverlays.entries()) {
    if (overlay.type === type) {
      toClose.push(id);
    }
  }

  toClose.forEach((id) => closeOverlay(id));
}
