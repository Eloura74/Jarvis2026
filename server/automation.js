/**
 * Automation clavier/souris via commandes Windows natives
 * Alternative à robotjs (pas de compilation native requise)
 */

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);
const IS_WINDOWS = process.platform === "win32";

// ========================================
// HELPERS INTERNES (WSH / VBScript)
// ========================================

/**
 * Crée un script VBS temporaire pour envoyer des touches
 */
async function createVBScript(keys) {
  const tempDir = os.tmpdir();
  const scriptName = `jarvis_keys_${Date.now()}.vbs`;
  const scriptPath = path.join(tempDir, scriptName);

  // Échapper les guillemets pour VBScript
  const escapedKeys = keys.replace(/"/g, '""');
  const content = `Set WshShell = WScript.CreateObject("WScript.Shell")\nWScript.Sleep 100\nWshShell.SendKeys "${escapedKeys}"\n`;

  await fs.writeFile(scriptPath, content, "utf8");
  return scriptPath;
}

/**
 * Supprime le script temporaire
 */
async function cleanupVBScript(scriptPath) {
  try {
    await fs.unlink(scriptPath);
  } catch (e) {
    // Ignorer si déjà supprimé
  }
}

/**
 * Convertit notation standard (ctrl+c) vers notation VBScript (^c)
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

  for (const [key, vbsKey] of Object.entries(specialKeys)) {
    const regex = new RegExp(key, "gi");
    result = result.replace(regex, vbsKey);
  }

  return result;
}

// ========================================
// EXPORTS PUBLICS
// ========================================

/**
 * Tape du texte dans la fenêtre active
 */
export async function typeText(text) {
  if (!IS_WINDOWS) {
    try {
      await execAsync(`xdotool type "${text.replace(/"/g, '\\"')}"`);
      return true;
    } catch (e) {
      return false;
    }
  }

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
 * Envoie un raccourci clavier
 */
export async function sendShortcut(shortcut) {
  if (!IS_WINDOWS) {
    try {
      const xdoKey = shortcut.toLowerCase().replace(/\+/g, "+");
      await execAsync(`xdotool key ${xdoKey}`);
      return true;
    } catch (e) {
      return false;
    }
  }

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

export async function copyToClipboard() {
  return sendShortcut("ctrl+c");
}
export async function pasteFromClipboard() {
  return sendShortcut("ctrl+v");
}
export async function pressEnter() {
  return sendShortcut("enter");
}
export async function pressTab() {
  return sendShortcut("tab");
}
export async function selectAll() {
  return sendShortcut("ctrl+a");
}
export async function undo() {
  return sendShortcut("ctrl+z");
}
export async function redo() {
  return sendShortcut("ctrl+y");
}
