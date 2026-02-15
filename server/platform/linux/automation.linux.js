import { exec } from "child_process";

/**
 * Automatisation clavier sous Linux via xdotool
 */
export function typeText(text) {
  return new Promise((resolve) => {
    // Escaper les caractères spéciaux pour xdotool
    const escapedText = text.replace(/"/g, '\\"');
    exec(`xdotool type "${escapedText}"`, (error) => {
      resolve(!error);
    });
  });
}

/**
 * Envoi de raccourcis clavier sous Linux
 */
export function sendShortcut(keys) {
  return new Promise((resolve) => {
    // Conversion simple format 'ctrl+c' -> 'ctrl+c' (xdotool compatible en général)
    const xKey = keys.replace(/\+/g, "+");
    exec(`xdotool key ${xKey}`, (error) => {
      resolve(!error);
    });
  });
}
