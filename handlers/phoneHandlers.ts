/**
 * Handlers pour contrôle smartphone via KDE Connect
 * - Notifications push
 * - Appels téléphoniques
 * - SMS
 * - Batterie
 */

import type { HandlerContext } from "../types/app.types";
import { SystemStatus } from "../types";

const API_BASE = "http://localhost:3001";

/**
 * Handler notification smartphone
 * Envoie une notification push sur le téléphone Android
 */
export const handleSendPhoneNotification = async (
  args: { title: string; message: string },
  ctx: HandlerContext,
) => {
  const { addLog, setStatus, speak } = ctx;
  const { title, message } = args;

  addLog(`Envoi notification: ${title}`, "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/phone/notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message }),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    speak(`Notification envoyée sur votre téléphone, Monsieur.`);
    addLog(`Notification envoyée: ${title}`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      data: data.result,
      message: "Notification envoyée",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    addLog(`Erreur notification: ${errorMsg}`, "SYSTEM", "error");
    speak("Impossible d'envoyer la notification, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
    
    return {
      status: "error",
      message: errorMsg,
    };
  }
};

/**
 * Handler appel téléphonique
 * Lance un appel sur le smartphone Android
 */
export const handleMakePhoneCall = async (
  args: { phone_number: string; contact_name?: string },
  ctx: HandlerContext,
) => {
  const { addLog, setStatus, speak } = ctx;
  const { phone_number, contact_name } = args;

  const target = contact_name || phone_number;
  addLog(`Lancement appel: ${target}`, "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/phone/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: phone_number }),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    const message = contact_name 
      ? `J'appelle ${contact_name}, Monsieur.`
      : `J'appelle le ${phone_number}, Monsieur.`;
    
    speak(message);
    addLog(`Appel lancé: ${target}`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      data: data.result,
      message: "Appel lancé",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    addLog(`Erreur appel: ${errorMsg}`, "SYSTEM", "error");
    speak("Impossible de lancer l'appel, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
    
    return {
      status: "error",
      message: errorMsg,
    };
  }
};

/**
 * Handler SMS
 * Envoie un SMS depuis le smartphone Android
 */
export const handleSendSMS = async (
  args: { phone_number: string; message: string; contact_name?: string },
  ctx: HandlerContext,
) => {
  const { addLog, setStatus, speak } = ctx;
  const { phone_number, message, contact_name } = args;

  const target = contact_name || phone_number;
  addLog(`Envoi SMS à ${target}`, "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/phone/sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: phone_number, message }),
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();

    const voiceMessage = contact_name 
      ? `SMS envoyé à ${contact_name}, Monsieur.`
      : `SMS envoyé au ${phone_number}, Monsieur.`;
    
    speak(voiceMessage);
    addLog(`SMS envoyé à ${target}`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      data: data.result,
      message: "SMS envoyé",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    addLog(`Erreur SMS: ${errorMsg}`, "SYSTEM", "error");
    speak("Impossible d'envoyer le SMS, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
    
    return {
      status: "error",
      message: errorMsg,
    };
  }
};

/**
 * Handler batterie smartphone
 * Récupère le niveau de batterie du téléphone
 */
export const handlePhoneBattery = async (
  _args: Record<string, never>,
  ctx: HandlerContext,
) => {
  const { addLog, setStatus, speak } = ctx;

  addLog("Récupération batterie smartphone...", "SYSTEM", "info");
  setStatus(SystemStatus.PROCESSING);

  try {
    const response = await fetch(`${API_BASE}/api/phone/battery`);
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    const battery = data.battery;

    let message = `La batterie de votre téléphone est à ${battery.level} pourcent`;
    
    if (battery.charging) {
      message += ", en charge";
    } else if (battery.level < 20) {
      message += ". Attention, batterie faible";
    }
    
    message += ", Monsieur.";

    speak(message);
    addLog(`Batterie smartphone: ${battery.level}%`, "SYSTEM", "success");
    setStatus(SystemStatus.IDLE);

    return {
      status: "success",
      data: battery,
      message,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    addLog(`Erreur batterie: ${errorMsg}`, "SYSTEM", "error");
    speak("Impossible de récupérer le niveau de batterie, Monsieur.");
    setStatus(SystemStatus.ERROR);
    setTimeout(() => setStatus(SystemStatus.IDLE), 2000);
    
    return {
      status: "error",
      message: errorMsg,
    };
  }
};
