/**
 * Automation clavier/souris via commandes Windows natives
 * Alternative à robotjs (pas de compilation native requise)
 *
 * Utilise :
 * - PowerShell pour les raccourcis clavier
 * - SendKeys VBScript pour typer du texte
 * - Clipboard API pour copier/coller
 */

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);
const IS_WINDOWS = process.platform === "win32";

/**
 * Tape du texte dans la fenêtre active
 */
export async function typeText(text) {
  if (!IS_WINDOWS) {
    try {
      await execAsync(`xdotool type "${text.replace(/"/g, '\\"')}"`);
      return true;
    } catch (e) {
      console.warn("xdotool non trouvé ou erreur Linux:", e.message);
      return false;
    }
  }

  // Version Windows
  let scriptPath;
  try {
    scriptPath = await createVBScript(text);
    await execAsync(`cscript //nologo "${scriptPath}"`);
    return true;
  } catch (error) {
    console.error("Erreur typeText Windows:", error);
    return false;
  } finally {
    if (scriptPath) await cleanupVBScript(scriptPath);
  }
}

/**
 * Envoie un raccourci clavier (Ctrl+C, Ctrl+V, etc.)
 */
export async function sendShortcut(shortcut) {
  if (!IS_WINDOWS) {
    try {
      // Conversion standard -> xdotool (ctrl+c -> ctrl+c, mais formaté)
      const xdoKey = shortcut.toLowerCase().replace(/\+/g, "+");
      await execAsync(`xdotool key ${xdoKey}`);
      return true;
    } catch (e) {
      console.warn("xdotool non trouvé ou erreur Linux:", e.message);
      return false;
    }
  }

  // Version Windows
  let scriptPath;
  try {
    const vbsKeys = convertToVBSKeys(shortcut);
    scriptPath = await createVBScript(vbsKeys);
    await execAsync(`cscript //nologo "${scriptPath}"`);
    return true;
  } catch (error) {
    console.error("Erreur sendShortcut Windows:", error);
    return false;
  } finally {
    if (scriptPath) await cleanupVBScript(scriptPath);
  }
}

/**
 * Convertit notation standard (ctrl+c) vers notation VBScript (^c)
 *
 * @param {string} shortcut - Raccourci notation standard
 * @returns {string} Raccourci notation VBScript
 */
function convertToVBSKeys(shortcut) {
  let result = shortcut.toLowerCase();

  // Remplacer modificateurs
  result = result.replace(/ctrl\+/g, "^");
  result = result.replace(/shift\+/g, "+");
  result = result.replace(/alt\+/g, "%");

  // Touches spéciales
  const specialKeys = {
    enter: "{ENTER}",
    tab: "{TAB}",
    backspace: "{BACKSPACE}",
    delete: "{DELETE}",
    escape: "{ESC}",
    esc: "{ESC}",
    home: "{HOME}",
    end: "{END}",
    pageup: "{PGUP}",
    pagedown: "{PGDN}",
    up: "{UP}",
    down: "{DOWN}",
    left: "{LEFT}",
    right: "{RIGHT}",
  };

  // Remplacer touches spéciales
  for (const [key, vbsKey] of Object.entries(specialKeys)) {
    const regex = new RegExp(key, "gi");
    result = result.replace(regex, vbsKey);
  }

  return result;
}

/**
 * Copie dans le presse-papiers (Ctrl+C)
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard() {
  return sendShortcut("ctrl+c");
}

/**
 * Colle depuis le presse-papiers (Ctrl+V)
 * @returns {Promise<boolean>}
 */
export async function pasteFromClipboard() {
  return sendShortcut("ctrl+v");
}

/**
 * Envoie la touche Entrée
 * @returns {Promise<boolean>}
 */
export async function pressEnter() {
  return sendShortcut("enter");
}

/**
 * Envoie la touche Tab
 * @returns {Promise<boolean>}
 */
export async function pressTab() {
  return sendShortcut("tab");
}

/**
 * Sélectionne tout le texte (Ctrl+A)
 * @returns {Promise<boolean>}
 */
export async function selectAll() {
  return sendShortcut("ctrl+a");
}

/**
 * Annule la dernière action (Ctrl+Z)
 * @returns {Promise<boolean>}
 */
export async function undo() {
  return sendShortcut("ctrl+z");
}

/**
 * Refait la dernière action (Ctrl+Y)
 * @returns {Promise<boolean>}
 */
export async function redo() {
  return sendShortcut("ctrl+y");
}
