/**
 * Moteur de Prédiction Intelligent pour JARVIS
 *
 * Analyse les patterns d'utilisation pour suggérer proactivement
 * les commandes que l'utilisateur est susceptible d'exécuter.
 *
 * Apprentissage automatique basé sur :
 * - Heure de la journée (0-23h)
 * - Jour de la semaine (Lundi-Dimanche)
 * - Fréquence d'utilisation
 *
 * Exemples de patterns détectés :
 * - Lundi 9h00 → "lance VSCode" (travail)
 * - Vendredi 18h00 → "ouvre Spotify" (weekend)
 * - Après "ouvre Chrome" → "recherche [...]" (chaînage)
 *
 * @module predictionEngine
 */

/**
 * Structure d'un pattern d'usage
 */
interface UsagePattern {
  /** Heure de la journée (0-23) */
  hour: number;
  /** Jour de la semaine (0=Dimanche, 1=Lundi, ..., 6=Samedi) */
  dayOfWeek: number;
  /** Commande exécutée */
  command: string;
  /** Score de fréquence (0-100, incremente à chaque utilisation) */
  frequency: number;
  /** Timestamp dernier usage (pour analytics) */
  lastUsed: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Clé localStorage pour persistance patterns */
const STORAGE_KEY = "jarvis_usage_patterns";

/** Nombre maximum de patterns enregistrés */
const MAX_PATTERNS = 500;

/** Seuil de confiance minimum pour suggestion (0-100) */
const CONFIDENCE_THRESHOLD = 30;

/** Nombre de suggestions à retourner */
const MAX_SUGGESTIONS = 3;

// ============================================================================
// STOCKAGE
// ============================================================================

/**
 * Patterns en mémoire (chargés depuis localStorage)
 */
let patterns: UsagePattern[] = [];

/**
 * Initialise le moteur en chargeant les patterns depuis localStorage
 */
function initialize(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      patterns = JSON.parse(stored);
      console.log(`🧠 Patterns chargés: ${patterns.length} entrées`);
    }
  } catch (error) {
    console.error("Erreur chargement patterns:", error);
    patterns = [];
  }
}

/**
 * Sauvegarde les patterns dans localStorage
 */
function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
  } catch (error) {
    console.error("Erreur sauvegarde patterns:", error);
  }
}

// Initialiser au chargement du module
initialize();

// ============================================================================
// TRACKING
// ============================================================================

/**
 * Enregistre l'exécution d'une commande pour apprentissage
 *
 * Logique :
 * 1. Extraire contexte temporel (heure + jour)
 * 2. Chercher pattern existant
 * 3. Si existe → incrémenter fréquence
 * 4. Si nouveau → créer pattern avec fréquence initiale
 * 5. Limiter à MAX_PATTERNS (supprimer moins fréquents)
 *
 * @param command - Commande exécutée
 *
 * @example
 * // Utilisateur lance VSCode le lundi à 9h
 * trackCommand("lance VSCode");
 * // Après 10 utilisations à cette heure → suggestion automatique
 */
export function trackCommand(command: string): void {
  const now = new Date();
  const hour = now.getHours(); // 0-23
  const dayOfWeek = now.getDay(); // 0-6

  // Normaliser commande (lowercase, trim)
  const normalizedCommand = command.toLowerCase().trim();

  // Chercher pattern existant pour ce contexte
  const existingIndex = patterns.findIndex(
    (p) =>
      p.hour === hour &&
      p.dayOfWeek === dayOfWeek &&
      p.command === normalizedCommand,
  );

  if (existingIndex !== -1) {
    // Pattern existe : incrémenter fréquence (max 100)
    const existing = patterns[existingIndex];
    existing.frequency = Math.min(100, existing.frequency + 5);
    existing.lastUsed = Date.now();

    console.log(
      `📈 Pattern renforcé: "${command}" (${hour}h, ${getDayName(dayOfWeek)}) → ${existing.frequency}/100`,
    );
  } else {
    // Nouveau pattern : créer avec fréquence initiale
    const newPattern: UsagePattern = {
      hour,
      dayOfWeek,
      command: normalizedCommand,
      frequency: 10, // Score initial modéré
      lastUsed: Date.now(),
    };

    patterns.push(newPattern);

    console.log(
      `📊 Nouveau pattern: "${command}" (${hour}h, ${getDayName(dayOfWeek)})`,
    );

    // Limiter nombre de patterns (LRU sur fréquence)
    if (patterns.length > MAX_PATTERNS) {
      patterns.sort((a, b) => b.frequency - a.frequency);
      patterns = patterns.slice(0, MAX_PATTERNS);
      console.log(
        `🗑️ Patterns limités à ${MAX_PATTERNS} (suppression moins fréquents)`,
      );
    }
  }

  // Sauvegarder modifications
  persist();
}

// ============================================================================
// PRÉDICTIONS
// ============================================================================

/**
 * Obtient les suggestions pour le contexte actuel
 *
 * Retourne les 3 commandes les plus probables selon :
 * - Heure actuelle
 * - Jour de la semaine actuel
 * - Score de fréquence > seuil
 *
 * @returns Liste des commandes suggérées (max 3)
 *
 * @example
 * // Lundi 9h00, utilisateur ouvre JARVIS
 * const suggestions = getPredictions();
 * // → ["lance VSCode", "ouvre Chrome", "recherche projet"]
 */
export function getPredictions(): string[] {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  // Filtrer patterns correspondant au contexte actuel
  const contextualPatterns = patterns.filter(
    (p) =>
      p.hour === hour &&
      p.dayOfWeek === dayOfWeek &&
      p.frequency >= CONFIDENCE_THRESHOLD,
  );

  // Trier par fréquence décroissante
  const topSuggestions = contextualPatterns
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, MAX_SUGGESTIONS)
    .map((p) => p.command);

  if (topSuggestions.length > 0) {
    console.log(
      `💡 Suggestions (${hour}h, ${getDayName(dayOfWeek)}): ${topSuggestions.join(", ")}`,
    );
  }

  return topSuggestions;
}

/**
 * Obtient les suggestions "flexibles" (±1 heure de tolérance)
 *
 * Utile si aucune suggestion exacte pour l'heure actuelle
 *
 * @returns Liste des commandes suggérées avec tolérance horaire
 */
export function getFlexiblePredictions(): string[] {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  // Accepter patterns ±1 heure
  const flexiblePatterns = patterns.filter(
    (p) =>
      Math.abs(p.hour - hour) <= 1 &&
      p.dayOfWeek === dayOfWeek &&
      p.frequency >= CONFIDENCE_THRESHOLD,
  );

  return flexiblePatterns
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, MAX_SUGGESTIONS)
    .map((p) => p.command);
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Statistiques des patterns d'utilisation
 */
export interface PredictionStats {
  /** Nombre total de patterns enregistrés */
  totalPatterns: number;
  /** Top 10 commandes globales (tous contextes) */
  topCommands: Array<{
    command: string;
    avgFrequency: number;
    contexts: number; // Nombre de contextes différents
  }>;
  /** Patterns par jour de semaine */
  byDayOfWeek: Record<string, number>;
}

/**
 * Récupère les statistiques globales pour analytics
 *
 * @returns Statistiques détaillées des patterns
 */
export function getStats(): PredictionStats {
  // Top commandes globales (agrégées sur tous contextes)
  const commandMap = new Map<string, { totalFreq: number; count: number }>();

  for (const pattern of patterns) {
    const existing = commandMap.get(pattern.command);
    if (existing) {
      existing.totalFreq += pattern.frequency;
      existing.count++;
    } else {
      commandMap.set(pattern.command, {
        totalFreq: pattern.frequency,
        count: 1,
      });
    }
  }

  const topCommands = Array.from(commandMap.entries())
    .map(([command, data]) => ({
      command,
      avgFrequency: Math.round(data.totalFreq / data.count),
      contexts: data.count,
    }))
    .sort((a, b) => b.avgFrequency - a.avgFrequency)
    .slice(0, 10);

  // Distribution par jour
  const byDayOfWeek: Record<string, number> = {
    Dimanche: 0,
    Lundi: 0,
    Mardi: 0,
    Mercredi: 0,
    Jeudi: 0,
    Vendredi: 0,
    Samedi: 0,
  };

  for (const pattern of patterns) {
    const dayName = getDayName(pattern.dayOfWeek);
    byDayOfWeek[dayName] = (byDayOfWeek[dayName] || 0) + 1;
  }

  return {
    totalPatterns: patterns.length,
    topCommands,
    byDayOfWeek,
  };
}

/**
 * Efface tous les patterns (reset apprentissage)
 */
export function clearPatterns(): void {
  patterns = [];
  localStorage.removeItem(STORAGE_KEY);
  console.log("🗑️ Patterns effacés");
}

// ============================================================================
// UTILS
// ============================================================================

/**
 * Convertit numéro jour en nom
 * @param day - Numéro jour (0-6)
 * @returns Nom du jour en français
 */
function getDayName(day: number): string {
  const days = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];
  return days[day] || "Inconnu";
}
