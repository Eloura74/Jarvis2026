/**
 * Routes API pour la gestion des raccourcis clavier
 */

import express from "express";
import { getCollection, saveCollection } from "../configService.js";

const router = express.Router();

// Liste des raccourcis
router.get("/", async (req, res) => {
  try {
    const shortcuts = await getCollection("shortcuts");
    res.json(shortcuts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ajouter/Modifier un raccourci
router.post("/", async (req, res) => {
  try {
    const { name, data } = req.body;
    if (!name || !data) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const shortcuts = await getCollection("shortcuts");
    shortcuts[name] = data;
    await saveCollection("shortcuts", shortcuts);

    res.json({ success: true, message: `Raccourci ${name} sauvegardé` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un raccourci
router.delete("/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const shortcuts = await getCollection("shortcuts");

    if (shortcuts[name]) {
      delete shortcuts[name];
      await saveCollection("shortcuts", shortcuts);
      res.json({ success: true, message: `Raccourci ${name} supprimé` });
    } else {
      res.status(404).json({ error: "Raccourci non trouvé" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
