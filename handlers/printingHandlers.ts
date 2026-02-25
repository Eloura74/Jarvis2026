/**
 * Handlers pour impression 3D Bambu Lab
 * - Caméra A1 mini (stream RTSP/HTTP)
 * - Statut imprimantes (VZ330, P1S, A1)
 * - Analyse G-code (durée, poids, coût)
 */

import type { HandlerContext } from "../types/app.types";
import { SystemStatus } from "../types";

const API_BASE = "http://localhost:3001";

/**
 * Handler caméra imprimante 3D
 * Affiche stream webcam d'une imprimante Bambu Lab
 */
export const handlePrinterCamera = async (
  args: { printer_name: string; webcam_url?: string },
  ctx: HandlerContext,
) => {
  const { addLog, setStatus, speak } = ctx;
  const { printer_name, webcam_url } = args;

  addLog(`Affichage caméra ${printer_name}...`, "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    // Si pas d'URL fournie, récupérer depuis config Home Assistant
    let cameraUrl = webcam_url;
    
    if (!cameraUrl) {
      // TODO: Récupérer URL depuis HA_ENTITIES.PRINTERS
      // Pour l'instant, URLs par défaut selon nom imprimante
      const defaultUrls: Record<string, string> = {
        "VZ330": "http://192.168.1.130/webcam/?action=stream",
        "P1S": "http://192.168.1.131/webcam/?action=stream",
        "A1": "http://192.168.1.132/webcam/?action=stream",
      };
      
      cameraUrl = defaultUrls[printer_name] || "";
    }

    if (!cameraUrl) {
      throw new Error(`URL caméra non trouvée pour ${printer_name}`);
    }

    speak(`Affichage de la caméra ${printer_name}, Monsieur.`);
    addLog(`Caméra ${printer_name}: ${cameraUrl}`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    // TODO: Afficher overlay HUD caméra imprimante
    return {
      status: "success",
      data: {
        printer_name,
        webcam_url: cameraUrl,
      },
      message: `Caméra ${printer_name} affichée`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    addLog(`Erreur caméra: ${errorMsg}`, "SYSTEM", "error");
    speak(`Impossible d'afficher la caméra ${printer_name}, Monsieur.`);
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
    
    return {
      status: "error",
      message: errorMsg,
    };
  }
};

/**
 * Handler statut imprimantes
 * Récupère état de toutes les imprimantes Bambu Lab via MQTT
 */
export const handlePrinterStatus = async (
  args: { printer_name?: string },
  ctx: HandlerContext,
) => {
  const { addLog, setStatus, speak } = ctx;
  const { printer_name } = args;

  const target = printer_name || "toutes les imprimantes";
  addLog(`Récupération statut ${target}...`, "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const endpoint = printer_name 
      ? `/api/bambu/status/${encodeURIComponent(printer_name)}`
      : "/api/bambu/status";

    const response = await fetch(`${API_BASE}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    
    // Construire réponse vocale
    let message = "";
    
    if (printer_name) {
      const status = data.status;
      message = `${printer_name} : ${status.state}`;
      
      if (status.progress) {
        message += `, progression ${status.progress}%`;
      }
      
      if (status.time_remaining) {
        message += `, temps restant ${status.time_remaining}`;
      }
    } else {
      const printers = data.printers || [];
      const printing = printers.filter((p: any) => p.state === "printing");
      const idle = printers.filter((p: any) => p.state === "idle");
      
      if (printing.length > 0) {
        message = `${printing.length} imprimante${printing.length > 1 ? 's' : ''} en cours d'impression. `;
        message += printing.map((p: any) => `${p.name} à ${p.progress}%`).join(", ");
      } else {
        message = "Toutes les imprimantes sont au repos, Monsieur.";
      }
    }

    speak(message);
    addLog(`Statut imprimantes récupéré`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    // TODO: Afficher overlay HUD statut imprimantes
    return {
      status: "success",
      data,
      message,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    addLog(`Erreur statut imprimantes: ${errorMsg}`, "SYSTEM", "error");
    speak("Impossible de récupérer le statut des imprimantes, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
    
    return {
      status: "error",
      message: errorMsg,
    };
  }
};

/**
 * Handler analyse G-code
 * Analyse fichier G-code pour estimer durée, poids, coût
 */
export const handleAnalyzeGcode = async (
  args: { file_path: string },
  ctx: HandlerContext,
) => {
  const { addLog, setStatus, speak } = ctx;
  const { file_path } = args;

  addLog(`Analyse G-code ${file_path}...`, "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/bambu/analyze-gcode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_path }),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.analysis;

    // Construire réponse vocale
    let message = `Analyse du fichier ${analysis.filename} : `;
    message += `durée estimée ${analysis.print_time}, `;
    message += `poids ${analysis.filament_weight} grammes, `;
    message += `coût environ ${analysis.cost} euros.`;

    speak(message);
    addLog(`G-code analysé: ${analysis.print_time}, ${analysis.filament_weight}g`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    // TODO: Afficher overlay HUD analyse G-code
    return {
      status: "success",
      data: analysis,
      message,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    addLog(`Erreur analyse G-code: ${errorMsg}`, "SYSTEM", "error");
    speak("Impossible d'analyser le fichier G-code, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
    
    return {
      status: "error",
      message: errorMsg,
    };
  }
};
