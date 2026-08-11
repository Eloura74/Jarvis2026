/**
 * Service pour la gestion du Ducking Audio (Baisse du son)
 * Utilise un script PowerShell personnalisé pour baisser le volume des applications
 * individuelles (Volume Mixer) en excluant le processus courant (Node) et les navigateurs Web (Chrome/Edge).
 */

import { execFile } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let isDucked = false;
let isExecuting = false;

// Baisse le volume partiel
export async function duckAudio() {
  if (isDucked || isExecuting) return;
  isExecuting = true;

  try {
    const scriptPath = join(__dirname, "audioDucking.ps1");
    // Execution du script PowerShell en appel non bloquant
    execFile(
      "powershell.exe",
      [
        "-ExecutionPolicy",
        "Bypass",
        "-NoProfile",
        "-File",
        scriptPath,
        "-Action",
        "duck",
      ],
      (error, stdout, stderr) => {
        if (error) {
          console.error("[Ducking] Erreur ps1 duck:", error.message);
        } else {
          isDucked = true;
          console.log("[Ducking] Applications locales atténuées (Duck)");
        }
        isExecuting = false;
      },
    );
  } catch (error) {
    console.error("[Ducking] Erreur duckAudio:", error.message);
    isExecuting = false;
  }
}

// Restaure le volume précédent
export async function restoreAudio() {
  if (!isDucked || isExecuting) return;
  isExecuting = true;

  try {
    const scriptPath = join(__dirname, "audioDucking.ps1");
    execFile(
      "powershell.exe",
      [
        "-ExecutionPolicy",
        "Bypass",
        "-NoProfile",
        "-File",
        scriptPath,
        "-Action",
        "restore",
      ],
      (error, stdout, stderr) => {
        if (error) {
          console.error("[Ducking] Erreur ps1 restore:", error.message);
        } else {
          console.log("[Ducking] Volumes restaurés.");
        }
        isDucked = false;
        isExecuting = false;
      },
    );
  } catch (error) {
    console.error("[Ducking] Erreur restoreAudio:", error.message);
    isDucked = false;
    isExecuting = false;
  }
}
