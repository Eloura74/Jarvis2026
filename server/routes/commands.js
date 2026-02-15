/**
 * Routes API pour la gestion des commandes personnalisées
 */

import express from "express";
import { getCollection, saveCollection } from "../configService.js";

const router = express.Router();

// Liste des commandes
router.get("/", async (req, res) => {
  try {
    const commands = await getCollection("commands");
    res.json(commands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ajouter/Modifier une commande
router.post("/", async (req, res) => {
  try {
    const { name, data } = req.body;
    if (!name || !data) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const commands = await getCollection("commands");
    commands[name] = data;
    await saveCollection("commands", commands);

    res.json({ success: true, message: `Commande ${name} sauvegardée` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une commande
router.delete("/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const commands = await getCollection("commands");

    if (commands[name]) {
      delete commands[name];
      await saveCollection("commands", commands);
      res.json({ success: true, message: `Commande ${name} supprimée` });
    } else {
      res.status(404).json({ error: "Commande non trouvée" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
