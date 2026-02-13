/**
 * Hook personnalisé pour la boucle d'autonomie du système
 *
 * Simule le comportement autonome de J.A.R.V.I.S. en effectuant
 * périodiquement des tâches de maintenance fictives (logs).
 *
 * Cela donne l'illusion que l'IA n'est pas passive mais
 * travaille constamment en arrière-plan.
 *
 * @param options - Configuration de la boucle autonome
 * @param options.enabled - Active ou désactive la boucle
 * @param options.intervalMs - Intervalle entre chaque action (défaut: 15000ms = 15s)
 * @param options.onAction - Callback appelé avec le message d'action autonome
 * @param options.probability - Probabilité d'exécution à chaque tick (0-1, défaut: 0.2)
 *
 * @example
 * ```typescript
 * useAutonomy({
 *   enabled: status === SystemStatus.IDLE,
 *   intervalMs: 15000,
 *   onAction: (message) => addLog(message, 'OMNI', 'info')
 * });
 * ```
 */

import { useEffect, useRef } from "react";

interface UseAutonomyOptions {
  /** Active ou désactive la boucle autonome */
  enabled: boolean;
  /** Intervalle en millisecondes entre chaque tick (défaut: 15000) */
  intervalMs?: number;
  /** Callback appelé avec le message d'action autonome */
  onAction: (message: string) => void;
  /** Probabilité d'exécution à chaque tick (0-1, défaut: 0.2) */
  probability?: number;
}

/**
 * Messages d'actions autonomes possibles
 *
 * Ces messages simulent diverses tâches de maintenance qu'une
 * IA avancée pourrait effectuer en arrière-plan.
 */
const AUTONOMY_ACTIONS = [
  "Optimisation des chemins neuronaux en cours...",
  "Scan du réseau local pour anomalies...",
  "Compression des journaux de mémoire...",
  "Mise à jour des définitions de sécurité...",
  "Défragmentation du cache neural...",
  "Synchronisation avec les serveurs Stark...",
  "Analyse prédictive des patterns utilisateur...",
  "Calibration des capteurs système...",
  "Nettoyage des fichiers temporaires...",
  "Vérification de l'intégrité des modules...",
];

export function useAutonomy({
  enabled,
  intervalMs = 15000,
  onAction,
  probability = 0.2,
}: UseAutonomyOptions): void {
  // Utilisation d'une ref pour éviter de recréer l'interval à chaque render
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Si la boucle n'est pas activée, ne rien faire
    if (!enabled) {
      // Nettoyage de l'interval existant si désactivation
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Fonction exécutée à chaque tick de l'interval
    const autonomyTick = () => {
      // Génération d'un nombre aléatoire entre 0 et 1
      const roll = Math.random();

      // Exécution de l'action seulement si le roll est inférieur à la probabilité
      // Par défaut (probability = 0.2), cela donne 20% de chances à chaque tick
      if (roll < probability) {
        // Sélection aléatoire d'une action dans la liste
        const randomAction =
          AUTONOMY_ACTIONS[Math.floor(Math.random() * AUTONOMY_ACTIONS.length)];

        // Appel du callback avec l'action sélectionnée
        onAction(randomAction);
      }
    };

    // Démarrage de l'interval
    intervalRef.current = window.setInterval(autonomyTick, intervalMs);

    // console.log(
    //   `🤖 Boucle autonomie démarrée (${intervalMs}ms, ${probability * 100}% chance)`,
    // );

    // Cleanup : arrêt de l'interval au démontage ou changement de dépendances
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        // console.log("🤖 Boucle autonomie arrêtée");
      }
    };
  }, [enabled, intervalMs, onAction, probability]);

  // Ce hook ne retourne rien, il agit uniquement via le callback onAction
}
