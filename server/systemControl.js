/**
 * Contrôleur Système Windows pour JARVIS
 *
 * Gère toutes les commandes de contrôle système :
 * - Volume audio
 * - Luminosité écran
 * - Gestion fichiers
 * - Recherche fichiers
 * - Capture d'écran
 * - Contrôle session (lock, shutdown, restart)
 * - Contrôle média
 *
 * @module systemControl
 */

const { exec } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const fg = require("fast-glob");
const screenshot = require("screenshot-desktop");

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Chemin vers nircmd.exe (utilitaire Windows) */
const NIRCMD_PATH = path.join(__dirname, "bin", "nircmd.exe");

// ============================================================================
// VOLUME AUDIO
// ============================================================================

/**
 * Contrôle le volume audio système
 *
 * @param {Object} params - Paramètres volume
 * @param {"set"|"increase"|"decrease"|"mute"|"unmute"} params.action - Action à effectuer
 * @param {number} [params.value] - Valeur 0-100 (pour action "set")
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function controlVolume({ action, value }) {
  try {
    let command;

    switch (action) {
      case "set":
        // Valider valeur
        if (value === undefined || value < 0 || value > 100) {
          return { success: false, message: "Volume invalide (0-100)" };
        }
        // Convertir 0-100 en 0-65535 (format Windows)
        const volumeLevel = Math.round((value / 100) * 65535);
        command = `${NIRCMD_PATH} setsysvolume ${volumeLevel}`;
        break;

      case "increase":
        command = `${NIRCMD_PATH} changesysvolume 2000`; // +3% environ
        break;

      case "decrease":
        command = `${NIRCMD_PATH} changesysvolume -2000`; // -3% environ
        break;

      case "mute":
        command = `${NIRCMD_PATH} mutesysvolume 1`;
        break;

      case "unmute":
        command = `${NIRCMD_PATH} mutesysvolume 0`;
        break;

      default:
        return { success: false, message: "Action volume inconnue" };
    }

    await execCommand(command);

    console.log(`🔊 Volume ${action}${value ? ` (${value}%)` : ""}`);
    return { success: true, message: `Volume ${action} avec succès` };
  } catch (error) {
    console.error("Erreur contrôle volume:", error);
    return { success: false, message: error.message };
  }
}

// ============================================================================
// LUMINOSITÉ ÉCRAN
// ============================================================================

/**
 * Contrôle la luminosité de l'écran
 *
 * @param {Object} params - Paramètres luminosité
 * @param {"set"|"increase"|"decrease"} params.action - Action à effectuer
 * @param {number} [params.value] - Valeur 0-100 (pour action "set")
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function controlBrightness({ action, value }) {
  try {
    let command;

    switch (action) {
      case "set":
        if (value === undefined || value < 0 || value > 100) {
          return { success: false, message: "Luminosité invalide (0-100)" };
        }
        command = `${NIRCMD_PATH} setbrightness ${value}`;
        break;

      case "increase":
        command = `${NIRCMD_PATH} changebrightness +10`;
        break;

      case "decrease":
        command = `${NIRCMD_PATH} changebrightness -10`;
        break;

      default:
        return { success: false, message: "Action luminosité inconnue" };
    }

    await execCommand(command);

    console.log(`💡 Luminosité ${action}${value ? ` (${value}%)` : ""}`);
    return { success: true, message: `Luminosité ${action} avec succès` };
  } catch (error) {
    console.error("Erreur contrôle luminosité:", error);
    return { success: false, message: error.message };
  }
}

// ============================================================================
// GESTION FICHIERS
// ============================================================================

/**
 * Opérations sur fichiers/dossiers
 *
 * @param {Object} params - Paramètres fichier
 * @param {"create"|"delete"|"move"|"copy"} params.action - Action fichier
 * @param {string} params.path - Chemin fichier/dossier
 * @param {string} [params.destination] - Chemin destination (move/copy)
 * @param {"file"|"directory"} [params.type] - Type pour création
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function manageFile({ action, path: filePath, destination, type }) {
  try {
    // Sécurité: bloquer accès system32 et autres dossiers sensibles
    const forbiddenPaths = ["system32", "windows", "program files"];
    const normalizedPath = filePath.toLowerCase();

    for (const forbidden of forbiddenPaths) {
      if (normalizedPath.includes(forbidden)) {
        return {
          success: false,
          message: `Accès interdit: ${forbidden}`,
        };
      }
    }

    switch (action) {
      case "create":
        if (type === "directory") {
          await fs.mkdir(filePath, { recursive: true });
          console.log(`📁 Dossier créé: ${filePath}`);
          return { success: true, message: `Dossier créé: ${filePath}` };
        } else {
          await fs.writeFile(filePath, "");
          console.log(`📄 Fichier créé: ${filePath}`);
          return { success: true, message: `Fichier créé: ${filePath}` };
        }

      case "delete":
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
          await fs.rmdir(filePath, { recursive: true });
          console.log(`🗑️ Dossier supprimé: ${filePath}`);
          return { success: true, message: `Dossier supprimé: ${filePath}` };
        } else {
          await fs.unlink(filePath);
          console.log(`🗑️ Fichier supprimé: ${filePath}`);
          return { success: true, message: `Fichier supprimé: ${filePath}` };
        }

      case "move":
        if (!destination) {
          return { success: false, message: "Destination requise" };
        }
        await fs.rename(filePath, destination);
        console.log(`➡️ Déplacé: ${filePath} → ${destination}`);
        return {
          success: true,
          message: `Déplacé vers ${destination}`,
        };

      case "copy":
        if (!destination) {
          return { success: false, message: "Destination requise" };
        }
        await fs.copyFile(filePath, destination);
        console.log(`📋 Copié: ${filePath} → ${destination}`);
        return {
          success: true,
          message: `Copié vers ${destination}`,
        };

      default:
        return { success: false, message: "Action fichier inconnue" };
    }
  } catch (error) {
    console.error("Erreur gestion fichier:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Recherche fichiers par nom/pattern
 *
 * @param {Object} params - Paramètres recherche
 * @param {string} params.query - Pattern recherche (glob)
 * @param {string} [params.path] - Chemin base recherche (défaut: C:/Users)
 * @param {number} [params.maxResults] - Limite résultats (défaut: 50)
 * @returns {Promise<{success: boolean, results: string[]}>}
 */
async function searchFiles({ query, path: searchPath, maxResults = 50 }) {
  try {
    // Chemin par défaut: profil utilisateur
    const basePath = searchPath || process.env.USERPROFILE;

    // Construire pattern glob
    const pattern = `${basePath}/**/*${query}*`;

    console.log(`🔍 Recherche: ${pattern}`);

    // Recherche avec fast-glob
    const results = await fg(pattern, {
      caseSensitiveMatch: false,
      ignore: ["**/node_modules/**", "**/.git/**", "**/AppData/**"],
      onlyFiles: true,
      absolute: true,
    });

    // Limiter résultats
    const limitedResults = results.slice(0, maxResults);

    console.log(`📋 Trouvé: ${limitedResults.length} fichiers`);
    return {
      success: true,
      results: limitedResults,
      total: results.length,
    };
  } catch (error) {
    console.error("Erreur recherche fichiers:", error);
    return { success: false, results: [], message: error.message };
  }
}

// ============================================================================
// CAPTURE D'ÉCRAN
// ============================================================================

/**
 * Prend une capture d'écran
 *
 * @param {Object} params - Paramètres capture
 * @param {string} [params.savePath] - Chemin sauvegarde (défaut: Bureau)
 * @returns {Promise<{success: boolean, path: string}>}
 */
async function takeScreenshot({ savePath }) {
  try {
    // Chemin par défaut: Bureau
    const desktopPath = path.join(process.env.USERPROFILE, "Desktop");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const defaultPath = path.join(
      desktopPath,
      `JARVIS_screenshot_${timestamp}.png`,
    );

    const finalPath = savePath || defaultPath;

    // Capture écran
    const imgBuffer = await screenshot();

    // Sauvegarder
    await fs.writeFile(finalPath, imgBuffer);

    console.log(`📸 Capture sauvegardée: ${finalPath}`);
    return { success: true, path: finalPath };
  } catch (error) {
    console.error("Erreur capture écran:", error);
    return { success: false, message: error.message };
  }
}

// ============================================================================
// CONTRÔLE SESSION
// ============================================================================

/**
 * Contrôle de session Windows (lock, shutdown, restart)
 *
 * @param {Object} params - Paramètres session
 * @param {"lock"|"shutdown"|"restart"|"sleep"} params.action - Action session
 * @param {number} [params.delay] - Délai en secondes (défaut: 0)
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function controlSession({ action, delay = 0 }) {
  try {
    let command;

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
        command = `${NIRCMD_PATH} st andhby`;
        break;

      default:
        return { success: false, message: "Action session inconnue" };
    }

    await execCommand(command);

    console.log(
      `🔒 Session ${action}${delay ? ` dans ${delay}s` : " immédiatement"}`,
    );
    return {
      success: true,
      message: `Session ${action} programmée`,
    };
  } catch (error) {
    console.error("Erreur contrôle session:", error);
    return { success: false, message: error.message };
  }
}

// ============================================================================
// CONTRÔLE MÉDIA
// ============================================================================

/**
 * Contrôle de lecture média (musique, vidéo)
 *
 * @param {Object} params - Paramètres média
 * @param {"play"|"pause"|"next"|"previous"|"stop"} params.action - Action média
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function controlMedia({ action }) {
  try {
    let keyCode;

    switch (action) {
      case "play":
      case "pause":
        keyCode = "PlayPause";
        break;
      case "next":
        keyCode = "Next";
        break;
      case "previous":
        keyCode = "Previous";
        break;
      case "stop":
        keyCode = "Stop";
        break;
      default:
        return { success: false, message: "Action média inconnue" };
    }

    const command = `${NIRCMD_PATH} sendkeypress ${keyCode}`;
    await execCommand(command);

    console.log(`🎵 Média ${action}`);
    return { success: true, message: `Média ${action}` };
  } catch (error) {
    console.error("Erreur contrôle média:", error);
    return { success: false, message: error.message };
  }
}

// ============================================================================
// UTILS
// ============================================================================

/**
 * Ex écute commande shell et attend résultat
 *
 * @param {string} command - Commande à exécuter
 * @returns {Promise<string>} Sortie commande
 */
function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  controlVolume,
  controlBrightness,
  manageFile,
  searchFiles,
  takeScreenshot,
  controlSession,
  controlMedia,
};
