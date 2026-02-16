/**
 * Workflow Automation Engine pour J.A.R.V.I.S.
 *
 * Détecte automatiquement les patterns de commandes répétées
 * et propose de les automatiser sous forme de workflows.
 *
 * Exemple:
 * 1. User lance souvent: "lance vscode" → "ouvre chrome github" → "lance spotify"
 * 2. JARVIS détecte le pattern (3+ fois)
 * 3. JARVIS propose: "J'ai remarqué ce workflow 'Mode Travail'. L'automatiser ?"
 * 4. User: "oui" → Workflow sauvegardé
 * 5. Prochaine fois: "jarvis, mode travail" → Tout se lance automatiquement
 *
 * @module workflowEngine
 */

import { Workflow } from "../types";

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Nombre minimum de répétitions pour détecter un pattern */
const PATTERN_THRESHOLD = 3;

/** Fenêtre temporelle pour détecter une séquence (15 minutes) */
const SEQUENCE_WINDOW_MS = 15 * 60 * 1000;

/** Clé localStorage pour persister workflows */
const STORAGE_KEY_WORKFLOWS = "jarvis_workflows";
const STORAGE_KEY_HISTORY = "jarvis_command_history";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Historique d'une commande exécutée
 */
interface CommandHistoryEntry {
  /** Nom de la commande (normalisée) */
  command: string;
  /** Tool appelé (search_and_launch_app, control_lights, etc.) */
  tool: string;
  /** Arguments du tool */
  args: any;
  /** Timestamp d'exécution */
  timestamp: number;
}

/**
 * Pattern détecté (séquence répétée)
 */
interface DetectedPattern {
  /** Séquence de commandes (ex: ["vscode", "chrome", "spotify"]) */
  sequence: string[];
  /** Tools correspondants */
  tools: string[];
  /** Nombre de fois détectée */
  count: number;
  /** Dernière détection */
  lastSeen: number;
  /** Nom suggéré (généré auto ou user-provided) */
  suggestedName?: string;
}

// ============================================================================
// STOCKAGE
// ============================================================================

/** Workflows sauvegardés (Map<name, Workflow>) */
const workflows = new Map<string, Workflow>();

/** Historique des 100 dernières commandes */
const commandHistory: CommandHistoryEntry[] = [];

/** Patterns détectés mais pas encore confirmés */
const detectedPatterns = new Map<string, DetectedPattern>();

// =============================================================================
// HISTORIQUE DES COMMANDES
// ============================================================================

/**
 * Enregistre une commande dans l'historique
 * Appeler après chaque exécution successful de tool
 *
 * @param command - Commande utilisateur (normalisée)
 * @param tool - Nom du tool appelé
 * @param args - Arguments du tool
 */
export function recordCommand(command: string, tool: string, args: any): void {
  const entry: CommandHistoryEntry = {
    command,
    tool,
    args,
    timestamp: Date.now(),
  };

  commandHistory.push(entry);

  // Limiter à 100 dernières entrées (performance)
  if (commandHistory.length > 100) {
    commandHistory.shift();
  }

  // Persist dans localStorage
  persistHistory();

  // 🎯 Détecter patterns automatiquement
  detectPatterns();
}

/**
 * Récupère l'historique récent (dernière heure)
 */
export function getRecentHistory(): CommandHistoryEntry[] {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return commandHistory.filter((entry) => entry.timestamp >= oneHourAgo);
}

// ============================================================================
// DÉTECTION DE PATTERNS
// ============================================================================

/**
 * Détecte des séquences répétées dans l'historique
 * Utilise une fenêtre glissante pour identifier workflows potentiels
 */
function detectPatterns(): void {
  const recent = commandHistory.filter(
    (entry) => Date.now() - entry.timestamp < SEQUENCE_WINDOW_MS,
  );

  if (recent.length < 3) return; // Minimum 3 commandes pour un pattern

  // Chercher séquences de 3-5 commandes
  for (
    let seqLength = 3;
    seqLength <= Math.min(5, recent.length);
    seqLength++
  ) {
    const sequences = extractSequences(recent, seqLength);

    // Compter occurrences de chaque séquence
    for (const seq of sequences) {
      const key = seq.map((e) => e.command).join(" → ");
      const existing = detectedPatterns.get(key);

      if (existing) {
        existing.count++;
        existing.lastSeen = Date.now();
      } else {
        detectedPatterns.set(key, {
          sequence: seq.map((e) => e.command),
          tools: seq.map((e) => e.tool),
          count: 1,
          lastSeen: Date.now(),
        });
      }
    }
  }

  // Nettoyer patterns anciens (>1 jour)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, pattern] of detectedPatterns.entries()) {
    if (pattern.lastSeen < oneDayAgo) {
      detectedPatterns.delete(key);
    }
  }
}

/**
 * Extrait toutes les séquences de longueur N depuis l'historique
 */
function extractSequences(
  history: CommandHistoryEntry[],
  length: number,
): CommandHistoryEntry[][] {
  const sequences: CommandHistoryEntry[][] = [];

  for (let i = 0; i <= history.length - length; i++) {
    sequences.push(history.slice(i, i + length));
  }

  return sequences;
}

/**
 * Récupère les patterns détectés qui méritent d'être proposés
 * @returns Patterns avec count >= PATTERN_THRESHOLD
 */
export function getSuggestablePatterns(): DetectedPattern[] {
  return Array.from(detectedPatterns.values())
    .filter((p) => p.count >= PATTERN_THRESHOLD)
    .sort((a, b) => b.count - a.count); // Plus fréquents en premier
}

// ============================================================================
// GESTION DES WORKFLOWS
// ============================================================================

/**
 * Créer un workflow depuis un pattern détecté
 *
 * @param pattern - Pattern détecté à transformer en workflow
 * @param name - Nom donné par l'utilisateur (ex: "Mode Travail")
 * @returns Workflow créé
 */
export function createWorkflowFromPattern(
  pattern: DetectedPattern,
  name: string,
): Workflow {
  const workflow: Workflow = {
    name,
    actions: pattern.sequence,
    triggerCount: 0,
  };

  workflows.set(name.toLowerCase(), workflow);
  persistWorkflows();

  // Supprimer le pattern détecté (maintenant confirmé)
  const key = pattern.sequence.join(" → ");
  detectedPatterns.delete(key);

  console.log(
    `✨ Workflow créé: "${name}" avec ${pattern.sequence.length} actions`,
  );

  return workflow;
}

/**
 * Créer un workflow manuellement (sans pattern)
 *
 * @param name - Nom du workflow
 * @param commands - Liste de commandes en langage naturel
 */
export function createWorkflow(name: string, commands: string[]): Workflow {
  const workflow: Workflow = {
    name,
    actions: commands,
    triggerCount: 0,
  };

  workflows.set(name.toLowerCase(), workflow);
  persistWorkflows();

  console.log(`✨ Workflow manuel créé: "${name}"`);
  return workflow;
}

/**
 * Récupérer un workflow par nom
 *
 * @param name - Nom du workflow (case-insensitive)
 * @returns Workflow ou null si inexistant
 */
export function getWorkflow(name: string): Workflow | null {
  return workflows.get(name.toLowerCase()) || null;
}

/**
 * Lister tous les workflows disponibles
 */
export function listWorkflows(): Workflow[] {
  return Array.from(workflows.values());
}

/**
 * Supprimer un workflow
 *
 * @param name - Nom du workflow à supprimer
 * @returns true si supprimé, false si inexistant
 */
export function deleteWorkflow(name: string): boolean {
  const deleted = workflows.delete(name.toLowerCase());
  if (deleted) {
    persistWorkflows();
    console.log(`🗑️ Workflow supprimé: "${name}"`);
  }
  return deleted;
}

/**
 * Incrémenter le compteur d'utilisation d'un workflow
 */
export function incrementWorkflowTrigger(name: string): void {
  const workflow = workflows.get(name.toLowerCase());
  if (workflow) {
    workflow.triggerCount++;
    persistWorkflows();
  }
}

// ============================================================================
// PERSISTANCE LOCALSTORAGE
// ============================================================================

/**
 * Sauvegarde les workflows dans localStorage
 */
function persistWorkflows(): void {
  try {
    const data = Array.from(workflows.entries());
    localStorage.setItem(STORAGE_KEY_WORKFLOWS, JSON.stringify(data));
  } catch (e) {
    console.error("Erreur persistence workflows:", e);
  }
}

/**
 * Restaure les workflows depuis localStorage
 */
export function restoreWorkflows(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_WORKFLOWS);
    if (!stored) return;

    const data: [string, Workflow][] = JSON.parse(stored);
    workflows.clear();

    for (const [key, workflow] of data) {
      workflows.set(key, workflow);
    }

    console.log(`♻️ Workflows restaurés: ${workflows.size} entrées`);
  } catch (e) {
    console.error("Erreur restauration workflows:", e);
  }
}

/**
 * Sauvegarde l'historique dans localStorage
 */
function persistHistory(): void {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(commandHistory));
  } catch (e) {
    console.error("Erreur persistence history:", e);
  }
}

/**
 * Restaure l'historique depuis localStorage
 */
export function restoreHistory(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!stored) return;

    const data: CommandHistoryEntry[] = JSON.parse(stored);
    commandHistory.length = 0;
    commandHistory.push(...data.slice(-100)); // Dernières 100

    console.log(`♻️ Historique restauré: ${commandHistory.length} entrées`);
  } catch (e) {
    console.error("Erreur restauration history:", e);
  }
}

// ============================================================================
// INITIALISATION
// ============================================================================

// Auto-restore au chargement du module
restoreWorkflows();
restoreHistory();
