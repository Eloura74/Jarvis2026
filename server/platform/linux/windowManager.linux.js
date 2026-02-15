import { exec } from "child_process";

/**
 * Listage des fenêtres sous Linux (Ubuntu) via wmctrl
 */
export function listWindows() {
  return new Promise((resolve) => {
    exec("wmctrl -l", (error, stdout) => {
      if (error) return resolve([]);
      const windows = stdout
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const parts = line.split(/\s+/);
          const id = parts[0];
          const title = parts.slice(3).join(" ");
          return { id, title };
        });
      resolve(windows);
    });
  });
}

/**
 * Focus d'une fenêtre sous Linux
 */
export function focusWindow(title) {
  return new Promise((resolve) => {
    exec(`wmctrl -R "${title}"`, (error) => {
      resolve(!error);
    });
  });
}

/**
 * Fermeture d'une fenêtre sous Linux
 */
export function closeWindow(title) {
  return new Promise((resolve) => {
    exec(`wmctrl -c "${title}"`, (error) => {
      resolve(!error);
    });
  });
}

/**
 * Minimisation d'une fenêtre sous Linux
 */
export function minimizeWindow(title) {
  return new Promise((resolve) => {
    exec(`wmctrl -r "${title}" -b add,iconic`, (error) => {
      resolve(!error);
    });
  });
}

/**
 * Maximisation d'une fenêtre sous Linux
 */
export function maximizeWindow(title) {
  return new Promise((resolve) => {
    exec(
      `wmctrl -r "${title}" -b add,maximized_vert,maximized_horz`,
      (error) => {
        resolve(!error);
      },
    );
  });
}
