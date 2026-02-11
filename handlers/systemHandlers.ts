/**
 * System Handlers - Gestion apps, fenêtres, clavier
 * Extrait de App.tsx executeTool
 */

import type { HandlerContext } from "../types/app.types";
import { SystemStatus } from "../types";
import { searchApps, APPS_DATABASE } from "../appsDatabase";
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
  args: { appName: string; adminMode?: boolean },
  ctx: HandlerContext,
  additionalDeps: {
    setActiveOverlay: (text: string | null) => void;
    appMemory: any[];
    updateMemory: (app: string, path: string) => void;
    findAppPath?: (query: string) => { name: string; path: string } | null; // ✨ Nouvelle fonction de recherche configurée
  },
) => {
  const { appName, adminMode } = args;
  const targetApp = appName.toLowerCase();
  const { addLog, setStatus } = ctx;
  const { setActiveOverlay, appMemory, updateMemory, findAppPath } = additionalDeps;

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
      addLog(`✅ Using configured path for "${configuredApp.name}": ${foundPath}`, "SYSTEM", "success");
      // Mettre à jour la mémoire avec le chemin configuré
      updateMemory(targetApp, foundPath);
      // Passer directement au lancement
      setActiveOverlay(`LAUNCHING: ${configuredApp.name.toUpperCase()}`);
      
      try {
        const result = await launchAppOnBackend(foundPath);
        if (result) {
          addLog(`Application "${configuredApp.name}" launched successfully`, "SYSTEM", "success");
          setStatus(SystemStatus.IDLE);
          setActiveOverlay(null);
          return { status: "success", message: `${configuredApp.name} lancé` };
        }
      } catch (error) {
        addLog(`Failed to launch: ${error instanceof Error ? error.message : String(error)}`, "SYSTEM", "error");
      }
    } else {
      addLog(`⚠️ No configured path for "${targetApp}", falling back to search...`, "SYSTEM", "warning");
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
      foundPath = bestMatch.path;
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

    const launched = await launchAppOnBackend(foundPath);

    if (launched) {
      addLog(`Application launched successfully`, "SYSTEM", "success");
      updateMemory(targetApp, foundPath);
      setStatus(SystemStatus.IDLE);
    } else {
      addLog(`Failed to launch application`, "SYSTEM", "error");
      // ... retry logic (voir App.tsx lignes 573-617)
      setStatus(SystemStatus.ERROR);
      setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
    }
  }
};

/**
 * HANDLER 2: Gestion fenêtres
 */
export const handleManageWindow = async (
  args: { action: string; window_title: string },
  ctx: HandlerContext,
) => {
  const { action, window_title } = args;
  const { addLog, setStatus } = ctx;

  addLog(`Window action: ${action} on "${window_title}"`, "SYSTEM", "info");
  setStatus(SystemStatus.EXECUTING);

  try {
    switch (action) {
      case "focus":
        await focusWindow(window_title);
        break;
      case "close":
        await closeWindow(window_title);
        break;
      case "minimize":
        await minimizeWindow(window_title);
        break;
      case "maximize":
        await maximizeWindow(window_title);
        break;
      default:
        addLog(`Unknown window action: ${action}`, "SYSTEM", "error");
    }

    addLog(`Window ${action} successful`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);
  } catch (error) {
    addLog(`Window action failed: ${error}`, "SYSTEM", "error");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
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
