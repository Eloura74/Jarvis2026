/**
 * Web Handlers - Search, URLs, Bookmarks
 */

import { HandlerContext } from "../types/app.types";
import { SystemStatus } from "../types";
import * as webNav from "../services/webNavigationService";
import { sendShortcut } from "../services/windowApi";

/**
 * Recherche web (Google, YouTube, Wikipedia, GitHub)
 */
export const handleSearchWeb = async (
  args: {
    engine: "google" | "google_images" | "youtube" | "wikipedia" | "github";
    query: string;
  },
  ctx: HandlerContext,
) => {
  const { engine, query } = args;
  const { addLog, setStatus } = ctx;

  addLog(`Searching ${engine}: "${query}"`, "OMNI", "info");
  setStatus(SystemStatus.NETWORKING);

  const success = webNav.searchWeb(engine, query);

  if (success) {
    addLog(`Search opened in browser`, "SYSTEM", "success");
  } else {
    addLog("Search failed", "SYSTEM", "error");
  }

  setStatus(SystemStatus.IDLE);
};

/**
 * Ouvrir une URL
 */
export const handleOpenUrl = async (
  args: { url: string; autoSubmit?: boolean },
  ctx: HandlerContext,
) => {
  const { url, autoSubmit } = args;
  const { addLog, setStatus } = ctx;

  addLog(`Opening: ${url}`, "OMNI", "info");
  setStatus(SystemStatus.NETWORKING);

  const success = webNav.openUrl(url);

  if (success) {
    addLog(`URL opened in browser`, "SYSTEM", "success");

    // Si autoSubmit est activé, on attend le focus du navigateur puis on valide
    if (autoSubmit) {
      addLog(
        "Auto-submit enabled: waiting for browser focus...",
        "SYSTEM",
        "info",
      );
      setTimeout(async () => {
        try {
          await sendShortcut("enter");
          addLog("Search validated (Enter sent)", "SYSTEM", "success");
        } catch (err) {
          console.error("Auto-submit failed:", err);
        }
      }, 3000); // Délai de 3s pour laisser le temps au navigateur de charger
    }
  } else {
    addLog("Failed to open URL", "SYSTEM", "error");
  }

  setStatus(SystemStatus.IDLE);
};

/**
 * Afficher l'overlay d'images
 */
export const handleShowImages = async (
  args: { query: string },
  ctx: HandlerContext,
) => {
  const { query } = args;
  const { addLog, setStatus, setVisualMode } = ctx;

  addLog(`Fetching images for: "${query}"`, "OMNI", "info");
  setStatus(SystemStatus.SEARCHING);

  // Activation de l'overlay via le Context
  if (setVisualMode) {
    setVisualMode(query, true);
    addLog(`Displaying images of ${query}`, "SYSTEM", "success");
  } else {
    addLog("Visual Mode not available in this context", "SYSTEM", "warning");
  }

  setStatus(SystemStatus.IDLE);
  return { status: "success", message: `Images de ${query} affichées` };
};

/**
 * Gérer les favoris (add, open, list, delete)
 */
export const handleManageBookmarks = async (
  args: {
    action: "add" | "open" | "list" | "delete";
    name?: string;
    url?: string;
  },
  ctx: HandlerContext,
) => {
  const { action, name, url } = args;
  const { addLog, setStatus } = ctx;

  addLog(`Bookmark ${action}${name ? `: ${name}` : ""}`, "SYSTEM", "info");
  setStatus(SystemStatus.EXECUTING);

  try {
    switch (action) {
      case "add":
        if (name && url) {
          webNav.addBookmark(name, url);
          addLog(`Bookmark added: ${name}`, "SYSTEM", "success");
        }
        break;

      case "open":
        if (name) {
          const opened = webNav.openBookmark(name);
          if (opened) {
            addLog(`Bookmark opened: ${name}`, "SYSTEM", "success");
          } else {
            addLog(`Bookmark not found: ${name}`, "SYSTEM", "error");
          }
        }
        break;

      case "list":
        const bookmarks = webNav.getBookmarks();
        addLog(`Found ${bookmarks.length} bookmarks`, "SYSTEM", "info");
        break;

      case "delete":
        if (name) {
          webNav.deleteBookmark(name);
          addLog(`Bookmark deleted: ${name}`, "SYSTEM", "success");
        }
        break;
    }
  } catch (error) {
    addLog(`Bookmark ${action} failed`, "SYSTEM", "error");
  }

  setStatus(SystemStatus.IDLE);
};
