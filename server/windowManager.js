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
    // Utiliser des guillemets simples pour éviter les problèmes d'échappement
    const psCommand = `Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object Id,ProcessName,MainWindowTitle | ConvertTo-Json -Compress`;

    console.log(`[listWindows] Executing PowerShell command...`);
    
    // Utiliser une syntaxe plus robuste avec des apostrophes pour encapsuler le script
    const { stdout, stderr } = await execAsync(
      `powershell.exe -ExecutionPolicy Bypass -NoProfile -NonInteractive -Command "& {${psCommand}}"`,
      { 
        encoding: 'utf8', 
        maxBuffer: 1024 * 1024,
        timeout: 10000,
        windowsHide: true
      }
    );
    
    console.log(`[listWindows] stdout length: ${stdout.length} chars, stderr length: ${stderr?.length || 0} chars`);
    
    if (stderr && stderr.trim().length > 0) {
      console.log(`[listWindows] ⚠️ PowerShell stderr:`, stderr.trim());
    }
    
    if (stdout.length > 0 && stdout.length < 1000) {
      console.log(`[listWindows] Raw output:`, stdout.trim());
    } else if (stdout.length >= 1000) {
      console.log(`[listWindows] Got ${stdout.length} chars of output (too long to display)`);
    }

    if (!stdout.trim()) {
      console.log(`[listWindows] ❌ Empty output from PowerShell`);
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
 * Essaie plusieurs variantes du nom pour être plus tolérant
 *
 * @param {string} partialTitle - Partie du titre à chercher (insensible à la casse)
 * @param {number} maxRetries - Nombre de tentatives (pour attendre que la fenêtre apparaisse)
 * @returns {Promise<object|null>} Fenêtre trouvée ou null
 */
async function findWindow(partialTitle, maxRetries = 5) {
  const searchTerm = partialTitle.toLowerCase();
  
  // Générer des variantes de recherche
  const searchVariants = [
    searchTerm,
    searchTerm.replace(/bloc-notes/i, 'notepad'),
    searchTerm.replace(/notepad/i, 'bloc-notes'),
    searchTerm.replace(/calculatrice/i, 'calculator'),
    searchTerm.replace(/calculator/i, 'calculatrice'),
  ];
  
  // Essayer plusieurs fois (pour attendre que la fenêtre se crée)
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const windows = await listWindows();
    
    // DEBUG: Afficher toutes les fenêtres sur la première tentative
    if (attempt === 0) {
      console.log(`🔍 Available windows (${windows.length}):`);
      if (windows.length === 0) {
        console.log(`   ⚠️ No windows found by PowerShell!`);
      } else {
        windows.forEach(w => {
          console.log(`   - "${w.title}" (${w.processName})`);
        });
      }
    }
    
    // Chercher avec toutes les variantes
    for (const variant of searchVariants) {
      const found = windows.find((w) => {
        const title = w.title.toLowerCase();
        const processName = w.processName?.toLowerCase() || '';
        
        // Chercher dans le titre ET le nom du processus
        return title.includes(variant) || processName.includes(variant);
      });
      
      if (found) {
        console.log(`✅ Window found: "${found.title}" (${found.processName})`);
        return found;
      }
    }
    
    // Attendre 800ms avant de réessayer (augmenté de 500ms)
    if (attempt < maxRetries - 1) {
      console.log(`⏳ Attempt ${attempt + 1}/${maxRetries} - Window not found yet, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }
  
  console.log(`❌ Window "${partialTitle}" not found after ${maxRetries} attempts`);
  return null;
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
      console.log(`❌ Window "${partialTitle}" not found`);
      return false;
    }

    console.log(`➡️ Closing window: "${window.title}" (PID: ${window.processId})`);

    // Utiliser PowerShell pour fermer proprement
    const psScript = `Stop-Process -Id ${window.processId}`;
    const { stdout, stderr } = await execAsync(`powershell -Command "${psScript}"`);  
    
    console.log(`✅ Process closed`);
    if (stderr) console.error(`⚠️ PowerShell stderr: ${stderr}`);

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
      console.log(`❌ Window "${partialTitle}" not found`);
      return false;
    }

    console.log(`➡️ Minimizing window: "${window.title}" (PID: ${window.processId})`);

    // Utiliser ShowWindow via API Windows (6 = SW_MINIMIZE)
    // Encoder en Base64 pour éviter tous les problèmes d'échappement
    const psCommand = `$proc = Get-Process -Id ${window.processId} -ErrorAction Stop; if ($proc.MainWindowHandle -ne 0) { $signature = '[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);'; $type = Add-Type -MemberDefinition $signature -Name Win32ShowWindow -Namespace User32 -PassThru; $result = $type::ShowWindow($proc.MainWindowHandle, 6); Write-Output "Result: $result" } else { Write-Output "Error: No window handle" }`;
    const psCommandBase64 = Buffer.from(psCommand, 'utf16le').toString('base64');

    const { stdout, stderr } = await execAsync(
      `powershell.exe -ExecutionPolicy Bypass -NoProfile -NonInteractive -EncodedCommand ${psCommandBase64}`,
      { encoding: 'utf8', timeout: 5000 }
    );
    
    console.log(`✅ PowerShell output: ${stdout.trim()}`);
    if (stderr && stderr.trim()) console.error(`⚠️ PowerShell stderr: ${stderr.trim()}`);

    return stdout.includes('True') || stdout.includes('Result');
  } catch (error) {
    console.error("Error minimizing window:", error.message);
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
      console.log(`❌ Window "${partialTitle}" not found`);
      return false;
    }

    console.log(`➡️ Maximizing window: "${window.title}" (PID: ${window.processId})`);

    // Utiliser ShowWindow via API Windows (3 = SW_MAXIMIZE)
    // Encoder en Base64 pour éviter tous les problèmes d'échappement
    const psCommand = `$proc = Get-Process -Id ${window.processId} -ErrorAction Stop; if ($proc.MainWindowHandle -ne 0) { $signature = '[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);'; $type = Add-Type -MemberDefinition $signature -Name Win32ShowWindowMax -Namespace User32Max -PassThru; $result = $type::ShowWindow($proc.MainWindowHandle, 3); Write-Output "Result: $result" } else { Write-Output "Error: No window handle" }`;
    const psCommandBase64 = Buffer.from(psCommand, 'utf16le').toString('base64');

    const { stdout, stderr } = await execAsync(
      `powershell.exe -ExecutionPolicy Bypass -NoProfile -NonInteractive -EncodedCommand ${psCommandBase64}`,
      { encoding: 'utf8', timeout: 5000 }
    );
    
    console.log(`✅ PowerShell output: ${stdout.trim()}`);
    if (stderr && stderr.trim()) console.error(`⚠️ PowerShell stderr: ${stderr.trim()}`);

    return stdout.includes('True') || stdout.includes('Result');
  } catch (error) {
    console.error("Error maximizing window:", error.message);
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
      console.log(`❌ Window "${partialTitle}" not found`);
      return false;
    }

    console.log(`➡️ Restoring window: "${window.title}" (PID: ${window.processId})`);

    // Utiliser ShowWindow via API Windows (9 = SW_RESTORE)
    // Encoder en Base64 pour éviter tous les problèmes d'échappement
    const psCommand = `$proc = Get-Process -Id ${window.processId} -ErrorAction Stop; if ($proc.MainWindowHandle -ne 0) { $signature = '[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);'; $type = Add-Type -MemberDefinition $signature -Name Win32ShowWindowRestore -Namespace User32Restore -PassThru; $result = $type::ShowWindow($proc.MainWindowHandle, 9); Write-Output "Result: $result" } else { Write-Output "Error: No window handle" }`;
    const psCommandBase64 = Buffer.from(psCommand, 'utf16le').toString('base64');

    const { stdout, stderr } = await execAsync(
      `powershell.exe -ExecutionPolicy Bypass -NoProfile -NonInteractive -EncodedCommand ${psCommandBase64}`,
      { encoding: 'utf8', timeout: 5000 }
    );
    
    console.log(`✅ PowerShell output: ${stdout.trim()}`);
    if (stderr && stderr.trim()) console.error(`⚠️ PowerShell stderr: ${stderr.trim()}`);

    return stdout.includes('True') || stdout.includes('Result');
  } catch (error) {
    console.error("Error restoring window:", error.message);
    return false;
  }
}
