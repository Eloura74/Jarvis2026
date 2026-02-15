import express from "express";
import fs from "fs/promises";
import fg from "fast-glob";
import os from "os";
import secureFileManager from "../services/secureFileManager.js";
import * as fileSystem from "../fileSystem.js"; // Import namespace car pas de default export

const router = express.Router();

/**
 * Routes pour la gestion des fichiers (Lecture, Écriture, Recherche, Action)
 */

// --- ACTIONS CLASSIQUES (Create, Delete, Move, Copy) ---
router.post("/action", async (req, res) => {
  try {
    const { action, path, destination, type } = req.body;

    if (!action || !path) {
      return res.status(400).json({ error: "Action et path requis" });
    }

    // Sécurité: bloquer dossiers sensibles
    const forbidden = ["system32", "windows", "program files"];
    if (forbidden.some((f) => path.toLowerCase().includes(f))) {
      return res.status(403).json({ error: "Accès interdit à ce dossier" });
    }

    switch (action) {
      case "create":
        if (type === "directory") {
          await fs.mkdir(path, { recursive: true });
          res.json({ success: true, message: `Dossier créé: ${path}` });
        } else {
          await fs.writeFile(path, "");
          res.json({ success: true, message: `Fichier créé: ${path}` });
        }
        break;

      case "delete":
        const stats = await fs.stat(path);
        if (stats.isDirectory()) {
          await fs.rm(path, { recursive: true, force: true });
        } else {
          await fs.unlink(path);
        }
        res.json({ success: true, message: `Supprimé: ${path}` });
        break;

      case "move":
        if (!destination)
          return res.status(400).json({ error: "Destination requise" });
        await fs.rename(path, destination);
        res.json({ success: true, message: `Déplacé vers ${destination}` });
        break;

      case "copy":
        if (!destination)
          return res.status(400).json({ error: "Destination requise" });
        await fs.copyFile(path, destination);
        res.json({ success: true, message: `Copié vers ${destination}` });
        break;

      default:
        res.status(400).json({ error: "Action inconnue" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- RECHERCHE ---
router.get("/search", async (req, res) => {
  try {
    const { query, path, maxResults } = req.query;
    if (!query) return res.status(400).json({ error: "Query requise" });

    const basePath = path || process.env.USERPROFILE || os.homedir();
    const limit = maxResults ? parseInt(maxResults) : 50;

    const pattern = `${basePath.replace(/\\/g, "/")}/**/*${query}*`;
    const results = await fg(pattern, {
      caseSensitiveMatch: false,
      ignore: ["**/node_modules/**", "**/.git/**", "**/AppData/**"],
      onlyFiles: true,
      absolute: true,
    });

    res.json({
      success: true,
      results: results.slice(0, limit),
      total: results.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- LECTURE/ÉCRITURE SÉCURISÉE (AGENT) ---
router.post("/secure-read", async (req, res) => {
  try {
    const content = await secureFileManager.readFile(req.body.path);
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/secure-write", async (req, res) => {
  try {
    const result = await secureFileManager.writeFile(
      req.body.path,
      req.body.content,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- EXPLORATEUR ---
router.get("/list", async (req, res) => {
  try {
    const dirPath = req.query.path || os.homedir();
    const showHidden = req.query.showHidden === "true";
    const result = await fileSystem.listDirectory(dirPath, showHidden);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/read", async (req, res) => {
  try {
    const content = await fileSystem.readTextFile(req.query.path);
    res.json({ success: true, data: { content } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/quick-access", (req, res) => {
  try {
    res.json({ success: true, data: fileSystem.getQuickAccessFolders() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
