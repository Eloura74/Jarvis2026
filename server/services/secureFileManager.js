import fs from "fs/promises";
import path from "path";
import os from "os";

// DOSSIERS INTERDITS (Blacklist System)
const FORBIDDEN_PATHS = [
  "C:\\Windows",
  "C:\\Program Files",
  "C:\\Program Files (x86)",
  path.join(os.homedir(), "AppData"),
  ".git",
  "node_modules",
];

// EXTENSIONS AUTORISÉES (Whitelist Codes & Textes)
const ALLOWED_EXTENSIONS = [
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".py",
  ".json",
  ".md",
  ".txt",
  ".html",
  ".css",
  ".scss",
  ".env",
  ".env.example",
  ".bat",
  ".ps1",
  ".sh",
  ".xml",
  ".yaml",
  ".yml",
  ".gitignore",
  ".dockerignore",
];

class SecureFileManager {
  /**
   * Vérifie si le chemin est autorisé pour modification
   */
  isPathAllowed(targetPath) {
    // Normaliser les chemins pour éviter les traversées (../../)
    const normalized = path.normalize(targetPath);

    // Empêcher accès hors du système de fichier utilisateur standard (MVP)
    // Idéalement : Restreindre au dossier de travail courant du User

    // 1. Vérifier extension
    const ext = path.extname(normalized).toLowerCase();

    // Fichiers sans extension (ex: LICENSE, Makefile) -> OK si pas binaire
    if (ext === "") {
      // TODO: Vérification MIME type ou contenu binaire
      return true;
    }

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return false;
    }

    // 2. Vérifier blacklist dossiers
    // On vérifie si le chemin commence par un dossier interdit
    // Attention aux majuscules/minuscules sous Windows
    const lowerPath = normalized.toLowerCase();

    for (const forbidden of FORBIDDEN_PATHS) {
      if (lowerPath.startsWith(forbidden.toLowerCase())) {
        return false;
      }
    }

    return true;
  }

  /**
   * Lit un fichier de manière sécurisée
   */
  async readFile(filePath) {
    if (!this.isPathAllowed(filePath)) {
      throw new Error(`Accès refusé (Politique de Sécurité) : ${filePath}`);
    }

    try {
      const stats = await fs.stat(filePath);

      // Limite de taille : 1Mo pour éviter de crasher la mémoire
      if (stats.size > 1024 * 1024) {
        throw new Error(
          "Fichier trop volumineux (>1MB). Lecture partielle non supportée pour l'instant.",
        );
      }

      return await fs.readFile(filePath, "utf8");
    } catch (error) {
      throw new Error(`Impossible de lire le fichier : ${error.message}`);
    }
  }

  /**
   * Écrit dans un fichier avec backup automatique
   */
  async writeFile(filePath, content) {
    if (!this.isPathAllowed(filePath)) {
      throw new Error(`Écriture refusée (Politique de Sécurité) : ${filePath}`);
    }

    try {
      // 1. Créer le dossier parent si nécessaire
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      // 2. BACKUP AUTOMATIQUE si le fichier existe
      try {
        await fs.access(filePath);

        // Générer nom de backup unique
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupPath = `${filePath}.bak.${timestamp}`;

        await fs.copyFile(filePath, backupPath);
        console.log(`🛡️ [SecureFile] Backup créé : ${backupPath}`);
      } catch (e) {
        // Fichier n'existe pas encore, c'est une création -> Pas de backup
      }

      // 3. Écrire le contenu
      await fs.writeFile(filePath, content, "utf8");
      console.log(`✅ [SecureFile] Fichier écrit : ${filePath}`);

      return { success: true, path: filePath };
    } catch (error) {
      console.error(`❌ [SecureFile] Erreur écriture :`, error);
      throw new Error(`Erreur lors de l'écriture : ${error.message}`);
    }
  }
}

export default new SecureFileManager();
