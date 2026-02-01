/**
 * Gestionnaire de fenêtres Windows pour J.A.R.V.I.S.
 * Version PowerShell (PAS de compilation native requise)
 *
 * Permet de contrôler les fenêtres des applications ouvertes :
 * - Lister toutes les fenêtres
 * - Focus (mettre au premier plan)
 * - Minimize (réduire)
 * - Maximize (agrandir)
 * - Close (fermer)
 *
 * Utilise PowerShell et WScript natifs Windows
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Liste toutes les fenêtres ouvertes et visibles
 * Utilise PowerShell avec .NET Framework (Get-Process)
 *
 * @returns {Promise<Array<{id: number, title: string, processId: number}>>} Liste des fenêtres
 */
export async function listWindows() {
  try {
    const psScript = `
      Get-Process | Where-Object {$_.MainWindowTitle -ne ""} | Select-Object Id,ProcessName,MainWindowTitle | ConvertTo-Json
    `;

    const { stdout } = await execAsync(`powershell -Command "${psScript}"`);

    if (!stdout.trim()) {
      return [];
    }

    const processes = JSON.parse(stdout);

    // Convertir en format attendu
    if (Array.isArray(processes)) {
      return processes.map((p) => ({
        id: p.Id,
        title: p.MainWindowTitle,
        processId: p.Id,
        processName: p.ProcessName,
      }));
    } else if (processes) {
      // Un seul processus
      return [
        {
          id: processes.Id,
          title: processes.MainWindowTitle,
          processId: processes.Id,
          processName: processes.ProcessName,
        },
      ];
    }

    return [];
  } catch (error) {
    console.error("Error listing windows:", error);
    return [];
  }
}

/**
 * Trouve une fenêtre par son titre (recherche floue)
 *
 * @param {string} partialTitle - Partie du titre à chercher (insensible à la casse)
 * @returns {Promise<object|null>} Fenêtre trouvée ou null
 */
async function findWindow(partialTitle) {
  const windows = await listWindows();
  const searchTerm = partialTitle.toLowerCase();

  return windows.find((w) => w.title.toLowerCase().includes(searchTerm));
}

/**
 * Met au premier plan la fenêtre spécifiée
 * Utilise un script VBS pour AppActivate
 *
 * @param {string} partialTitle - Titre de la fenêtre (ou partie du titre)
 * @returns {Promise<boolean>} True si succès, false si fenêtre non trouvée
 */
export async function focusWindow(partialTitle) {
  try {
    const window = await findWindow(partialTitle);

    if (!window) {
      return false;
    }

    // Script VBS pour activer la fenêtre
    const vbsScript = `
Set objShell = CreateObject("WScript.Shell")
objShell.AppActivate "${window.title.replace(/"/g, '""')}"
    `.trim();

    const { exec } = require("child_process");
    const fs = require("fs/promises");
    const path = require("path");
    const os = require("os");

    const tempDir = os.tmpdir();
    const scriptPath = path.join(tempDir, `jarvis-focus-${Date.now()}.vbs`);

    await fs.writeFile(scriptPath, vbsScript, "utf-8");

    await execAsync(`cscript //nologo "${scriptPath}"`);

    // Cleanup
    await fs.unlink(scriptPath).catch(() => {});

    return true;
  } catch (error) {
    console.error("Error focusing window:", error);
    return false;
  }
}

/**
 * Ferme la fenêtre spécifiée
 * Utilise PowerShell Stop-Process
 *
 * @param {string} partialTitle - Titre de la fenêtre
 * @returns {Promise<boolean>} True si succès, false sinon
 */
export async function closeWindow(partialTitle) {
  try {
    const window = await findWindow(partialTitle);

    if (!window) {
      return false;
    }

    // Utiliser PowerShell pour fermer proprement
    const psScript = `Stop-Process -Id ${window.processId}`;
    await execAsync(`powershell -Command "${psScript}"`);

    return true;
  } catch (error) {
    console.error("Error closing window:", error);
    return false;
  }
}

/**
 * Minimise (réduit) la fenêtre spécifiée
 * Utilise PowerShell avec user32.dll ShowWindow (SW_MINIMIZE = 6)
 *
 * @param {string} partialTitle - Titre de la fenêtre
 * @returns {Promise<boolean>} True si succès, false sinon
 */
export async function minimizeWindow(partialTitle) {
  try {
    const window = await findWindow(partialTitle);

    if (!window) {
      return false;
    }

    // Script PowerShell avec P/Invoke user32.dll
    const psScript = `
$code = @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
}
"@
Add-Type -TypeDefinition $code
$hwnd = (Get-Process -Id ${window.processId}).MainWindowHandle
[Win32]::ShowWindow($hwnd, 6)
    `.trim();

    await execAsync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`);

    return true;
  } catch (error) {
    console.error("Error minimizing window:", error);
    return false;
  }
}

/**
 * Agrandit (maximize) la fenêtre spécifiée
 * Utilise PowerShell avec user32.dll ShowWindow (SW_MAXIMIZE = 3)
 *
 * @param {string} partialTitle - Titre de la fenêtre
 * @returns {Promise<boolean>} True si succès, false sinon
 */
export async function maximizeWindow(partialTitle) {
  try {
    const window = await findWindow(partialTitle);

    if (!window) {
      return false;
    }

    // Script PowerShell avec P/Invoke user32.dll
    const psScript = `
$code = @"
using System;
using System.Runtime.InteropServices;
public class Win32Max {
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@
Add-Type -TypeDefinition $code
$hwnd = (Get-Process -Id ${window.processId}).MainWindowHandle
[Win32Max]::ShowWindow($hwnd, 3)
    `.trim();

    await execAsync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`);

    return true;
  } catch (error) {
    console.error("Error maximizing window:", error);
    return false;
  }
}

/**
 * Restore (restaure taille normale) la fenêtre spécifiée
 * Annule minimize ou maximize (SW_RESTORE = 9)
 *
 * @param {string} partialTitle - Titre de la fenêtre
 * @returns {Promise<boolean>} True si succès, false sinon
 */
export async function restoreWindow(partialTitle) {
  try {
    const window = await findWindow(partialTitle);

    if (!window) {
      return false;
    }

    const psScript = `
$code = @"
using System;
using System.Runtime.InteropServices;
public class Win32Restore {
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@
Add-Type -TypeDefinition $code
$hwnd = (Get-Process -Id ${window.processId}).MainWindowHandle
[Win32Restore]::ShowWindow($hwnd, 9)
    `.trim();

    await execAsync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`);

    return true;
  } catch (error) {
    console.error("Error restoring window:", error);
    return false;
  }
}
