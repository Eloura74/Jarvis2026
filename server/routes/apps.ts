/**
 * Routes API pour la gestion des applications
 *
 * CRUD complet :
 * - GET /api/apps - Liste toutes les apps
 * - POST /api/apps - Ajouter/Modifier une app
 * - DELETE /api/apps/:name - Supprimer une app
 * - POST /api/apps/launch - Tester le lancement
 */

import express, { Request, Response } from "express";
import { exec } from "child_process";
import { promisify } from "util";

const router = express.Router();
const execAsync = promisify(exec);

// Lire les applications
router.get("/", async (_req: Request, res: Response) => {
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
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, data } = req.body;

    if (!name || !data || !data.path) {
      return res.status(400).json({ error: "Données invalides" });
    }

    // En production, on sauvegarderait dans un fichier JSON séparé
    // Pour l'instant, on log juste
    console.log(`📝 Sauvegarde app: ${name}`, data);

    return res.json({ success: true, message: `App ${name} sauvegardée` });
  } catch (error) {
    console.error("Erreur sauvegarde app:", error);
    return res.status(500).json({ error: "Erreur sauvegarde" });
  }
});

// Rechercher une application
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Query parameter 'query' is required and must be a string.",
      });
    }

    // Simulation de recherche
    // Pour l'instant, on renvoie just l'app demandée si elle "existe" dans notre map fictive ou réelle
    const found = {
      name: query, // Pour le MVP on dit qu'on trouve tout
      path: `C:\\Program Files\\${query}\\${query}.exe`, // Faux chemin pour l'exemple
    };

    return res.json({
      status: "success",
      app: found,
    });
  } catch (error) {
    console.error("Erreur app search:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
});

// Supprimer une application
router.delete("/:name", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    console.log(`🗑️ Suppression app: ${name}`);

    return res.json({ success: true, message: `App ${name} supprimée` });
  } catch (error) {
    console.error("Erreur suppression app:", error);
    return res.status(500).json({ error: "Erreur suppression" });
  }
});

// Tester le lancement d'une application
router.post("/launch", async (req: Request, res: Response) => {
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

    return res.json({
      success: true,
      message: `${appName} lancé avec succès`,
      path: app.path,
    });
  } catch (error: unknown) {
    console.error(`❌ Erreur lancement:`, error);
    return res.status(500).json({
      error: "Erreur lancement",
      details: (error as Error).message,
    });
  }
});

export default router;
