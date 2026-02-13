/**
 * Service de gestion du système de fichiers
 * 
 * Fournit les fonctionnalités pour :
 * - Lister les fichiers et dossiers
 * - Naviguer dans l'arborescence
 * - Rechercher des fichiers
 * - Obtenir des métadonnées
 * 
 * @module fileSystem
 */

import fs from "fs/promises";
import path from "path";
import os from "os";

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Obtient les métadonnées d'un fichier ou dossier
 * 
 * @param {string} filePath - Chemin complet
 * @returns {Promise<Object>} Métadonnées du fichier
 */
const getFileMetadata = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName);

    return {
      name: fileName,
      path: filePath,
      isDirectory: stats.isDirectory(),
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      extension: ext,
      modified: stats.mtime,
      created: stats.birthtime,
      permissions: stats.mode,
    };
  } catch (error) {
    console.error(`Erreur métadonnées pour ${filePath}:`, error.message);
    return null;
  }
};

/**
 * Formate une taille en octets vers un format lisible
 * 
 * @param {number} bytes - Taille en octets
 * @returns {string} Taille formatée (ex: "1.5 MB")
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Détermine le type de fichier selon l'extension
 * 
 * @param {string} ext - Extension du fichier
 * @returns {string} Type de fichier
 */
const getFileType = (ext) => {
  const types = {
    // Images
    ".jpg": "image",
    ".jpeg": "image",
    ".png": "image",
    ".gif": "image",
    ".svg": "image",
    ".webp": "image",
    ".bmp": "image",
    
    // Vidéos
    ".mp4": "video",
    ".avi": "video",
    ".mkv": "video",
    ".mov": "video",
    ".webm": "video",
    
    // Audio
    ".mp3": "audio",
    ".wav": "audio",
    ".flac": "audio",
    ".ogg": "audio",
    
    // Documents
    ".pdf": "pdf",
    ".doc": "document",
    ".docx": "document",
    ".txt": "text",
    ".md": "text",
    ".rtf": "document",
    
    // Code
    ".js": "code",
    ".ts": "code",
    ".jsx": "code",
    ".tsx": "code",
    ".py": "code",
    ".java": "code",
    ".cpp": "code",
    ".c": "code",
    ".cs": "code",
    ".php": "code",
    ".rb": "code",
    ".go": "code",
    ".rs": "code",
    ".html": "code",
    ".css": "code",
    ".json": "code",
    ".xml": "code",
    ".yaml": "code",
    ".yml": "code",
    
    // Archives
    ".zip": "archive",
    ".rar": "archive",
    ".7z": "archive",
    ".tar": "archive",
    ".gz": "archive",
    
    // Exécutables
    ".exe": "executable",
    ".msi": "executable",
    ".app": "executable",
    ".dmg": "executable",
  };
  
  return types[ext.toLowerCase()] || "file";
};

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Liste les fichiers et dossiers d'un répertoire
 * 
 * @param {string} dirPath - Chemin du répertoire
 * @param {boolean} showHidden - Afficher les fichiers cachés
 * @returns {Promise<Object>} Liste des fichiers et métadonnées
 */
export const listDirectory = async (dirPath, showHidden = false) => {
  try {
    // Sécurité : empêcher l'accès à des dossiers sensibles
    const normalizedPath = path.normalize(dirPath);
    
    // Dossiers système Windows à éviter (liens symboliques protégés)
    const forbiddenPaths = [
      'Mes documents',
      'My Documents',
      'Ma musique',
      'My Music',
      'Mes images',
      'My Pictures',
      'Mes vidéos',
      'My Videos',
      'Application Data',
      'Local Settings',
      'Cookies',
      'NetHood',
      'PrintHood',
      'Recent',
      'SendTo',
      'Templates',
    ];
    
    const pathBasename = path.basename(normalizedPath);
    if (forbiddenPaths.includes(pathBasename)) {
      throw new Error(`Accès refusé : ${pathBasename} est un dossier système protégé`);
    }
    
    // Lire le contenu du répertoire
    const items = await fs.readdir(normalizedPath);
    
    // Récupérer les métadonnées de chaque élément
    const itemsWithMetadata = await Promise.all(
      items
        .filter((item) => showHidden || !item.startsWith("."))
        .map(async (item) => {
          const itemPath = path.join(normalizedPath, item);
          const metadata = await getFileMetadata(itemPath);
          
          if (!metadata) return null;
          
          return {
            ...metadata,
            type: metadata.isDirectory ? "directory" : getFileType(metadata.extension),
          };
        })
    );
    
    // Filtrer les nulls et trier (dossiers en premier, puis alphabétique)
    const validItems = itemsWithMetadata.filter((item) => item !== null);
    validItems.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return {
      path: normalizedPath,
      parent: path.dirname(normalizedPath),
      items: validItems,
      count: {
        total: validItems.length,
        directories: validItems.filter((i) => i.isDirectory).length,
        files: validItems.filter((i) => !i.isDirectory).length,
      },
    };
  } catch (error) {
    console.error(`Erreur listage répertoire ${dirPath}:`, error.message);
    throw new Error(`Impossible de lister le répertoire: ${error.message}`);
  }
};

/**
 * Recherche des fichiers par nom
 * 
 * @param {string} searchPath - Chemin de base pour la recherche
 * @param {string} query - Terme de recherche
 * @param {number} maxResults - Nombre maximum de résultats
 * @returns {Promise<Array>} Fichiers trouvés
 */
export const searchFiles = async (searchPath, query, maxResults = 50) => {
  const results = [];
  const queryLower = query.toLowerCase();
  
  const search = async (currentPath, depth = 0) => {
    if (results.length >= maxResults || depth > 5) return;
    
    try {
      const items = await fs.readdir(currentPath);
      
      for (const item of items) {
        if (results.length >= maxResults) break;
        
        const itemPath = path.join(currentPath, item);
        
        // Skip fichiers cachés et node_modules
        if (item.startsWith(".") || item === "node_modules") continue;
        
        // Si le nom correspond
        if (item.toLowerCase().includes(queryLower)) {
          const metadata = await getFileMetadata(itemPath);
          if (metadata) {
            results.push({
              ...metadata,
              type: metadata.isDirectory ? "directory" : getFileType(metadata.extension),
            });
          }
        }
        
        // Recherche récursive dans les sous-dossiers
        try {
          const stats = await fs.stat(itemPath);
          if (stats.isDirectory()) {
            await search(itemPath, depth + 1);
          }
        } catch (err) {
          // Ignorer les erreurs d'accès
        }
      }
    } catch (error) {
      // Ignorer les erreurs d'accès aux dossiers
    }
  };
  
  await search(searchPath);
  return results;
};

/**
 * Obtient les dossiers favoris/rapides
 * 
 * @returns {Array} Liste des dossiers favoris
 */
export const getQuickAccessFolders = () => {
  const homeDir = os.homedir();
  
  return [
    {
      name: "Accueil (Utilisateur)",
      path: homeDir,
      icon: "home",
    },
    {
      name: "Bureau",
      path: path.join(homeDir, "Desktop"),
      icon: "desktop",
    },
    {
      name: "Documents",
      path: path.join(homeDir, "Documents"),
      icon: "document",
    },
    {
      name: "Téléchargements",
      path: path.join(homeDir, "Downloads"),
      icon: "download",
    },
    {
      name: "Images",
      path: path.join(homeDir, "Pictures"),
      icon: "image",
    },
    {
      name: "Musique",
      path: path.join(homeDir, "Music"),
      icon: "music",
    },
    {
      name: "Vidéos",
      path: path.join(homeDir, "Videos"),
      icon: "video",
    },
    {
      name: "Disque C:\\",
      path: "C:\\",
      icon: "hard-drive",
    },
  ];
};

/**
 * Lit le contenu d'un fichier texte
 * 
 * @param {string} filePath - Chemin du fichier
 * @param {number} maxSize - Taille maximum en octets
 * @returns {Promise<string>} Contenu du fichier
 */
export const readTextFile = async (filePath, maxSize = 1024 * 1024) => {
  try {
    const stats = await fs.stat(filePath);
    
    if (stats.size > maxSize) {
      throw new Error(`Fichier trop volumineux (max ${formatBytes(maxSize)})`);
    }
    
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    throw new Error(`Impossible de lire le fichier: ${error.message}`);
  }
};
