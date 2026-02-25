/**
 * Service Système Windows
 * - Gestion fenêtres multi-écrans
 * - Gestionnaire de tâches (processus)
 * - Contrôle audio (volume, mute)
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Déplace une fenêtre vers un écran spécifique
 * Utilise PowerShell pour gérer les fenêtres multi-écrans
 */
export async function moveWindowToScreen(appName, screenNumber) {
  try {
    // Script PowerShell pour déplacer fenêtre vers écran spécifique
    const psScript = `
      Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        public class Win32 {
          [DllImport("user32.dll")]
          public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
          [DllImport("user32.dll")]
          public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
          [DllImport("user32.dll")]
          public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
          public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
        }
"@
      $hwnd = [Win32]::FindWindow($null, "*${appName}*")
      if ($hwnd -eq [IntPtr]::Zero) { throw "Fenêtre non trouvée" }
      
      # Calculer position selon numéro écran (écran 1 = 0,0 / écran 2 = 1920,0 / etc.)
      $screenX = (${screenNumber} - 1) * 1920
      [Win32]::SetWindowPos($hwnd, [IntPtr]::Zero, $screenX, 0, 0, 0, 0x0001)
      Write-Output "OK"
    `;

    const { stdout, stderr } = await execAsync(
      `powershell -Command "${psScript.replace(/"/g, '\\"')}"`,
    );

    if (stderr && !stderr.includes("OK")) {
      throw new Error(stderr);
    }

    return {
      success: true,
      appName,
      screenNumber,
      message: `Fenêtre déplacée vers écran ${screenNumber}`,
    };
  } catch (error) {
    console.error("Erreur moveWindowToScreen:", error.message);
    throw new Error(`Impossible de déplacer la fenêtre: ${error.message}`);
  }
}

/**
 * Liste les processus actifs avec utilisation CPU/RAM
 * Utilise PowerShell Get-Process
 */
export async function listProcesses(sortBy = "cpu", limit = 10) {
  try {
    const sortProperty = sortBy === "cpu" ? "CPU" : "WS";
    const psScript = `
      Get-Process | 
      Where-Object { $_.MainWindowTitle -ne "" -or $_.CPU -gt 0 } |
      Sort-Object ${sortProperty} -Descending |
      Select-Object -First ${limit} Name, 
        @{Name="CPUPercent";Expression={[math]::Round($_.CPU, 2)}},
        @{Name="MemoryMB";Expression={[math]::Round($_.WS / 1MB, 2)}},
        Id |
      ConvertTo-Json
    `;

    const { stdout, stderr } = await execAsync(
      `powershell -Command "${psScript.replace(/"/g, '\\"')}"`,
    );

    if (stderr) {
      console.error("PowerShell stderr:", stderr);
    }

    const processes = JSON.parse(stdout || "[]");

    // Normaliser format (PowerShell retourne objet unique si 1 seul résultat)
    const processArray = Array.isArray(processes) ? processes : [processes];

    return processArray.map((p) => ({
      name: p.Name,
      cpuPercent: p.CPUPercent || 0,
      memoryMB: p.MemoryMB || 0,
      pid: p.Id,
    }));
  } catch (error) {
    console.error("Erreur listProcesses:", error.message);
    throw new Error(`Impossible de lister les processus: ${error.message}`);
  }
}

/**
 * Termine un processus par son nom
 * Utilise taskkill (Windows)
 */
export async function killProcess(processName, force = false) {
  try {
    const forceFlag = force ? "/F" : "";
    const { stdout, stderr } = await execAsync(
      `taskkill /IM "${processName}.exe" ${forceFlag}`,
    );

    if (stderr && !stdout.includes("SUCCESS")) {
      throw new Error(stderr);
    }

    return {
      success: true,
      processName,
      message: `Processus ${processName} terminé`,
    };
  } catch (error) {
    console.error("Erreur killProcess:", error.message);
    throw new Error(`Impossible de terminer le processus: ${error.message}`);
  }
}

/**
 * Contrôle volume système Windows
 * Utilise NirCmd (outil externe léger) ou PowerShell
 */
export async function setVolume(level) {
  try {
    // Convertir niveau 0-100 en niveau Windows 0-65535
    const windowsLevel = Math.round((level / 100) * 65535);

    const psScript = `
      Add-Type -TypeDefinition @"
        using System.Runtime.InteropServices;
        [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        interface IAudioEndpointVolume {
          int NotImpl1(); int NotImpl2();
          int SetMasterVolumeLevelScalar(float fLevel, System.Guid pguidEventContext);
          int NotImpl4(); int GetMasterVolumeLevelScalar(out float pfLevel);
        }
        [Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject { }
        [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        interface IMMDeviceEnumerator {
          int NotImpl1();
          int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
        }
        [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        interface IMMDevice {
          int Activate(ref System.Guid id, int clsCtx, int activationParams, out IAudioEndpointVolume aev);
        }
        public class Audio {
          public static void SetVolume(float level) {
            var enumerator = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
            IMMDevice dev = null;
            enumerator.GetDefaultAudioEndpoint(0, 0, out dev);
            IAudioEndpointVolume aev = null;
            System.Guid IID_IAudioEndpointVolume = typeof(IAudioEndpointVolume).GUID;
            dev.Activate(ref IID_IAudioEndpointVolume, 0, 0, out aev);
            aev.SetMasterVolumeLevelScalar(level, System.Guid.Empty);
          }
        }
"@
      [Audio]::SetVolume(${level / 100})
      Write-Output "OK"
    `;

    const { stdout, stderr } = await execAsync(
      `powershell -Command "${psScript.replace(/"/g, '\\"')}"`,
    );

    if (stderr && !stdout.includes("OK")) {
      throw new Error(stderr);
    }

    return { success: true, level, message: `Volume réglé à ${level}%` };
  } catch (error) {
    console.error("Erreur setVolume:", error.message);
    throw new Error(`Impossible de régler le volume: ${error.message}`);
  }
}

/**
 * Mute/Unmute audio système
 */
export async function muteAudio(mute = true) {
  try {
    const psScript = `
      (New-Object -ComObject WScript.Shell).SendKeys([char]173)
      Write-Output "OK"
    `;

    const { stdout, stderr } = await execAsync(
      `powershell -Command "${psScript.replace(/"/g, '\\"')}"`,
    );

    if (stderr && !stdout.includes("OK")) {
      throw new Error(stderr);
    }

    return {
      success: true,
      muted: mute,
      message: mute ? "Audio coupé" : "Audio rétabli",
    };
  } catch (error) {
    console.error("Erreur muteAudio:", error.message);
    throw new Error(`Impossible de mute/unmute: ${error.message}`);
  }
}

/**
 * Récupère le niveau de volume actuel
 */
export async function getVolume() {
  try {
    const psScript = `
      Add-Type -TypeDefinition @"
        using System.Runtime.InteropServices;
        [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        interface IAudioEndpointVolume {
          int NotImpl1(); int NotImpl2(); int NotImpl3(); int NotImpl4();
          int GetMasterVolumeLevelScalar(out float pfLevel);
          int GetMute(out bool pbMute);
        }
        [Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorComObject { }
        [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        interface IMMDeviceEnumerator {
          int NotImpl1();
          int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
        }
        [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        interface IMMDevice {
          int Activate(ref System.Guid id, int clsCtx, int activationParams, out IAudioEndpointVolume aev);
        }
        public class Audio {
          public static float GetVolume() {
            var enumerator = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
            IMMDevice dev = null;
            enumerator.GetDefaultAudioEndpoint(0, 0, out dev);
            IAudioEndpointVolume aev = null;
            System.Guid IID_IAudioEndpointVolume = typeof(IAudioEndpointVolume).GUID;
            dev.Activate(ref IID_IAudioEndpointVolume, 0, 0, out aev);
            float level;
            aev.GetMasterVolumeLevelScalar(out level);
            return level;
          }
        }
"@
      $level = [Audio]::GetVolume()
      Write-Output ([math]::Round($level * 100))
    `;

    const { stdout, stderr } = await execAsync(
      `powershell -Command "${psScript.replace(/"/g, '\\"')}"`,
    );

    if (stderr) {
      console.error("PowerShell stderr:", stderr);
    }

    const level = parseInt(stdout.trim(), 10);

    return { level, muted: false };
  } catch (error) {
    console.error("Erreur getVolume:", error.message);
    throw new Error(`Impossible de récupérer le volume: ${error.message}`);
  }
}
