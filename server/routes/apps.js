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
import { getCollection, saveCollection } from "../configService.js";

const router = express.Router();
const execAsync = promisify(exec);

// Lire les applications
router.get("/", async (req, res) => {
  try {
    const apps = await getCollection("apps");
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

    const apps = await getCollection("apps");
    apps[name.toLowerCase()] = data;
    await saveCollection("apps", apps);

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
    const apps = await getCollection("apps");

    if (apps[name.toLowerCase()]) {
      delete apps[name.toLowerCase()];
      await saveCollection("apps", apps);
      res.json({ success: true, message: `App ${name} supprimée` });
    } else {
      res.status(404).json({ error: "App non trouvée" });
    }
  } catch (error) {
    console.error("Erreur suppression app:", error);
    res.status(500).json({ error: "Erreur suppression" });
  }
});

// Tester le lancement d'une application
router.post("/launch", async (req, res) => {
  try {
    const { appName } = req.body;
    console.log(`🚀 [launch] Requête reçue:`, { appName, body: req.body });

    if (!appName) {
      console.error(`❌ [launch] Nom d'app manquant`);
      return res.status(400).json({ error: "Nom d'app requis" });
    }

    const apps = await getCollection("apps");
    const searchKey = appName.toLowerCase();
    console.log(`🔍 [launch] Recherche app: "${searchKey}"`);

    const app = apps[searchKey];

    if (!app) {
      console.error(
        `❌ [launch] App "${appName}" non trouvée (clé: "${searchKey}")`,
      );
      console.log(
        `📋 [launch] Apps disponibles:`,
        Object.keys(apps).slice(0, 10),
      );
      return res.status(404).json({ error: `App ${appName} non trouvée` });
    }

    console.log(`✅ [launch] App trouvée: ${appName}`);
    console.log(`📍 [launch] Chemin: ${app.path}`);

    // Lancer l'application
    const command = `start "" "${app.path}"`;

    await execAsync(command, { shell: true, windowsHide: true });

    res.json({
      success: true,
      message: `${appName} lancé avec succès`,
      path: app.path,
    });
  } catch (error) {
    console.error(`❌ Erreur lancement:`, error);
    res.status(500).json({
      error: "Erreur lancement",
      details: error.message,
    });
  }
});

export default router;
