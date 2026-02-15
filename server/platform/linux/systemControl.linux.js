import { exec } from "child_process";
import fs from "fs/promises";
import screenshot from "screenshot-desktop";

/**
 * Contrôle le volume audio sous Linux (ALSA/amixer)
 */
export async function controlVolume({ action, value = 0 }) {
  let command = "";
  switch (action) {
    case "set":
      command = `amixer sset 'Master' ${value}%`;
      break;
    case "increase":
      command = "amixer sset 'Master' 5%+";
      break;
    case "decrease":
      command = "amixer sset 'Master' 5%-";
      break;
    case "mute":
      command = "amixer sset 'Master' mute";
      break;
    case "unmute":
      command = "amixer sset 'Master' unmute";
      break;
  }
  return new Promise((resolve) => {
    exec(command, (err) => resolve({ success: !err }));
  });
}

/**
 * Contrôle la luminosité sous Linux (brightnessctl)
 */
export async function controlBrightness({ action, value }) {
  let command = "";
  if (action === "set") command = `brightnessctl set ${value}%`;
  else command = `brightnessctl set ${action === "increase" ? "+10%" : "10%-"}`;

  return new Promise((resolve) => {
    exec(command, (err) => resolve({ success: !err }));
  });
}

/**
 * Capture d'écran sous Linux
 */
export async function takeScreenshot({ savePath }) {
  try {
    const imgBuffer = await screenshot();
    await fs.writeFile(savePath, imgBuffer);
    return { success: true, path: savePath };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Gestion session Linux (systemctl)
 */
export async function controlSession({ action }) {
  let command = "";
  switch (action) {
    case "lock":
      command = "xdg-screensaver lock";
      break;
    case "shutdown":
      command = "systemctl poweroff";
      break;
    case "restart":
      command = "systemctl reboot";
      break;
    case "sleep":
      command = "systemctl suspend";
      break;
  }
  return new Promise((resolve) => {
    exec(command, (err) => resolve({ success: !err }));
  });
}

/**
 * Contrôle média Linux (playerctl)
 */
export async function controlMedia({ action }) {
  return new Promise((resolve) => {
    exec(`playerctl ${action}`, (err) => resolve({ success: !err }));
  });
}
