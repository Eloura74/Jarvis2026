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
 * Lire le contenu d'une page web (Deep Research)
 */
export const handleReadWebPage = async (
  args: { url: string },
  ctx: HandlerContext,
) => {
  const { url } = args;
  const { addLog, setStatus } = ctx;

  addLog(`📖 Reading web page: ${url}`, "SYSTEM", "info");
  setStatus(SystemStatus.NETWORKING);

  try {
    const response = await fetch("http://localhost:3001/api/web/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (data.success && data.data) {
      addLog(
        `✅ Page read: ${data.data.title} (${data.data.content.length} chars)`,
        "SYSTEM",
        "success",
      );
      setStatus(SystemStatus.IDLE);
      return {
        status: "success",
        data: {
          title: data.data.title,
          content: data.data.content,
          url: data.data.url,
        },
        message: `Page lue : ${data.data.title}`,
      };
    } else {
      throw new Error(data.error || "Erreur inconnue");
    }
  } catch (error) {
    addLog(`❌ Read error: ${error}`, "SYSTEM", "error");
    setStatus(SystemStatus.ERROR);
    return {
      status: "error",
      message: `Impossible de lire la page web : ${error}`,
    };
  }
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
 * Générer une image via Web (Bing/DALL-E)
 */
export const handleGenerateImage = async (
  args: {
    prompt: string;
    provider?: "bing" | "openai" | "craiyon";
  },
  ctx: HandlerContext,
) => {
  const { prompt, provider = "bing" } = args;
  const { addLog, setStatus } = ctx;

  addLog(`Generating image with ${provider}: "${prompt}"`, "OMNI", "info");
  setStatus(SystemStatus.NETWORKING);

  let url = "";
  switch (provider) {
    case "bing":
      url = `https://www.bing.com/images/create?q=${encodeURIComponent(prompt)}`;
      break;
    case "openai":
      url =
        "https://chatgpt.com/?q=Génère une image de : " +
        encodeURIComponent(prompt);
      break;
    case "craiyon":
      url = `https://www.craiyon.com/?prompt=${encodeURIComponent(prompt)}`;
      break;
  }

  // Ouverture avec focus automatique pour Bing
  const success = webNav.openUrl(url);

  if (success) {
    addLog(`Generator opened: ${provider}`, "SYSTEM", "success");
    // Tentative de focus/validation automatique
    setTimeout(() => {
      sendShortcut("enter").catch((e) => console.error(e));
    }, 5000);
    return {
      status: "success",
      message: `Générateur ${provider} ouvert pour "${prompt}"`,
    };
  } else {
    return { status: "error", message: "Impossible d'ouvrir le générateur" };
  }
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

      case "list": {
        const bookmarks = webNav.getBookmarks();
        addLog(`Found ${bookmarks.length} bookmarks`, "SYSTEM", "info");
        break;
      }

      case "delete":
        if (name) {
          webNav.deleteBookmark(name);
          addLog(`Bookmark deleted: ${name}`, "SYSTEM", "success");
        }
        break;
    }
  } catch {
    addLog(`Bookmark ${action} failed`, "SYSTEM", "error");
  }

  setStatus(SystemStatus.IDLE);
};
