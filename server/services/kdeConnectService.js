/**
 * Service KDE Connect pour contrôle smartphone Android
 * - Notifications push
 * - Appels téléphoniques
 * - SMS
 * - Batterie
 * - Localisation
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Envoie une notification push sur le smartphone
 * 
 * @param {string} title - Titre de la notification
 * @param {string} message - Message de la notification
 * @param {string} deviceId - ID du device KDE Connect (optionnel)
 * @returns {Promise<Object>} Résultat de l'envoi
 */
export async function sendNotification(title, message, deviceId = null) {
  try {
    const device = deviceId || await getDefaultDevice();
    
    if (!device) {
      throw new Error("Aucun smartphone connecté via KDE Connect");
    }

    // Commande KDE Connect CLI pour envoyer notification
    const command = `kdeconnect-cli -d ${device} --ping-msg "${title}: ${message}"`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes("sent")) {
      throw new Error(`KDE Connect error: ${stderr}`);
    }

    console.log(`📱 [KDEConnect] Notification envoyée: ${title}`);
    return {
      success: true,
      device,
      title,
      message,
    };
  } catch (error) {
    console.error("❌ [KDEConnect] Erreur notification:", error.message);
    throw error;
  }
}

/**
 * Lance un appel téléphonique
 * 
 * @param {string} phoneNumber - Numéro de téléphone
 * @param {string} deviceId - ID du device KDE Connect (optionnel)
 * @returns {Promise<Object>} Résultat de l'appel
 */
export async function makeCall(phoneNumber, deviceId = null) {
  try {
    const device = deviceId || await getDefaultDevice();
    
    if (!device) {
      throw new Error("Aucun smartphone connecté via KDE Connect");
    }

    // Nettoyer le numéro (retirer espaces, tirets)
    const cleanNumber = phoneNumber.replace(/[\s\-]/g, "");

    // Commande KDE Connect CLI pour lancer appel
    const command = `kdeconnect-cli -d ${device} --dial ${cleanNumber}`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      throw new Error(`KDE Connect error: ${stderr}`);
    }

    console.log(`📞 [KDEConnect] Appel lancé: ${phoneNumber}`);
    return {
      success: true,
      device,
      phoneNumber: cleanNumber,
    };
  } catch (error) {
    console.error("❌ [KDEConnect] Erreur appel:", error.message);
    throw error;
  }
}

/**
 * Envoie un SMS
 * 
 * @param {string} phoneNumber - Numéro de téléphone
 * @param {string} message - Message SMS
 * @param {string} deviceId - ID du device KDE Connect (optionnel)
 * @returns {Promise<Object>} Résultat de l'envoi
 */
export async function sendSMS(phoneNumber, message, deviceId = null) {
  try {
    const device = deviceId || await getDefaultDevice();
    
    if (!device) {
      throw new Error("Aucun smartphone connecté via KDE Connect");
    }

    // Nettoyer le numéro
    const cleanNumber = phoneNumber.replace(/[\s\-]/g, "");

    // Commande KDE Connect CLI pour envoyer SMS
    const command = `kdeconnect-cli -d ${device} --send-sms "${message}" --destination ${cleanNumber}`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      throw new Error(`KDE Connect error: ${stderr}`);
    }

    console.log(`💬 [KDEConnect] SMS envoyé à ${phoneNumber}`);
    return {
      success: true,
      device,
      phoneNumber: cleanNumber,
      message,
    };
  } catch (error) {
    console.error("❌ [KDEConnect] Erreur SMS:", error.message);
    throw error;
  }
}

/**
 * Récupère le niveau de batterie du smartphone
 * 
 * @param {string} deviceId - ID du device KDE Connect (optionnel)
 * @returns {Promise<Object>} Niveau de batterie
 */
export async function getBatteryLevel(deviceId = null) {
  try {
    const device = deviceId || await getDefaultDevice();
    
    if (!device) {
      throw new Error("Aucun smartphone connecté via KDE Connect");
    }

    // Commande pour récupérer infos device
    const command = `kdeconnect-cli -d ${device} --battery`;
    
    const { stdout } = await execAsync(command);
    
    // Parser la sortie (ex: "Battery: 85%")
    const match = stdout.match(/(\d+)%/);
    const level = match ? parseInt(match[1]) : null;

    console.log(`🔋 [KDEConnect] Batterie: ${level}%`);
    return {
      success: true,
      device,
      level,
      charging: stdout.includes("charging"),
    };
  } catch (error) {
    console.error("❌ [KDEConnect] Erreur batterie:", error.message);
    throw error;
  }
}

/**
 * Récupère l'ID du device par défaut (premier device connecté)
 * 
 * @returns {Promise<string|null>} ID du device ou null
 */
async function getDefaultDevice() {
  try {
    const { stdout } = await execAsync("kdeconnect-cli -a");
    
    // Parser la sortie pour trouver premier device connecté
    // Format: "- Device Name: <id> (reachable)"
    const match = stdout.match(/:\s+([a-f0-9_]+)\s+\(reachable\)/);
    
    return match ? match[1] : null;
  } catch (error) {
    console.error("❌ [KDEConnect] Erreur récupération device:", error.message);
    return null;
  }
}

/**
 * Liste tous les devices KDE Connect disponibles
 * 
 * @returns {Promise<Array>} Liste des devices
 */
export async function listDevices() {
  try {
    const { stdout } = await execAsync("kdeconnect-cli -a");
    
    const devices = [];
    const lines = stdout.split("\n");
    
    for (const line of lines) {
      const match = line.match(/^-\s+(.+):\s+([a-f0-9_]+)\s+\((.+)\)/);
      if (match) {
        devices.push({
          name: match[1].trim(),
          id: match[2],
          status: match[3],
          reachable: match[3].includes("reachable"),
        });
      }
    }

    console.log(`📱 [KDEConnect] ${devices.length} device(s) trouvé(s)`);
    return devices;
  } catch (error) {
    console.error("❌ [KDEConnect] Erreur liste devices:", error.message);
    return [];
  }
}
