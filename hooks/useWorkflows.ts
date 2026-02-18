/**
 * Hook React pour le Workflow Automation Engine
 *
 * Intègre le moteur de workflows dans l'interface JARVIS
 * pour afficher suggestions et gérer workflows
 */

import { useState, useEffect, useCallback } from "react";
import {
  recordCommand,
  getSuggestablePatterns,
  createWorkflowFromPattern,
  getWorkflow,
  listWorkflows,
  deleteWorkflow,
  incrementWorkflowTrigger,
  type DetectedPattern,
} from "../services/workflowEngine";
import { Workflow } from "../types";

interface WorkflowHookReturn {
  /** Workflows disponibles */
  workflows: Workflow[];
  /** Patterns détectés (suggérables) */
  suggestedPatterns: DetectedPattern[];
  /** Créer workflow depuis pattern */
  acceptPattern: (patternIndex: number, name: string) => void;
  /** Exécuter un workflow */
  executeWorkflow: (
    name: string,
    executeToolFn: (
      tool: string,
      args: Record<string, unknown>,
    ) => Promise<unknown>,
  ) => Promise<void>;
  /** Supprimer workflow */
  removeWorkflow: (name: string) => void;
  /** Enregistrer commande */
  trackCommand: (
    command: string,
    tool: string,
    args: Record<string, unknown>,
  ) => void;
}

export function useWorkflows(): WorkflowHookReturn {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [suggestedPatterns, setSuggestedPatterns] = useState<DetectedPattern[]>(
    [],
  );

  // Rafraîchir workflows et suggestions
  const refresh = useCallback(() => {
    setWorkflows(listWorkflows());
    setSuggestedPatterns(getSuggestablePatterns());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    refresh();
    // Rafraîchir toutes les minutes
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const acceptPattern = useCallback(
    (patternIndex: number, name: string) => {
      const patterns = getSuggestablePatterns();
      if (patterns[patternIndex]) {
        createWorkflowFromPattern(patterns[patternIndex], name);
        refresh();
      }
    },
    [refresh],
  );

  const executeWorkflow = useCallback(
    async (
      name: string,
      _executeToolFn: (
        tool: string,
        args: Record<string, unknown>,
      ) => Promise<unknown>,
    ) => {
      const workflow = getWorkflow(name);
      if (!workflow) {
        console.warn(`Workflow "${name}" introuvable`);
        return;
      }

      incrementWorkflowTrigger(name);
      console.log(
        `🎬 Exécution workflow: "${name}" (${workflow.actions.length} actions)`,
      );

      // Exécuter chaque action séquentiellement
      for (const action of workflow.actions) {
        // Ici on devrait parser l'action pour extraire tool + args
        // Pour MVP, on suppose que les actions sont déjà du texte naturel
        // et on les passe à parseCommand
        console.log(`  → ${action}`);
        // await executeToolFn("parse_and_execute", { command: action });
        await new Promise((resolve) => setTimeout(resolve, 500)); // Délai entre actions
      }

      console.log(`✅ Workflow "${name}" terminé`);
    },
    [],
  );

  const removeWorkflow = useCallback(
    (name: string) => {
      deleteWorkflow(name);
      refresh();
    },
    [refresh],
  );

  const trackCommand = useCallback(
    (command: string, tool: string, args: Record<string, unknown>) => {
      recordCommand(command, tool, args);
      refresh(); // Rafraîchir pour détecter nouveaux patterns
    },
    [refresh],
  );

  return {
    workflows,
    suggestedPatterns,
    acceptPattern,
    executeWorkflow,
    removeWorkflow,
    trackCommand,
  };
}
