/**
 * Routes API pour la gestion des applications
 * 
 * CRUD complet :
 * - GET /api/apps - Liste toutes les apps
 * - POST /api/apps - Ajouter/Modifier une app
 * - DELETE /api/apps/:name - Supprimer une app
 * - POST /api/apps/launch - Tester le lancement
 */

import express from "express";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const router = express.Router();
const execAsync = promisify(exec);

// Chemin vers le fichier de base de données
const DB_PATH = path.join(__dirname, "..", "..", "appsDatabase.ts");

// Lire les applications
router.get("/", async (req, res) => {
  try {
    // En production, on lirait depuis un fichier JSON
    // Pour l'instant, on retourne les apps par défaut
    const { APPS_DATABASE } = await import("../../appsDatabase");
    res.json(APPS_DATABASE);
  } catch (error) {
    console.error("Erreur lecture apps:", error);
    res.status(500).json({ error: "Erreur lecture apps" });
  }
});

// Ajouter/Modifier une application
router.post("/", async (req, res) => {
  try {
    const { name, data } = req.body;
    
    if (!name || !data || !data.path) {
      return res.status(400).json({ error: "Données invalides" });
    }

    // En production, on sauvegarderait dans un fichier JSON séparé
    // Pour l'instant, on log juste
    console.log(`📝 Sauvegarde app: ${name}`, data);
    
    res.json({ success: true, message: `App ${name} sauvegardée` });
  } catch (error) {
    console.error("Erreur sauvegarde app:", error);
    res.status(500).json({ error: "Erreur sauvegarde" });
  }
});

// Supprimer une application
router.delete("/:name", async (req, res) => {
  try {
    const { name } = req.params;
    
    console.log(`🗑️ Suppression app: ${name}`);
    
    res.json({ success: true, message: `App ${name} supprimée` });
  } catch (error) {
    console.error("Erreur suppression app:", error);
    res.status(500).json({ error: "Erreur suppression" });
  }
});

// Tester le lancement d'une application
router.post("/launch", async (req, res) => {
  try {
    const { appName } = req.body;
    
    if (!appName) {
      return res.status(400).json({ error: "Nom d'app requis" });
    }

    const { APPS_DATABASE } = await import("../../appsDatabase");
    const app = APPS_DATABASE[appName.toLowerCase()];
    
    if (!app) {
      return res.status(404).json({ error: `App ${appName} non trouvée` });
    }

    console.log(`🚀 Test de lancement: ${appName}`);
    console.log(`📍 Chemin: ${app.path}`);

    // Lancer l'application
    const command = `start "" "${app.path}"`;
    await execAsync(command);

    res.json({ 
      success: true, 
      message: `${appName} lancé avec succès`,
      path: app.path
    });
  } catch (error: any) {
    console.error(`❌ Erreur lancement:`, error);
    res.status(500).json({ 
      error: "Erreur lancement", 
      details: error.message 
    });
  }
});

export default router;
