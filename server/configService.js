/**
 * Config Service - J.A.R.V.I.S.
 *
 * Gère la persistance des configurations utilisateur (Apps, Shortcuts, Commands)
 * via des fichiers JSON stockés dans server/data/.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");

/**
 * Initialise le répertoire de données s'il n'existe pas
 */
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log(`📁 Répertoire de données créé: ${DATA_DIR}`);
  }
}

/**
 * Lit un fichier de configuration JSON
 * @param {string} filename Nom du fichier (ex: 'apps.json')
 * @returns {Promise<any>} Données du fichier ou objet vide
 */
export async function readConfig(filename) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

/**
 * Écrit des données dans un fichier de configuration JSON
 * @param {string} filename Nom du fichier
 * @param {any} data Données à sauvegarder
 */
export async function writeConfig(filename, data) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`💾 Configuration sauvegardée: ${filename}`);
}

/**
 * Récupère une collection (Apps, Shortcuts, ou Commands)
 */
export async function getCollection(name) {
  const data = await readConfig(`${name}.json`);
  return data || {};
}

/**
 * Sauvegarde une collection
 */
export async function saveCollection(name, data) {
  await writeConfig(`${name}.json`, data);
}
