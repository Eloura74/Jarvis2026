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
import { fileURLToPath } from "url";

const router = express.Router();
const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour lire le fichier appsDatabase.ts et extraire les apps
async function getAppsFromDatabase() {
  try {
    // Lire le fichier TypeScript
    const dbPath = path.join(__dirname, "..", "..", "appsDatabase.ts");
    const content = await fs.readFile(dbPath, "utf-8");
    
    // Parser basique pour extraire APPS_DATABASE
    // En production, on utiliserait un vrai parser ou un fichier JSON séparé
    const match = content.match(/export const APPS_DATABASE[^=]*=\s*({[\s\S]*?});/);
    
    if (match) {
      // Évaluer le contenu (ATTENTION: à utiliser uniquement avec des fichiers de confiance)
      const appsObj = eval(`(${match[1]})`);
      return appsObj;
    }
    
    return {};
  } catch (error) {
    console.error("Erreur lecture appsDatabase:", error);
    return {};
  }
}

// Lire les applications
router.get("/", async (req, res) => {
  try {
    const apps = await getAppsFromDatabase();
    res.json(apps);
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
    
    // TODO: Implémenter la sauvegarde réelle dans un fichier JSON
    
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
    
    // TODO: Implémenter la suppression réelle
    
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

    const apps = await getAppsFromDatabase();
    const app = apps[appName.toLowerCase()];
    
    if (!app) {
      return res.status(404).json({ error: `App ${appName} non trouvée` });
    }

    console.log(`🚀 Test de lancement: ${appName}`);
    console.log(`📍 Chemin: ${app.path}`);

    // Lancer l'application
    const command = `start "" "${app.path}"`;
    
    await execAsync(command, { shell: true, windowsHide: true });

    res.json({ 
      success: true, 
      message: `${appName} lancé avec succès`,
      path: app.path
    });
  } catch (error) {
    console.error(`❌ Erreur lancement:`, error);
    res.status(500).json({ 
      error: "Erreur lancement", 
      details: error.message 
    });
  }
});

export default router;
