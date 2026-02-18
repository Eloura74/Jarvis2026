/**
 * Service de contexte conversationnel pour JARVIS
 *
 * Fonctionnalités :
 * - Historique dialogue (10 derniers messages)
 * - Tracking entités mentionnées (apps, URLs, favoris, todos, notes)
 * - Résolution références pronominales ("ouvre-le", "ferme ça")
 * - Cache intelligent localStorage
 *
 * @module conversationContext
 */

// ============================================================================
// TYPES
// ============================================================================

export type EntityType =
  | "app"
  | "file"
  | "url"
  | "bookmark"
  | "todo"
  | "note"
  | "timer"
  | "reminder";

export interface EntityReference {
  type: EntityType;
  id: string;
  label: string;
  value?: unknown; // Données supplémentaires (path, URL, etc.)
  mentionedAt: number;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  entities?: EntityReference[];
}

// ============================================================================
// STORAGE
// ============================================================================

const HISTORY_KEY = "jarvis_conversation_history";
const ENTITIES_KEY = "jarvis_recent_entities";
const MAX_HISTORY = 10;
const MAX_ENTITIES = 20;

// ============================================================================
// HISTORIQUE MESSAGES
// ============================================================================

/**
 * Ajoute un message à l'historique
 *
 * @param role - Rôle (user ou assistant)
 * @param content - Contenu du message
 * @param entities - Entités mentionnées dans ce message
 */
export function addMessage(
  role: "user" | "assistant",
  content: string,
  entities?: EntityReference[],
): void {
  try {
    const history = getHistory();

    const message: ConversationMessage = {
      role,
      content,
      timestamp: Date.now(),
      entities,
    };

    // Ajouter au début (plus récent en premier)
    history.unshift(message);

    // Limiter à MAX_HISTORY messages
    const trimmed = history.slice(0, MAX_HISTORY);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));

    // Mettre à jour entités si présentes
    if (entities && entities.length > 0) {
      updateRecentEntities(entities);
    }

    console.log(
      `💬 Message ajouté: ${role} (${entities?.length || 0} entités)`,
    );
  } catch (error) {
    console.error("Erreur addMessage:", error);
  }
}

/**
 * Récupère l'historique des messages
 *
 * @param limit - Nombre maximum de messages à retourner
 */
export function getHistory(limit = MAX_HISTORY): ConversationMessage[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    const history: ConversationMessage[] = stored ? JSON.parse(stored) : [];

    return history.slice(0, limit);
  } catch (error) {
    console.error("Erreur getHistory:", error);
    return [];
  }
}

/**
 * Efface l'historique
 */
export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(ENTITIES_KEY);
  console.log("🗑️ Historique effacé");
}

/**
 * Formate l'historique pour injection dans system prompt
 */
export function formatHistoryForPrompt(): string {
  const history = getHistory(5); // 5 derniers pour contexte

  if (history.length === 0) {
    return "Aucun historique.";
  }

  return history
    .reverse() // Ordre chronologique
    .map((m) => `${m.role === "user" ? "User" : "JARVIS"}: ${m.content}`)
    .join("\n");
}

// ============================================================================
// GESTION ENTITÉS
// ============================================================================

/**
 * Met à jour les entités récentes
 */
function updateRecentEntities(newEntities: EntityReference[]): void {
  try {
    const current = getRecentEntities();

    // Ajouter nouvelles entités
    const updated = [...newEntities, ...current];

    // Dédupliquer par (type + label)
    const unique = updated.filter(
      (entity, index, self) =>
        index ===
        self.findIndex(
          (e) => e.type === entity.type && e.label === entity.label,
        ),
    );

    // Limiter
    const trimmed = unique.slice(0, MAX_ENTITIES);

    localStorage.setItem(ENTITIES_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Erreur updateRecentEntities:", error);
  }
}

/**
 * Récupère toutes les entités récentes
 */
export function getRecentEntities(): EntityReference[] {
  try {
    const stored = localStorage.getItem(ENTITIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erreur getRecentEntities:", error);
    return [];
  }
}

/**
 * Récupère la dernière entité d'un type spécifique
 *
 * @param type - Type d'entité recherché (optionnel)
 */
export function getLastEntity(type?: EntityType): EntityReference | null {
  const entities = getRecentEntities();

  if (type) {
    return entities.find((e) => e.type === type) || null;
  }

  return entities[0] || null;
}

/**
 * Ajoute manuellement une entité au tracking
 *
 * @param type - Type d'entité
 * @param id - ID unique
 * @param label - Label lisible
 * @param value - Valeur optionnelle
 */
export function trackEntity(
  type: EntityType,
  id: string,
  label: string,
  value?: unknown,
): void {
  const entity: EntityReference = {
    type,
    id,
    label,
    value,
    mentionedAt: Date.now(),
  };

  updateRecentEntities([entity]);
  console.log(`🔖 Entité trackée: ${type} - ${label}`);
}

// ============================================================================
// RÉSOLUTION RÉFÉRENCES
// ============================================================================

/**
 * Résout une référence pronominale
 *
 * Gère : "le", "la", "ça", "cela", "lui", "celle-ci", "celui-ci"
 *
 * @param pronoun - Pronom à résoudre
 * @param context - Contexte additionnel (type attendu)
 * @returns Entité correspondante ou null
 */
export function resolveReference(
  pronoun: string,
  context?: { expectedType?: EntityType },
): EntityReference | null {
  const normalizedPronoun = pronoun.toLowerCase().trim();

  // Détecter si c'est un pronom
  const pronouns = [
    "le",
    "la",
    "l",
    "ça",
    "cela",
    "lui",
    "celle-ci",
    "celui-ci",
    "ce",
  ];
  const isPronoun = pronouns.some((p) => normalizedPronoun.includes(p));

  if (!isPronoun) {
    return null;
  }

  // Si type attendu fourni, chercher dernière entité de ce type
  if (context?.expectedType) {
    return getLastEntity(context.expectedType);
  }

  // Sinon, retourner dernière entité générale
  return getLastEntity();
}

/**
 * Formate les entités récentes pour le system prompt
 */
export function formatEntitiesForPrompt(): string {
  const entities = getRecentEntities().slice(0, 5);

  if (entities.length === 0) {
    return "Aucune entité récente.";
  }

  const grouped: Record<string, string[]> = {};

  entities.forEach((e) => {
    if (!grouped[e.type]) {
      grouped[e.type] = [];
    }
    grouped[e.type].push(e.label);
  });

  return Object.entries(grouped)
    .map(([type, labels]) => `- ${type}: ${labels.slice(0, 3).join(", ")}`)
    .join("\n");
}

// ============================================================================
// DÉTECTION AUTOMATIQUE ENTITÉS
// ============================================================================

/**
 * Extrait automatiquement les entités d'un message utilisateur
 *
 * @param message - Message utilisateur
 * @returns Liste entités détectées
 */
export function extractEntitiesFromMessage(message: string): EntityReference[] {
  const entities: EntityReference[] = [];

  // Détection URLs
  const urlRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.(com|fr|org|net|io))/gi;
  const urls = message.match(urlRegex);
  if (urls) {
    urls.forEach((url) => {
      entities.push({
        type: "url",
        id: url,
        label: url,
        value: url,
        mentionedAt: Date.now(),
      });
    });
  }

  // Détection apps connues (patterns simples)
  const appPatterns = [
    {
      pattern: /spotify|musique/i,
      label: "Spotify",
      type: "app" as EntityType,
    },
    {
      pattern: /chrome|navigateur/i,
      label: "Chrome",
      type: "app" as EntityType,
    },
    {
      pattern: /vscode|code|éditeur/i,
      label: "VSCode",
      type: "app" as EntityType,
    },
  ];

  appPatterns.forEach(({ pattern, label, type }) => {
    if (pattern.test(message)) {
      entities.push({
        type,
        id: label.toLowerCase(),
        label,
        mentionedAt: Date.now(),
      });
    }
  });

  return entities;
}

/**
 * Détecte si un message contient une référence pronominale
 */
export function containsReference(message: string): boolean {
  const pronouns = [
    "le",
    "la",
    "l'",
    "ça",
    "cela",
    "lui",
    "celle-ci",
    "celui-ci",
  ];
  const lowerMessage = message.toLowerCase();

  return pronouns.some((p) => lowerMessage.includes(p));
}
