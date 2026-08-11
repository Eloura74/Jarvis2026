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
  constructor() {
    this.userHome = os.homedir();

    // Détection DYNAMIQUE du bureau via le dossier home de l'utilisateur
    this.desktopPath = path.join(this.userHome, "Desktop");
    console.log(`📂 [SecureFile] Desktop target set to: ${this.desktopPath}`);
  }

  /**
   * Résout intelligemment les alias de chemins (ex: "Bureau/mon-fichier.txt")
   */
  resolvePath(inputPath) {
    let finalPath = inputPath;

    // Nettoyage des préfixes français/anglais
    const cleanPath = inputPath.replace(/^(Bureau|Desktop)[\/\\]/i, "");

    if (
      inputPath.toLowerCase().startsWith("bureau") ||
      inputPath.toLowerCase().startsWith("desktop")
    ) {
      finalPath = path.join(this.desktopPath, cleanPath);
    }

    return path.resolve(finalPath);
  }

  /**
   * Vérifie si le chemin est autorisé pour modification
   */
  isPathAllowed(targetPath) {
    const normalized = path.normalize(targetPath);
    const lowerPath = normalized.toLowerCase();

    // 1. Nettoyage et vérification de l'extension
    // Gérer les cas de transcription vocale complexes (point txt, pour un txt, etc.)
    let cleanPath = normalized;
    if (lowerPath.includes(" point txt")) {
      cleanPath = normalized.replace(/ point txt/i, ".txt");
    } else if (lowerPath.includes(" pour un txt")) {
      // Cas spécifique rencontré : transcription de ".txt"
      cleanPath = normalized.replace(/ pour un txt/i, ".txt");
    }

    const ext = path.extname(cleanPath).toLowerCase();

    // 2. Vérifier blacklist dossiers systêmes (Priorité haute)
    for (const forbidden of FORBIDDEN_PATHS) {
      if (lowerPath.startsWith(forbidden.toLowerCase())) {
        return false;
      }
    }

    // 3. Vérification de la zone de confiance (Desktop / Home)
    const projectRoot = path.resolve(".");
    const desktopMatch = lowerPath.startsWith(this.desktopPath.toLowerCase());
    const homeMatch = lowerPath.startsWith(this.userHome.toLowerCase());
    const projectMatch = lowerPath.startsWith(projectRoot.toLowerCase());

    const isTrustedZone = desktopMatch || homeMatch || projectMatch;

    // Si on est dans une zone de confiance, on est plus souple sur l'extension
    if (isTrustedZone) {
      // Si pas d'extension, c'est OK (on traitera ça comme du texte)
      if (ext === "") return true;
      // Si extension connue, c'est OK
      if (ALLOWED_EXTENSIONS.includes(ext)) return true;
    }

    // Hors zone de confiance ou extension interdite
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return false;
    }

    return isTrustedZone;
  }

  /**
   * Lit un fichier de manière sécurisée
   */
  async readFile(filePath) {
    const resolvedPath = this.resolvePath(filePath);

    if (!this.isPathAllowed(resolvedPath)) {
      throw new Error(`Accès refusé (Politique de Sécurité) : ${resolvedPath}`);
    }

    try {
      const stats = await fs.stat(resolvedPath);
      if (stats.size > 1024 * 1024) {
        throw new Error("Fichier trop volumineux (>1MB).");
      }
      return await fs.readFile(resolvedPath, "utf8");
    } catch (error) {
      throw new Error(`Impossible de lire le fichier : ${error.message}`);
    }
  }

  /**
   * Écrit dans un fichier avec backup automatique
   */
  async writeFile(filePath, content) {
    const resolvedPath = this.resolvePath(filePath);

    if (!this.isPathAllowed(resolvedPath)) {
      throw new Error(
        `Écriture refusée (Politique de Sécurité) : ${resolvedPath}`,
      );
    }

    try {
      const dir = path.dirname(resolvedPath);
      await fs.mkdir(dir, { recursive: true });

      try {
        await fs.access(resolvedPath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupPath = `${resolvedPath}.bak.${timestamp}`;
        await fs.copyFile(resolvedPath, backupPath);
      } catch (e) {}

      await fs.writeFile(resolvedPath, content, "utf8");
      console.log(`✅ [SecureFile] Fichier écrit : ${resolvedPath}`);

      return { success: true, path: resolvedPath };
    } catch (error) {
      console.error(`❌ [SecureFile] Erreur écriture :`, error);
      throw new Error(`Erreur lors de l'écriture : ${error.message}`);
    }
  }
}

export default new SecureFileManager();
