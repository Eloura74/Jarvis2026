import express from "express";
import localMemory from "../services/localMemory.js";

const router = express.Router();

/**
 * Routes pour la mémoire locale (RAG)
 */

router.post("/scan", async (req, res) => {
  const { path } = req.body;
  if (!path) return res.status(400).json({ error: "Path required" });

  try {
    const result = await localMemory.indexDirectory(path);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/search", (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Query required" });

  const results = localMemory.search(query);
  res.json({ count: results.length, results });
});

export default router;
