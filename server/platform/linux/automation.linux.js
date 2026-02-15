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
 * Envoi de raccourcis clavier sous Linux via xdotool
 */
export function sendShortcut(keys) {
  return new Promise((resolve) => {
    // Conversion format 'ctrl+c' -> 'ctrl+c' (xdotool)
    // xdotool utilise des noms comme 'Control_L', 'Alt_L', etc. mais supporte souvent les raccourcis directs
    const xKey = keys
      .toLowerCase()
      .replace(/ctrl/g, "ctrl")
      .replace(/alt/g, "alt")
      .replace(/shift/g, "shift")
      .replace(/\+/g, "+");

    exec(`xdotool key ${xKey}`, (error) => {
      resolve(!error);
    });
  });
}
