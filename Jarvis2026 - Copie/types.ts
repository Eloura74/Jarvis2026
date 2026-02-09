/**
 * Définitions de types TypeScript pour J.A.R.V.I.S.
 *
 * Ce fichier centralise tous les types et interfaces utilisés dans l'application :
 * - SystemStatus : États possibles du système
 * - LogEntry : Format des entrées de logs
 * - TimeSeriesData : Données de monitoring système
 * - OmniDecision : Réponse structurée de Gemini AI
 * - AppMemory : Mémoire des applications lancées
 * - Workflow : Séquences de commandes mémorisées
 *
 * @module types
 */

// ============================================================================
// ÉTATS SYSTÈME
// ============================================================================

/**
 * Enum des états possibles du système J.A.R.V.I.S.
 *
 * Ces états contrôlent le comportement visuel et fonctionnel de l'interface :
 * - Couleurs des particules (cyan en IDLE, rouge en ERROR)
 * - Animation des particules (vitesse multipliée en mode actif)
 * - Disponibilité de la reconnaissance vocale
 */
export enum SystemStatus {
  IDLE = "IDLE", // En attente de commande
  LISTENING = "LISTENING", // Écoute vocale active (microphone)
  PROCESSING = "PROCESSING", // Traitement de la requête (appel Gemini)
  SEARCHING = "SEARCHING", // Recherche d'application dans le système
  EXECUTING = "EXECUTING", // Exécution d'une commande système
  ORGANIZING = "ORGANIZING", // Organisation de fichiers
  NETWORKING = "NETWORKING", // Opération réseau en cours
  ERROR = "ERROR", // Erreur rencontrée (affichage rouge)
  TRAINING = "TRAINING", // Apprentissage/analyse
  SPEAKING = "SPEAKING", // Synthèse vocale en cours
}

// ============================================================================
// LOGS SYSTÈME
// ============================================================================

/**
 * Format d'une entrée de log dans le terminal J.A.R.V.I.S.
 *
 * Chaque log est affiché dans le panneau latéral avec :
 * - Horodatage (HH:MM:SS)
 * - Source (KERNEL, SYSTEM, USER, OMNI, VOICE)
 * - Message descriptif
 * - Type visuel (couleur : info=gris, success=cyan, warning=jaune, error=rouge)
 */
export interface LogEntry {
  id: string; // Identifiant unique (pour React keys)
  timestamp: string; // ISO 8601 (ex: "2026-02-01T00:42:00.000Z")
  source: "SYSTEM" | "USER" | "OMNI" | "KERNEL" | "VOICE"; // Origine du log
  message: string; // Message descriptif en anglais
  type: "info" | "success" | "warning" | "error"; // Type visuel (affecte la couleur)
}

// ============================================================================
// MÉTRIQUES SYSTÈME (HUD)
// ============================================================================

/**
 * Données de monitoring temps réel pour le HUD
 *
 * Ces données sont affichées dans le HUD inférieur sous forme de graphiques
 * et de métriques numériques. Les valeurs sont entre 0 et 100 (pourcentages).
 */
export interface TimeSeriesData {
  time: string; // Label temporel (ex: "14:32:15")
  cpu: number; // Utilisation CPU (0-100%)
  memory: number; // Utilisation mémoire RAM (0-100%)
  network: number; // Activité réseau (0-100%)
  neural: number; // Activité IA/Neural Core (0-100%, fictif)
}

// ============================================================================
// DÉCISIONS IA (GEMINI)
// ============================================================================

/**
 * Format de réponse structurée de Gemini AI
 *
 * Ce type représente la décision prise par Gemini suite à une commande :
 * - TOOL_CALL : Gemini veut exécuter un ou plusieurs outils (function calling)
 * - TEXT_RESPONSE : Gemini retourne une réponse conversationnelle
 * - ERROR : Une erreur s'est produite lors de l'appel API
 *
 * @example
 * ```typescript
 * // Commande simple
 * const decision: OmniDecision = {
 *   type: "TOOL_CALL",
 *   toolCalls: [{ name: "search_and_launch_app", args: { appName: "chrome" } }],
 *   confidence: 0.99
 * };
 *
 * // Conversation
 * const decision: OmniDecision = {
 *   type: "TEXT_RESPONSE",
 *   text: "Good morning, Sir.",
 *   confidence: 0.8
 * };
 * ```
 */
export interface OmniDecision {
  type: "TOOL_CALL" | "TEXT_RESPONSE" | "ERROR"; // Type de décision

  // Support des workflows Multi-Tool : Gemini peut appeler plusieurs outils en une seule réponse
  // Exemple : "Mode Travail" → Lance VSCode + Spotify + Ajuste Volume
  toolCalls?: { name: string; args: any }[]; // Liste des outils à exécuter (optionnel)

  text?: string; // Réponse textuelle (optionnel, pour TEXT_RESPONSE ou ERROR)
  confidence: number; // Niveau de confiance de l'IA (0-1)
}

// ============================================================================
// SYSTÈME DE MÉMOIRE
// ============================================================================

/**
 * Mémoire d'une application lancée par l'utilisateur
 *
 * Utilisé pour personnaliser les suggestions de Gemini en fonction des habitudes.
 * Exemple : Si l'utilisateur lance souvent "vscode", Gemini comprendra automatiquement
 * "lance mon éditeur" comme "lance vscode".
 */
export interface AppMemory {
  appName: string; // Nom de l'application (ex: "vscode", "chrome")
  launchCount: number; // Nombre de fois lancée (pour tri par fréquence)
  lastPath: string; // Chemin de l'exécutable (peut changer entre versions)
  lastUsed: string; // Dernière utilisation (ISO 8601)
}

/**
 * Workflow mémorisé (séquence de commandes)
 *
 * Permet à J.A.R.V.I.S. d'apprendre des séquences répétées de commandes
 * et de les proposer comme shortcuts.
 *
 * NOTE : Actuellement définie mais non utilisée dans le MVP.
 * Prévue pour une prochaine version (V2).
 */
export interface Workflow {
  name: string; // Nom du workflow (ex: "Mode Travail", "Soirée Film")
  actions: string[]; // Liste de commandes en langage naturel
  triggerCount: number; // Nombre de fois que le workflow a été déclenché
}
