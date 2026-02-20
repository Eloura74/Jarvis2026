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
const IS_WINDOWS = process.platform === "win32";

/**
 * Liste toutes les fenêtres ouvertes et visibles
 */
export async function listWindows() {
  if (!IS_WINDOWS) {
    try {
      // Version Linux utilisant wmctrl
      const { stdout } = await execAsync("wmctrl -l");
      return stdout
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const parts = line.split(/\s+/);
          const id = parts[0];
          const title = parts.slice(3).join(" ");
          return { id, title, processId: 0, processName: "linux-app" };
        });
    } catch (e) {
      console.warn("wmctrl non trouvé ou erreur Linux:", e.message);
      return [];
    }
  }

  // Reste du code Windows...
  try {
    // Forcer l'encodage UTF8 pour PowerShell pour éviter les problèmes de caractères spéciaux
    const psCommand = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object Id,ProcessName,MainWindowTitle | ConvertTo-Json -Compress`;

    const { stdout, stderr } = await execAsync(
      `powershell.exe -ExecutionPolicy Bypass -NoProfile -NonInteractive -Command "${psCommand}"`,
      {
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
        timeout: 10000,
        windowsHide: true,
      },
    );

    if (stderr && stderr.trim().length > 0) {
      console.log(`[listWindows] ⚠️ PowerShell stderr:`, stderr.trim());
    }

    if (stderr && stderr.trim().length > 0) {
      console.warn(`[listWindows] ⚠️ PowerShell stderr:`, stderr.trim());
    }

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
 * Essaie plusieurs variantes du nom pour être plus tolérant
 *
 * @param {string} partialTitle - Partie du titre à chercher (insensible à la casse)
 * @param {number} maxRetries - Nombre de tentatives (pour attendre que la fenêtre apparaisse)
 * @returns {Promise<object|null>} Fenêtre trouvée ou null
 */
async function findWindow(partialTitle, maxRetries = 5) {
  const query = partialTitle.toLowerCase();
  const queryWords = query.split(/[\s\-_]+/).filter((w) => w.length >= 2);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const windows = await listWindows();
    let bestMatch = null;
    let highestScore = 0;

    for (const w of windows) {
      // Nettoyage et normalisation
      const title = (w.title || "").toLowerCase();
      const processName = (w.processName || "").toLowerCase();
      const cleanTitle = title.replace(/[^\x00-\x7F]/g, " ");

      let score = 0;

      // 1. Match exact sur le nom du processus (Très fort)
      if (
        processName === query ||
        processName.replace(/[\s\-_]/g, "") === query.replace(/[\s\-_]/g, "")
      ) {
        score += 100;
      }

      // 2. Match exact sur le titre (Très fort)
      if (title.includes(query) || cleanTitle.includes(query)) {
        score += 80;
      }

      // 3. Match des mots individuels
      for (const word of queryWords) {
        if (processName.includes(word)) score += 40;
        if (title.includes(word)) score += 30;
        if (
          w.processName
            .toLowerCase()
            .replace(/[\s\-_]/g, "")
            .includes(word)
        )
          score += 20;
      }

      // 4. Bonus spécifique pour les cas connus (Bambu, Opera, etc.)
      if (
        (query.includes("bambu") || query.includes("studio")) &&
        (processName.includes("bambu") || title.includes("bambu"))
      ) {
        score += 50;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = w;
      }
    }

    // Seuil de confiance minimal
    if (bestMatch && highestScore >= 40) {
      console.log(
        `✅ [findWindow] Best match found (Score: ${highestScore}): "${bestMatch.title}" (${bestMatch.processName})`,
      );
      return bestMatch;
    }

    if (attempt < maxRetries - 1) {
      console.log(
        `⏳ [findWindow] Attempt ${attempt + 1}/${maxRetries} - No confident match yet (Best: ${highestScore}), retrying...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  console.log(
    `❌ [findWindow] No match found for "${partialTitle}" after ${maxRetries} attempts`,
  );
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
    if (!window) return false;

    if (!IS_WINDOWS) {
      await execAsync(`wmctrl -R "${window.title}"`);
      return true;
    }

    // Script VBS pour activer la fenêtre (Windows)
    const vbsScript = `
Set objShell = CreateObject("WScript.Shell")
objShell.AppActivate "${window.title.replace(/"/g, '""')}"
    `.trim();

    const fs = await import("fs/promises");
    const path = await import("path");
    const os = await import("os");
    const tempDir = os.tmpdir();
    const scriptPath = path.join(tempDir, `jarvis-focus-${Date.now()}.vbs`);
    await fs.writeFile(scriptPath, vbsScript, "utf-8");
    await execAsync(`cscript //nologo "${scriptPath}"`);
    await fs.unlink(scriptPath).catch(() => {});
    return true;
  } catch (error) {
    console.error("Error focusing window:", error);
    return false;
  }
}

export async function closeWindow(partialTitle) {
  try {
    const window = await findWindow(partialTitle);
    if (!window) return false;

    if (!IS_WINDOWS) {
      await execAsync(`wmctrl -c "${window.title}"`);
      return true;
    }

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
    if (!window) return false;

    if (!IS_WINDOWS) {
      // 0 = normal, 1 = minimize, 2 = maximize dans wmctrl (approx)
      // On utilise l'état _NET_WM_STATE_HIDDEN ou juste -b add,iconic
      await execAsync(`wmctrl -r "${window.title}" -b add,iconic`);
      return true;
    }

    const psCommand = `$proc = Get-Process -Id ${window.processId} -ErrorAction Stop; if ($proc.MainWindowHandle -ne 0) { $signature = '[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);'; $type = Add-Type -MemberDefinition $signature -Name Win32ShowWindow -Namespace User32 -PassThru; $result = $type::ShowWindow($proc.MainWindowHandle, 6); Write-Output "Result: $result" } else { Write-Output "Error: No window handle" }`;
    const psCommandBase64 = Buffer.from(psCommand, "utf16le").toString(
      "base64",
    );
    const { stdout } = await execAsync(
      `powershell.exe -ExecutionPolicy Bypass -NoProfile -NonInteractive -EncodedCommand ${psCommandBase64}`,
    );
    return stdout.includes("True") || stdout.includes("Result");
  } catch (error) {
    console.error("Error minimizing window:", error.message);
    return false;
  }
}

export async function maximizeWindow(partialTitle) {
  try {
    const window = await findWindow(partialTitle);
    if (!window) return false;

    if (!IS_WINDOWS) {
      await execAsync(
        `wmctrl -r "${window.title}" -b add,maximized_vert,maximized_horz`,
      );
      return true;
    }

    const psCommand = `$proc = Get-Process -Id ${window.processId} -ErrorAction Stop; if ($proc.MainWindowHandle -ne 0) { $signature = '[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);'; $type = Add-Type -MemberDefinition $signature -Name Win32ShowWindowMax -Namespace User32Max -PassThru; $result = $type::ShowWindow($proc.MainWindowHandle, 3); Write-Output "Result: $result" } else { Write-Output "Error: No window handle" }`;
    const psCommandBase64 = Buffer.from(psCommand, "utf16le").toString(
      "base64",
    );
    const { stdout } = await execAsync(
      `powershell.exe -ExecutionPolicy Bypass -NoProfile -NonInteractive -EncodedCommand ${psCommandBase64}`,
    );
    return stdout.includes("True") || stdout.includes("Result");
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

    console.log(
      `➡️ Restoring window: "${window.title}" (PID: ${window.processId})`,
    );

    // Utiliser ShowWindow via API Windows (9 = SW_RESTORE)
    // Encoder en Base64 pour éviter tous les problèmes d'échappement
    const psCommand = `$proc = Get-Process -Id ${window.processId} -ErrorAction Stop; if ($proc.MainWindowHandle -ne 0) { $signature = '[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);'; $type = Add-Type -MemberDefinition $signature -Name Win32ShowWindowRestore -Namespace User32Restore -PassThru; $result = $type::ShowWindow($proc.MainWindowHandle, 9); Write-Output "Result: $result" } else { Write-Output "Error: No window handle" }`;
    const psCommandBase64 = Buffer.from(psCommand, "utf16le").toString(
      "base64",
    );

    const { stdout, stderr } = await execAsync(
      `powershell.exe -ExecutionPolicy Bypass -NoProfile -NonInteractive -EncodedCommand ${psCommandBase64}`,
      { encoding: "utf8", timeout: 5000 },
    );

    console.log(`✅ PowerShell output: ${stdout.trim()}`);
    if (stderr && stderr.trim())
      console.error(`⚠️ PowerShell stderr: ${stderr.trim()}`);

    return stdout.includes("True") || stdout.includes("Result");
  } catch (error) {
    console.error("Error restoring window:", error.message);
    return false;
  }
}
