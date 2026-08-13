/**
 * Service de productivité pour JARVIS
 *
 * Fonctionnalités :
 * - Timers/Alarmes vocaux avec notifications
 * - Notes vocales (transcription + stockage)
 * - To-Do List persistante
 * - Rappels basés temps
 *
 * @module productivityService
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Timer {
  id: string;
  label: string;
  duration: number; // millisecondes
  startTime: number;
  endTime: number;
  isActive: boolean;
}

export interface Note {
  id: string;
  content: string;
  createdAt: number;
  tags?: string[];
}

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  priority?: "low" | "medium" | "high";
}

export interface Reminder {
  id: string;
  message: string;
  triggerTime: number;
  isTriggered: boolean;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const NOTES_KEY = "jarvis_notes";
const TODOS_KEY = "jarvis_todos";
const REMINDERS_KEY = "jarvis_reminders";

// ============================================================================
// TIMERS
// ============================================================================

const activeTimers: Map<string, Timer> = new Map();

/**
 * Démarre un timer avec notification
 *
 * @param label - Label du timer
 * @param duration - Durée en secondes
 * @param callback - Fonction appelée quand timer expire
 */
export function startTimer(
  label: string,
  duration: number,
  callback?: () => void,
): Timer {
  const timer: Timer = {
    id: Date.now().toString(),
    label,
    duration: duration * 1000, // convertir en ms
    startTime: Date.now(),
    endTime: Date.now() + duration * 1000,
    isActive: true,
  };

  activeTimers.set(timer.id, timer);

  console.log(`⏱️ Timer démarré: ${label} (${duration}s)`);

  // Programmation expiration
  setTimeout(() => {
    timer.isActive = false;
    activeTimers.delete(timer.id);

    // Notification navigateur
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("⏱️ Timer JARVIS", {
        body: `Timer terminé: ${label}`,
        icon: "/jarvis-icon.png",
        tag: timer.id,
      });
    }

    // Callback personnalisé
    if (callback) {
      callback();
    }

    console.log(`✅ Timer expiré: ${label}`);
  }, duration * 1000);

  return timer;
}

/**
 * Récupère tous les timers actifs
 */
export function getActiveTimers(): Timer[] {
  return Array.from(activeTimers.values());
}

/**
 * Annule un timer
 */
export function cancelTimer(id: string): boolean {
  if (activeTimers.has(id)) {
    activeTimers.delete(id);
    console.log(`❌ Timer annulé: ${id}`);
    return true;
  }
  return false;
}

// ============================================================================
// NOTES VOCALES
// ============================================================================

/**
 * Récupère toutes les notes
 */
export function getNotes(): Note[] {
  try {
    const stored = localStorage.getItem(NOTES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erreur getNotes:", error);
    return [];
  }
}

/**
 * Ajoute une note
 *
 * @param content - Contenu de la note
 * @param tags - Tags optionnels
 */
export function addNote(content: string, tags?: string[]): Note {
  const notes = getNotes();

  const newNote: Note = {
    id: Date.now().toString(),
    content,
    createdAt: Date.now(),
    tags,
  };

  notes.unshift(newNote); // Ajouter au début
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));

  console.log(`📝 Note ajoutée: "${content.substring(0, 30)}..."`);
  return newNote;
}

/**
 * Supprime une note
 */
export function deleteNote(id: string): boolean {
  try {
    const notes = getNotes();
    const filtered = notes.filter((n) => n.id !== id);

    localStorage.setItem(NOTES_KEY, JSON.stringify(filtered));

    console.log(`🗑️ Note supprimée: ${id}`);
    return true;
  } catch (error) {
    console.error("Erreur deleteNote:", error);
    return false;
  }
}

/**
 * Recherche notes par contenu ou tags
 */
export function searchNotes(query: string): Note[] {
  const notes = getNotes();
  const lowerQuery = query.toLowerCase();

  return notes.filter(
    (note) =>
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  );
}

// ============================================================================
// TO-DO LIST
// ============================================================================

/**
 * Récupère tous les todos
 */
export function getTodos(): TodoItem[] {
  try {
    const stored = localStorage.getItem(TODOS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erreur getTodos:", error);
    return [];
  }
}

/**
 * Ajoute un todo
 *
 * @param title - Titre de la tâche
 * @param priority - Priorité (optionnel)
 */
export function addTodo(
  title: string,
  priority?: "low" | "medium" | "high",
): TodoItem {
  const todos = getTodos();

  const newTodo: TodoItem = {
    id: Date.now().toString(),
    title,
    completed: false,
    createdAt: Date.now(),
    priority,
  };

  todos.push(newTodo);
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));

  console.log(`✅ Todo ajouté: ${title}`);
  return newTodo;
}

/**
 * Marque un todo comme complété
 */
export function completeTodo(id: string): boolean {
  try {
    const todos = getTodos();
    const todo = todos.find((t) => t.id === id);

    if (todo) {
      todo.completed = true;
      localStorage.setItem(TODOS_KEY, JSON.stringify(todos));

      console.log(`✅ Todo complété: ${todo.title}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Erreur completeTodo:", error);
    return false;
  }
}

/**
 * Supprime un todo
 */
export function deleteTodo(id: string): boolean {
  try {
    const todos = getTodos();
    const filtered = todos.filter((t) => t.id !== id);

    localStorage.setItem(TODOS_KEY, JSON.stringify(filtered));

    console.log(`🗑️ Todo supprimé: ${id}`);
    return true;
  } catch (error) {
    console.error("Erreur deleteTodo:", error);
    return false;
  }
}

/**
 * Récupère todos non complétés
 */
export function getActiveTodos(): TodoItem[] {
  return getTodos().filter((t) => !t.completed);
}

// ============================================================================
// SHOPPING LIST
// ============================================================================

const SHOPPING_KEY = "jarvis_shopping_list";

export interface ShoppingItem {
  id: string;
  name: string;
  addedAt: number;
}

export function getShoppingList(): ShoppingItem[] {
  try {
    const stored = localStorage.getItem(SHOPPING_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erreur getShoppingList:", error);
    return [];
  }
}

export function addShoppingItems(names: string[]): ShoppingItem[] {
  const list = getShoppingList();
  const added: ShoppingItem[] = [];
  
  names.forEach((name) => {
    const item = { id: Date.now().toString() + Math.random(), name, addedAt: Date.now() };
    list.push(item);
    added.push(item);
  });
  
  localStorage.setItem(SHOPPING_KEY, JSON.stringify(list));
  console.log(`🛒 Articles ajoutés à la liste de courses: ${names.join(", ")}`);
  return added;
}

export function clearShoppingList(): void {
  localStorage.removeItem(SHOPPING_KEY);
  console.log(`🛒 Liste de courses vidée`);
}

// ============================================================================
// RAPPELS
// ============================================================================

/**
 * Récupère tous les rappels
 */
export function getReminders(): Reminder[] {
  try {
    const stored = localStorage.getItem(REMINDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erreur getReminders:", error);
    return [];
  }
}

/**
 * Ajoute un rappel
 *
 * @param message - Message du rappel
 * @param delayMinutes - Délai en minutes
 */
export function addReminder(message: string, delayMinutes: number): Reminder {
  const reminders = getReminders();

  const reminder: Reminder = {
    id: Date.now().toString(),
    message,
    triggerTime: Date.now() + delayMinutes * 60 * 1000,
    isTriggered: false,
  };

  reminders.push(reminder);
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));

  console.log(`⏰ Rappel programmé: "${message}" dans ${delayMinutes} min`);

  // Programmation notification
  setTimeout(
    () => {
      // Notification navigateur
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("⏰ Rappel JARVIS", {
          body: message,
          icon: "/jarvis-icon.png",
          tag: reminder.id,
          requireInteraction: true, // Nécessite action utilisateur
        });
      }

      // Marquer comme déclenché
      reminder.isTriggered = true;
      const updated = getReminders();
      const index = updated.findIndex((r) => r.id === reminder.id);
      if (index !== -1) {
        updated[index].isTriggered = true;
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
      }

      console.log(`⏰ Rappel déclenché: "${message}"`);
    },
    delayMinutes * 60 * 1000,
  );

  return reminder;
}

/**
 * Supprime un rappel
 */
export function deleteReminder(id: string): boolean {
  try {
    const reminders = getReminders();
    const filtered = reminders.filter((r) => r.id !== id);

    localStorage.setItem(REMINDERS_KEY, JSON.stringify(filtered));

    console.log(`🗑️ Rappel supprimé: ${id}`);
    return true;
  } catch (error) {
    console.error("Erreur deleteReminder:", error);
    return false;
  }
}

/**
 * Demande permission notifications (à appeler au démarrage app)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("Notifications non supportées par ce navigateur");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}
