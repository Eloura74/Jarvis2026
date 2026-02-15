const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

// Configuration
const CONFIG = {
  // Dossiers à IGNORER (Sécurité & Performance)
  ignoredDirs: [
    "node_modules",
    ".git",
    ".idea",
    ".vscode",
    "dist",
    "build",
    "coverage",
    ".next",
    ".gemini",
    "tmp",
    "temp",
    "logs",
  ],
  // Extensions AUTORISÉES (Fichiers Texte Uniquement)
  allowedExtensions: [
    ".md",
    ".txt",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".json",
    ".yaml",
    ".yml",
    ".py",
    ".sh",
    ".bat",
    ".html",
    ".css",
    ".scss",
  ],
  // Limites
  maxFileSize: 500 * 1024, // 500KB max par fichier (évite indexer gros bundles)
  indexPath: path.join(__dirname, "../data/local_memory_index.json"),
};

class LocalMemoryService {
  constructor() {
    this.index = {
      files: [],
      timestamp: null,
      version: "1.0",
    };
    this.isIndexing = false;
  }

  /**
   * Initialise le service et charge l'index existant
   */
  async initialize() {
    try {
      await this.loadIndex();
      console.log(
        `🧠 [LocalMemory] Index chargé : ${this.index.files.length} fichiers.`,
      );
    } catch (error) {
      console.log(
        "🧠 [LocalMemory] Aucun index existant, il sera créé lors du premier scan.",
      );
      this.index = { files: [], timestamp: Date.now(), version: "1.0" };
    }
  }

  /**
   * Charge l'index JSON depuis le disque
   */
  async loadIndex() {
    try {
      const data = await fs.readFile(CONFIG.indexPath, "utf8");
      this.index = JSON.parse(data);
    } catch (error) {
      if (error.code !== "ENOENT")
        console.error("Erreur chargement index:", error);
      throw error;
    }
  }

  /**
   * Sauvegarde l'index JSON sur le disque
   */
  async saveIndex() {
    try {
      const dir = path.dirname(CONFIG.indexPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(CONFIG.indexPath, JSON.stringify(this.index, null, 2));
      console.log(
        `💾 [LocalMemory] Index sauvegardé (${this.index.files.length} fichiers).`,
      );
    } catch (error) {
      console.error("❌ [LocalMemory] Erreur sauvegarde index:", error);
    }
  }

  /**
   * Lance l'indexation d'un dossier racine
   * @param {string} rootPath - Chemin absolu du dossier à indexer
   */
  async indexDirectory(rootPath) {
    if (this.isIndexing)
      return { success: false, message: "Indexation déjà en cours" };

    console.log(`🔍 [LocalMemory] Début indexation : ${rootPath}`);
    this.isIndexing = true;
    const startTime = Date.now();

    try {
      // 1. Scanner récursivement
      const filesFound = await this.scanDirectory(rootPath);

      // 2. Mettre à jour l'index en mémoire
      // TODO: Stratégie incrémentale possible plus tard (vérifier checksums)
      this.index = {
        files: filesFound,
        timestamp: Date.now(),
        rootPath: rootPath,
        version: "1.0",
      };

      // 3. Persister
      await this.saveIndex();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(
        `✅ [LocalMemory] Fin indexation (${duration}s). ${filesFound.length} fichiers.`,
      );

      return {
        success: true,
        count: filesFound.length,
        duration: duration,
      };
    } catch (error) {
      console.error("❌ [LocalMemory] Erreur indexation:", error);
      return { success: false, error: error.message };
    } finally {
      this.isIndexing = false;
    }
  }

  /**
   * Scanne récursivement un dossier
   */
  async scanDirectory(dirPath) {
    let results = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Ignorer les dossiers/fichiers cachés ou blacklistés
        if (
          CONFIG.ignoredDirs.includes(entry.name) ||
          entry.name.startsWith(".")
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          const subResults = await this.scanDirectory(fullPath);
          results = results.concat(subResults);
        } else if (entry.isFile()) {
          if (this.isIndexable(entry.name)) {
            const fileData = await this.processFile(fullPath);
            if (fileData) results.push(fileData);
          }
        }
      }
    } catch (error) {
      console.warn(
        `⚠️ [LocalMemory] Impossible de lire ${dirPath}: ${error.code}`,
      );
    }

    return results;
  }

  isIndexable(filename) {
    const ext = path.extname(filename).toLowerCase();
    return CONFIG.allowedExtensions.includes(ext);
  }

  async processFile(filePath) {
    try {
      const stats = await fs.stat(filePath);

      if (stats.size > CONFIG.maxFileSize) return null;

      const content = await fs.readFile(filePath, "utf8");

      // Sécurité : Ne pas indexer les clés privées ou secrets évidents
      if (
        content.includes("BEGIN PRIVATE KEY") ||
        content.includes("AWS_SECRET")
      ) {
        return null;
      }

      return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        lastModified: stats.mtime,
        // Limite de taille pour le contenu stocké (50KB max)
        content: content.substring(0, 50000),
        checksum: this.generateChecksum(content),
      };
    } catch (error) {
      return null;
    }
  }

  generateChecksum(str) {
    return crypto.createHash("md5").update(str).digest("hex");
  }

  /**
   * Recherche basique par mots-clés (pour l'instant)
   * A remplacer par vectoriel + embedding plus tard
   */
  search(query) {
    if (!query) return [];

    const terms = query
      .toLowerCase()
      .split(" ")
      .filter((t) => t.length > 2);
    if (terms.length === 0) return [];

    return this.index.files
      .filter((file) => {
        const contentLower = file.content.toLowerCase();
        const pathLower = file.path.toLowerCase();
        // Match si TOUS les termes sont trouvés (AND) dans path OU contenu
        return terms.every(
          (term) => pathLower.includes(term) || contentLower.includes(term),
        );
      })
      .map((file) => ({
        path: file.path,
        name: file.name,
        // Extrait contextuel basique (premiers 200 chars)
        preview: file.content.substring(0, 200).replace(/\n/g, " ") + "...",
      }))
      .slice(0, 20); // Limiter résultats
  }
}

module.exports = new LocalMemoryService();
