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

/**
 * Crée un script VBS temporaire pour envoyer des touches clavier
 * VBScript SendKeys est natif Windows, pas de compilation requise
 *
 * @param {string} keys - Touches à envoyer (texte ou combinaisons)
 * @returns {Promise<string>} Chemin du script VBS créé
 */
async function createVBScript(keys) {
  const tempDir = os.tmpdir();
  const scriptPath = path.join(tempDir, `jarvis-sendkeys-${Date.now()}.vbs`);

  // Échapper les guillemets dans le texte
  const escapedKeys = keys.replace(/"/g, '""');

  const vbsContent = `
Set WshShell = WScript.CreateObject("WScript.Shell")
WScript.Sleep 100
WshShell.SendKeys "${escapedKeys}"
  `.trim();

  await fs.writeFile(scriptPath, vbsContent, "utf-8");
  return scriptPath;
}

/**
 * Nettoie un script VBS temporaire
 * @param {string} scriptPath - Chemin du script à supprimer
 */
async function cleanupVBScript(scriptPath) {
  try {
    await fs.unlink(scriptPath);
  } catch {
    // Ignorer les erreurs de nettoyage
  }
}

/**
 * Tape du texte dans la fenêtre active
 * Utilise VBScript SendKeys (natif Windows)
 *
 * @param {string} text - Texte à taper
 * @returns {Promise<boolean>} True si succès
 *
 * @example
 * await typeText('Bonjour JARVIS');
 */
export async function typeText(text) {
  let scriptPath;
  try {
    scriptPath = await createVBScript(text);
    await execAsync(`cscript //nologo "${scriptPath}"`);
    return true;
  } catch (error) {
    console.error("Erreur typeText:", error);
    return false;
  } finally {
    if (scriptPath) {
      await cleanupVBScript(scriptPath);
    }
  }
}

/**
 * Envoie un raccourci clavier (Ctrl+C, Ctrl+V, etc.)
 * Utilise VBScript SendKeys avec syntaxe spéciale
 *
 * Syntaxe SendKeys :
 * - ^ = Ctrl
 * - + = Shift
 * - % = Alt
 * - {ENTER} = Entrée
 *
 * @param {string} shortcut - Raccourci (ex: "ctrl+c", "ctrl+shift+n")
 * @returns {Promise<boolean>} True si succès
 *
 * @example
 * await sendShortcut('ctrl+c'); // Copier
 * await sendShortcut('ctrl+v'); // Coller
 * await sendShortcut('ctrl+shift+n'); // Nouvelle fenêtre
 */
export async function sendShortcut(shortcut) {
  let scriptPath;
  try {
    // Convertir notation standard vers notation VBScript
    const vbsKeys = convertToVBSKeys(shortcut);

    scriptPath = await createVBScript(vbsKeys);
    await execAsync(`cscript //nologo "${scriptPath}"`);
    return true;
  } catch (error) {
    console.error("Erreur sendShortcut:", error);
    return false;
  } finally {
    if (scriptPath) {
      await cleanupVBScript(scriptPath);
    }
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
