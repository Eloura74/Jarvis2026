/**
 * Hook personnalisé pour gérer l'état du système OMNI
 *
 * Centralise la gestion du SystemStatus et fournit des méthodes
 * pour les transitions d'état avec validation et helpers.
 *
 * @param initialStatus - État initial du système (défaut: IDLE)
 * @returns Objet avec l'état actuel et méthodes de manipulation
 *
 * @example
 * ```typescript
 * const { status, setStatus, resetToIdle, isProcessing } = useSystemStatus();
 *
 * setStatus(SystemStatus.LISTENING);
 * // ... traitement
 * resetToIdle(2000); // Retour à IDLE après 2s
 * ```
 */

import { useState, useCallback } from "react";
import { SystemStatus } from "../types";

interface UseSystemStatusReturn {
  /** État actuel du système */
  status: SystemStatus;
  /** Définit un nouveau statut système */
  setStatus: (newStatus: SystemStatus) => void;
  /** Réinitialise le statut à IDLE après un délai */
  resetToIdle: (delayMs?: number) => void;
  /** Indique si le système est en traitement (non IDLE/LISTENING) */
  isProcessing: boolean;
  /** Indique si le système est en écoute */
  isListening: boolean;
  /** Indique si le système est au repos */
  isIdle: boolean;
}

export function useSystemStatus(
  initialStatus: SystemStatus = SystemStatus.IDLE,
): UseSystemStatusReturn {
  const [status, setStatusInternal] = useState<SystemStatus>(initialStatus);

  /**
   * Définit le statut système avec validation
   *
   * @param newStatus - Nouveau statut à appliquer
   */
  const setStatus = useCallback(
    (newStatus: SystemStatus) => {
      // Validation : le statut doit être une valeur valide de l'enum
      if (!Object.values(SystemStatus).includes(newStatus)) {
        console.warn(`⚠️ Statut système invalide: ${newStatus}`);
        return;
      }

      // Log du changement d'état pour debug
      console.log(`🔄 Changement état système: ${status} → ${newStatus}`);

      setStatusInternal(newStatus);
    },
    [status],
  );

  /**
   * Réinitialise le statut à IDLE après un délai optionnel
   *
   * Utile pour revenir automatiquement à l'état de repos après
   * une opération (ex: affichage erreur pendant 2s puis retour IDLE).
   *
   * @param delayMs - Délai en millisecondes avant réinitialisation (défaut: 0)
   */
  const resetToIdle = useCallback(
    (delayMs: number = 0) => {
      if (delayMs === 0) {
        setStatus(SystemStatus.IDLE);
      } else {
        setTimeout(() => setStatus(SystemStatus.IDLE), delayMs);
      }
    },
    [setStatus],
  );

  // Helpers booléens pour faciliter les conditions
  const isProcessing =
    status !== SystemStatus.IDLE && status !== SystemStatus.LISTENING;
  const isListening = status === SystemStatus.LISTENING;
  const isIdle = status === SystemStatus.IDLE;

  return {
    status,
    setStatus,
    resetToIdle,
    isProcessing,
    isListening,
    isIdle,
  };
}
