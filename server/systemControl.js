import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import fg from "fast-glob";
import screenshot from "screenshot-desktop";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Exécute une commande PowerShell encodée pour éviter les problèmes de caractères spéciaux
 * @param {string} script - Le script PowerShell à exécuter
 */
async function execEncodedPowerShell(script) {
  const encoded = Buffer.from(script, "utf16le").toString("base64");
  return new Promise((resolve, reject) => {
    exec(`powershell -EncodedCommand ${encoded}`, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout.trim());
    });
  });
}

/**
 * Contrôle le volume audio système via un script PowerShell externe robuste
 * @param {Object} params - Action ("set", "increase", "decrease", "mute", "unmute") et valeur (0-100)
 */
export async function controlVolume({ action, value = 0 }) {
  const scriptPath = path.join(__dirname, "scripts", "volumeControl.ps1");
  const command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -action "${action}" -value ${value}`;

  console.log(
    `🔊 [SystemControl] Exécution: ${action}${value ? ` à ${value}%` : ""}`,
  );

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ [SystemControl] Erreur script volume: ${stderr}`);
        reject(error);
      } else {
        console.log(`✅ [SystemControl] Réponse: ${stdout.trim()}`);
        resolve({ success: true, message: stdout.trim() });
      }
    });
  });
}

export async function controlBrightness({ action, value }) {
  let psScript = "";
  if (action === "set") {
    psScript = `(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, ${value})`;
  } else {
    const diff = action === "increase" ? 10 : -10;
    psScript = `
      $b = (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness).CurrentBrightness;
      $newB = $b + ${diff};
      if ($newB -gt 100) { $newB = 100 }
      if ($newB -lt 0) { $newB = 0 }
      (Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, $newB);
    `;
  }
  await execEncodedPowerShell(psScript);
  return { success: true };
}

/**
 * Gestion des sessions
 */
export async function controlSession({ action, delay = 0 }) {
  let command = "";
  switch (action) {
    case "lock":
      command = "rundll32.exe user32.dll,LockWorkStation";
      break;
    case "shutdown":
      command = `shutdown /s /t ${delay}`;
      break;
    case "restart":
      command = `shutdown /r /t ${delay}`;
      break;
    case "sleep":
      command =
        "powershell -Command \"Add-Type -Assembly 'System.Windows.Forms'; [System.Windows.Forms.Application]::SetSuspendState([System.Windows.Forms.PowerState]::Suspend, $false, $false)\"";
      break;
  }
  return new Promise((resolve, reject) => {
    exec(command, (err) => (err ? reject(err) : resolve({ success: true })));
  });
}

/**
 * Contrôle média via simulation de touches Windows
 */
export async function controlMedia({ action }) {
  const codes = { play: 179, pause: 179, next: 176, previous: 177, stop: 178 };
  const command = `powershell -Command \"(New-Object -ComObject WScript.Shell).SendKeys([char]${codes[action]})\"`;
  return new Promise((resolve, reject) => {
    exec(command, (err) => (err ? reject(err) : resolve({ success: true })));
  });
}

export async function manageFile({
  action,
  path: filePath,
  destination,
  type,
}) {
  try {
    const forbiddenPaths = ["system32", "windows", "program files"];
    const normalizedPath = filePath.toLowerCase();
    for (const forbidden of forbiddenPaths) {
      if (normalizedPath.includes(forbidden))
        return { success: false, message: `Accès interdit: ${forbidden}` };
    }
    switch (action) {
      case "create":
        if (type === "directory") await fs.mkdir(filePath, { recursive: true });
        else await fs.writeFile(filePath, "");
        break;
      case "delete":
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) await fs.rm(filePath, { recursive: true });
        else await fs.unlink(filePath);
        break;
      case "move":
        await fs.rename(filePath, destination);
        break;
      case "copy":
        await fs.copyFile(filePath, destination);
        break;
    }
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function searchFiles({
  query,
  path: searchPath,
  maxResults = 50,
}) {
  try {
    const basePath = searchPath || process.env.USERPROFILE;
    const pattern = `${basePath.replace(/\\/g, "/")}/**/*${query}*`;
    const results = await fg(pattern, {
      caseSensitiveMatch: false,
      ignore: ["**/node_modules/**", "**/.git/**", "**/AppData/**"],
      onlyFiles: true,
      absolute: true,
    });
    return {
      success: true,
      results: results.slice(0, maxResults),
      total: results.length,
    };
  } catch (error) {
    return { success: false, results: [], message: error.message };
  }
}

export async function takeScreenshot({ savePath }) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const finalPath =
      savePath ||
      path.join(
        process.env.USERPROFILE,
        "Desktop",
        `JARVIS_screenshot_${timestamp}.png`,
      );
    const imgBuffer = await screenshot();
    await fs.writeFile(finalPath, imgBuffer);
    return { success: true, path: finalPath };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
