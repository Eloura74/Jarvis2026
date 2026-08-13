/**
 * Productivity Handlers - Timer, Notes, Todos, Reminders
 */

import { HandlerContext } from "../types/app.types";
import { SystemStatus } from "../types";
import * as productivity from "../services/productivityService";

/**
 * Définir un timer
 */
export const handleSetTimer = async (
  args: { duration: number; label?: string },
  ctx: HandlerContext,
) => {
  const { duration, label } = args;
  const { addLog, setStatus } = ctx;

  addLog(
    `Timer set: ${duration}s${label ? ` (${label})` : ""}`,
    "SYSTEM",
    "info",
  );
  setStatus(SystemStatus.EXECUTING);

  productivity.startTimer(label || "Timer", duration, () => {
    addLog(`Timer completed: ${label || "Timer"}`, "SYSTEM", "success");
  });

  setStatus(SystemStatus.IDLE);
};

/**
 * Gérer les notes (add, search, list, delete)
 */
export const handleManageNotes = async (
  args: {
    action: "add" | "search" | "list" | "delete" | "create";
    content?: string;
    query?: string;
    id?: string;
    tags?: string[];
  },
  ctx: HandlerContext,
) => {
  const { action, content, query, id, tags } = args;
  const { addLog, setStatus } = ctx;

  addLog(`Note ${action}`, "SYSTEM", "info");
  setStatus(SystemStatus.EXECUTING);

  try {
    switch (action) {
      case "add":
      case "create":
        if (content) {
          productivity.addNote(content, tags);
          addLog("Note added", "SYSTEM", "success");
        }
        break;

      case "search":
        if (query) {
          const results = productivity.searchNotes(query);
          addLog(`Found ${results.length} notes`, "SYSTEM", "info");
        }
        break;

      case "list": {
        const notes = productivity.getNotes();
        addLog(`Total notes: ${notes.length}`, "SYSTEM", "info");
        break;
      }

      case "delete":
        if (id) {
          productivity.deleteNote(id);
          addLog("Note deleted", "SYSTEM", "success");
        }
        break;
    }
  } catch {
    addLog(`Note ${action} failed`, "SYSTEM", "error");
  }

  setStatus(SystemStatus.IDLE);
};

/**
 * Gérer les todos (add, complete, list, delete)
 */
export const handleManageTodos = async (
  args: {
    action:
      | "add"
      | "complete"
      | "list"
      | "delete"
      | "create"
      | "toggle"
      | "clear";
    text?: string;
    id?: string;
    priority?: "low" | "medium" | "high";
  },
  ctx: HandlerContext,
) => {
  const { action, text, id, priority } = args;
  const { addLog, setStatus } = ctx;

  addLog(`Todo ${action}`, "SYSTEM", "info");
  setStatus(SystemStatus.EXECUTING);

  try {
    switch (action) {
      case "add":
      case "create":
        if (text) {
          productivity.addTodo(text, priority);
          addLog(`Todo added: ${text}`, "SYSTEM", "success");
        }
        break;

      case "complete":
      case "toggle":
        if (id) {
          productivity.completeTodo(id);
          addLog("Todo marked complete", "SYSTEM", "success");
        }
        break;

      case "clear":
        // Si on n'a pas de clear total, on pourrait vider l'index ou ne rien faire
        addLog("Todo clear requested", "SYSTEM", "info");
        break;

      case "list": {
        const todos = productivity.getActiveTodos();
        addLog(`Active todos: ${todos.length}`, "SYSTEM", "info");
        break;
      }

      case "delete":
        if (id) {
          productivity.deleteTodo(id);
          addLog("Todo deleted", "SYSTEM", "success");
        }
        break;
    }
  } catch {
    addLog(`Todo ${action} failed`, "SYSTEM", "error");
  }

  setStatus(SystemStatus.IDLE);
};

/**
 * Définir un rappel
 */
export const handleSetReminder = async (
  args: { message: string; delay: number },
  ctx: HandlerContext,
) => {
  const { message, delay } = args;
  const { addLog, setStatus } = ctx;

  addLog(`Reminder set: "${message}" in ${delay}s`, "SYSTEM", "info");
  setStatus(SystemStatus.EXECUTING);

  productivity.addReminder(message, delay);

  addLog("Reminder scheduled", "SYSTEM", "success");
  setStatus(SystemStatus.IDLE);
};

/**
 * Gérer la liste de courses vocale
 */
export const handleManageShoppingList = async (
  args: {
    action: "add" | "list" | "clear";
    items?: string[];
  },
  ctx: HandlerContext,
) => {
  const { action, items } = args;
  const { addLog, speak } = ctx;

  addLog(`Shopping List: ${action}`, "SYSTEM", "info");

  try {
    switch (action) {
      case "add":
        if (items && items.length > 0) {
          productivity.addShoppingItems(items);
          addLog(`Added to shopping list: ${items.join(", ")}`, "SYSTEM", "success");
          if (speak) speak(`J'ai ajouté ${items.join(", ")} à votre liste de courses, Monsieur.`);
          return { status: "success", message: `Added ${items.join(", ")} to shopping list.` };
        }
        break;

      case "list": {
        const list = productivity.getShoppingList();
        addLog(`Shopping list items: ${list.length}`, "SYSTEM", "info");
        if (list.length === 0) {
          if (speak) speak("Votre liste de courses est vide, Monsieur.");
          return { status: "success", message: "Shopping list is empty." };
        } else {
          const names = list.map(item => item.name).join(", ");
          if (speak) speak(`Vous avez ${list.length} articles dans votre liste de courses : ${names}.`);
          return { status: "success", message: `Shopping list: ${names}` };
        }
      }

      case "clear":
        productivity.clearShoppingList();
        addLog("Shopping list cleared", "SYSTEM", "success");
        if (speak) speak("J'ai vidé votre liste de courses, Monsieur.");
        return { status: "success", message: "Shopping list cleared." };
    }
  } catch (e: any) {
    addLog(`Shopping List ${action} failed: ${e.message}`, "SYSTEM", "error");
    return { status: "error", message: `Shopping List error: ${e.message}` };
  }
};
