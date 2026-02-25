/**
 * Routes pour TrueNAS
 * - État pools de stockage
 * - Santé disques (SMART)
 * - Services actifs/inactifs
 * - Statistiques système
 */

import express from "express";
import {
  getPoolsStatus,
  getDisksHealth,
  getServicesStatus,
  getSystemStats,
} from "../services/truenasService.js";
import { searchLimiter } from "../middleware/index.js";

const router = express.Router();

/**
 * GET /api/truenas/pools
 * Récupère l'état des pools de stockage
 */
router.get("/pools", searchLimiter, async (req, res) => {
  try {
    const pools = await getPoolsStatus();
    res.json({ success: true, pools });
  } catch (error) {
    console.error("❌ Erreur pools TrueNAS:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/truenas/disks
 * Récupère la santé des disques (SMART)
 */
router.get("/disks", searchLimiter, async (req, res) => {
  try {
    const disks = await getDisksHealth();
    res.json({ success: true, disks });
  } catch (error) {
    console.error("❌ Erreur disques TrueNAS:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/truenas/services
 * Récupère l'état des services TrueNAS
 */
router.get("/services", searchLimiter, async (req, res) => {
  try {
    const services = await getServicesStatus();
    res.json({ success: true, services });
  } catch (error) {
    console.error("❌ Erreur services TrueNAS:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/truenas/stats
 * Récupère les statistiques système TrueNAS
 */
router.get("/stats", searchLimiter, async (req, res) => {
  try {
    const stats = await getSystemStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error("❌ Erreur stats TrueNAS:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
