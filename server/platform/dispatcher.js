import * as winWindowManager from "../windowManager.js";
import * as winAutomation from "../automation.js";
import * as winSystemControl from "../systemControl.js";
import * as linuxWindowManager from "./linux/windowManager.linux.js";
import * as linuxAutomation from "./linux/automation.linux.js";
import * as linuxSystemControl from "./linux/systemControl.linux.js";

const isWindows = process.platform === "win32";

/**
 * Dispatcher de plateforme - Redirige les appels système vers le bon driver
 * selon l'OS détecté (Windows ou Linux).
 */

export const windowManager = isWindows ? winWindowManager : linuxWindowManager;
export const automation = isWindows ? winAutomation : linuxAutomation;
export const systemControl = isWindows ? winSystemControl : linuxSystemControl;

console.log(
  `💻 [PLATFORM] Mode ${isWindows ? "Windows" : "Linux/Ubuntu"} activé.`,
);
