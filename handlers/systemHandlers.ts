/**
 * System Handlers - Gestion apps, fenêtres, clavier
 * Extrait de App.tsx executeTool
 */

import type { HandlerContext } from "../types/app.types";
import { SystemStatus } from "../types";
import { searchApps, APPS_DATABASE } from "../apps";
import { searchAppOnBackend, launchAppOnBackend } from "../services/backendApi";
import { promptUserForAppPath, cacheAppPath } from "../services/appScanner";
import {
  focusWindow,
  closeWindow,
  minimizeWindow,
  maximizeWindow,
  typeText,
  sendShortcut,
} from "../services/windowApi";

/**
 * HANDLER 1: Recherche et lance une application
 *
 * @example
 * handleSearchAndLaunchApp({ appName: 'chrome' }, ctx)
 */
export const handleSearchAndLaunchApp = async (
  args: { appName: string; adminMode?: boolean; url?: string },
  ctx: HandlerContext,
  additionalDeps: {
    setActiveOverlay: (text: string | null) => void;
    appMemory: { appName: string; lastPath: string }[];
    updateMemory: (app: string, path: string) => void;
    findAppPath?: (query: string) => { name: string; path: string } | null; // ✨ Nouvelle fonction de recherche configurée
  },
) => {
  const { appName, adminMode, url } = args;
  const targetApp = appName.toLowerCase();
  const { addLog, setStatus } = ctx;
  const { setActiveOverlay, appMemory, updateMemory, findAppPath } =
    additionalDeps;

  setStatus(SystemStatus.SEARCHING);
  setActiveOverlay(
    adminMode
      ? `ADMIN OVERRIDE: ${targetApp.toUpperCase()}`
      : `LOCATING: ${targetApp.toUpperCase()}`,
  );

  let foundPath = "";

  // ÉTAPE 0 : Configuration utilisateur (PRIORITÉ ABSOLUE) ✨
  if (findAppPath) {
    const configuredApp = findAppPath(targetApp);
    if (configuredApp) {
      foundPath = configuredApp.path;
      addLog(
        `✅ Using configured path for "${configuredApp.name}": ${foundPath}`,
        "SYSTEM",
        "success",
      );
      // Mettre à jour la mémoire avec le chemin configuré
      updateMemory(targetApp, foundPath);
      // Passer directement au lancement
      setActiveOverlay(`LAUNCHING: ${configuredApp.name.toUpperCase()}`);

      try {
        // Si une URL est fournie, la passer comme argument au navigateur
        const launchArgs = url ? [url] : undefined;
        const result = await launchAppOnBackend(foundPath, launchArgs);
        if (result) {
          const message = url
            ? `${configuredApp.name} lancé avec ${url}`
            : `Application "${configuredApp.name}" launched successfully`;
          addLog(message, "SYSTEM", "success");
          setStatus(SystemStatus.IDLE);
          setActiveOverlay(null);
          return { status: "success", message };
        }
      } catch (error) {
        addLog(
          `Failed to launch: ${error instanceof Error ? error.message : String(error)}`,
          "SYSTEM",
          "error",
        );
      }
    } else {
      addLog(
        `⚠️ No configured path for "${targetApp}", falling back to search...`,
        "SYSTEM",
        "warning",
      );
    }
  }

  // ÉTAPE 1 : Mémoire utilisateur (fallback)
  const memoryMatch = appMemory.find(
    (m) => m.appName.toLowerCase() === targetApp,
  );

  if (memoryMatch) {
    foundPath = memoryMatch.lastPath;
    addLog(`Using cached path: ${foundPath}`, "OMNI", "success");
  } else {
    // ÉTAPE 2 : Backend search
    addLog(`Searching entire system for "${targetApp}"...`, "OMNI", "info");

    const backendResults = await searchAppOnBackend(targetApp);

    if (backendResults.length > 0) {
      const bestMatch = backendResults[0];
      foundPath = bestMatch.path as string;
      addLog(`Found: "${bestMatch.name}" at ${foundPath}`, "OMNI", "success");
      cacheAppPath(targetApp, foundPath);
    } else {
      // Fallback : DB locale
      const dbResults = searchApps(targetApp, 1);

      if (dbResults.length > 0) {
        const bestMatch = dbResults[0];
        foundPath = APPS_DATABASE[bestMatch].path;
        addLog(`Found in local database: "${bestMatch}"`, "SYSTEM", "info");
      } else {
        // Dernier recours : prompt utilisateur
        addLog(
          `Cannot locate "${targetApp}" automatically`,
          "SYSTEM",
          "warning",
        );
        setActiveOverlay(null);
        setStatus(SystemStatus.IDLE);

        const userPath = await promptUserForAppPath(targetApp);

        if (userPath) {
          foundPath = userPath;
          cacheAppPath(targetApp, userPath);
          addLog(`User provided path: ${userPath}`, "USER", "success");
          setStatus(SystemStatus.EXECUTING);
        } else {
          addLog(`Operation cancelled`, "SYSTEM", "error");
          setStatus(SystemStatus.ERROR);
          setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
          return;
        }
      }
    }
  }

  await new Promise((r) => setTimeout(r, 800));

  if (foundPath) {
    setActiveOverlay(null);
    setStatus(SystemStatus.EXECUTING);

    addLog(`Ready to launch: ${foundPath}`, "SYSTEM", "info");

    // Si une URL est fournie, la passer comme argument au navigateur
    const launchArgs = url ? [url] : undefined;
    const launched = await launchAppOnBackend(foundPath, launchArgs);

    if (launched) {
      const message = url
        ? `${targetApp} lancé avec ${url}`
        : "Application launched successfully";
      addLog(message, "SYSTEM", "success");
      updateMemory(targetApp, foundPath);
      setStatus(SystemStatus.IDLE);
      return { status: "success", message };
    } else {
      addLog(`Failed to launch application`, "SYSTEM", "error");
      // ... retry logic (voir App.tsx lignes 573-617)
      setStatus(SystemStatus.ERROR);
      setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
      return { status: "error", message: "Failed to launch" };
    }
  }

  return { status: "error", message: "No path found" };
};

/**
 * HANDLER 2: Gestion fenêtres
 */
export const handleManageWindow = async (
  args: { action: string; appName?: string; windowTitle?: string },
  ctx: HandlerContext,
) => {
  const { action, appName, windowTitle } = args;
  const { addLog, setStatus } = ctx;

  // Accepter appName (nouveau) ou windowTitle (legacy) pour rétrocompatibilité
  let finalAppName = appName || windowTitle;

  // FALLBACK INTELLIGENT : Si appName manquant, essayer de deviner depuis le contexte
  if (!finalAppName || finalAppName.trim() === "") {
    addLog(
      `⚠️ manage_window: appName manquant, tentative de fallback intelligent...`,
      "SYSTEM",
      "warning",
    );

    // Si action = close, essayer de fermer les navigateurs courants dans l'ordre
    // (Opera, Chrome, Firefox, Edge) — celui qui est ouvert sera fermé
    if (action === "close") {
      const browserCandidates = ["Opera", "Chrome", "Firefox", "Edge", "Brave"];
      addLog(
        `🔍 Recherche d'un navigateur ouvert parmi: ${browserCandidates.join(", ")}`,
        "SYSTEM",
        "info",
      );

      for (const browser of browserCandidates) {
        const success = await closeWindow(browser);
        if (success) {
          addLog(`✅ Navigateur fermé: ${browser}`, "SYSTEM", "success");
          setStatus(SystemStatus.IDLE);
          return {
            status: "success",
            message: `${browser} fermé, Monsieur.`,
          };
        }
      }

      // Aucun navigateur trouvé
      addLog(`❌ Aucun navigateur ouvert trouvé`, "SYSTEM", "error");
      setStatus(SystemStatus.ERROR);
      setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
      return {
        status: "error",
        message:
          "Aucun navigateur ouvert trouvé. Veuillez spécifier quelle application fermer.",
      };
    }

    // Pour les autres actions (minimize, maximize, focus), appName est obligatoire
    addLog(
      `❌ manage_window: appName requis pour action ${action}`,
      "SYSTEM",
      "error",
    );
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
    return {
      status: "error",
      message: `Impossible de ${action === "minimize" ? "minimiser" : action === "maximize" ? "maximiser" : "gérer"} la fenêtre : vous devez spécifier quelle application.`,
    };
  }

  finalAppName = finalAppName.trim();

  addLog(`Window action: ${action} on "${finalAppName}"`, "SYSTEM", "info");
  setStatus(SystemStatus.EXECUTING);

  try {
    let success = false;

    switch (action) {
      case "focus":
        success = await focusWindow(finalAppName);
        break;
      case "close":
        success = await closeWindow(finalAppName);
        break;
      case "minimize":
        success = await minimizeWindow(finalAppName);
        break;
      case "maximize":
        success = await maximizeWindow(finalAppName);
        break;
      default:
        addLog(`Unknown window action: ${action}`, "SYSTEM", "error");
        setStatus(SystemStatus.ERROR);
        setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
        return { status: "error", message: `Unknown action: ${action}` };
    }

    if (success) {
      addLog(`Window ${action} successful`, "SYSTEM", "success");
      setStatus(SystemStatus.IDLE);
      return { status: "success", message: `Window ${action} completed` };
    } else {
      addLog(
        `Window ${action} failed (window not found?)`,
        "SYSTEM",
        "warning",
      );
      setStatus(SystemStatus.ERROR);
      setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
      return {
        status: "error",
        message: `Fenêtre "${finalAppName}" introuvable. Vérifiez que l'application est ouverte.`,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    addLog(`Window action failed: ${errorMsg}`, "SYSTEM", "error");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
    return { status: "error", message: errorMsg };
  }
};

/**
 * HANDLER 3: Automation clavier
 */
export const handleKeyboardAutomation = async (
  args: { action: string; text?: string; shortcut?: string },
  ctx: HandlerContext,
) => {
  const { action, text, shortcut } = args;
  const { addLog, setStatus } = ctx;

  addLog(`Keyboard automation: ${action}`, "SYSTEM", "info");
  setStatus(SystemStatus.EXECUTING);

  try {
    if (action === "type" && text) {
      await typeText(text);
      addLog(`Typed: "${text}"`, "SYSTEM", "success");
    } else if (action === "shortcut" && shortcut) {
      await sendShortcut(shortcut);
      addLog(`Shortcut sent: ${shortcut}`, "SYSTEM", "success");
    }

    setStatus(SystemStatus.IDLE);
  } catch (error) {
    addLog(`Keyboard automation failed: ${error}`, "SYSTEM", "error");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
  }
};
