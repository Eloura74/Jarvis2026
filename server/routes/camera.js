/**
 * Routes REST pour les snapshots caméra webcam
 * Montées sur /api/camera dans server.js
 */

import express from "express";
import { captureSnapshot } from "../services/cameraSnapshotService.js";

const router = express.Router();

/**
 * GET /api/camera/snapshot?url=<webcamUrl>
 * Capture un snapshot JPEG depuis une webcam locale et le retourne en base64.
 *
 * Query params :
 *   url (requis) - URL de la webcam (ex: "http://192.168.1.130/webcam/?action=stream")
 *
 * Réponse :
 *   { base64: string, mimeType: string, capturedAt: string, sizeBytes: number }
 *
 * Sécurité :
 *   - Seules les URLs réseau local (192.168.x.x, 10.x.x.x, localhost) sont acceptées
 *   - Timeout strict 5s
 *   - Taille max 5 MB
 */
router.get("/snapshot", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Paramètre 'url' requis." });
  }

  try {
    const snapshot = await captureSnapshot(url);
    res.json(snapshot);
  } catch (error) {
    // Distinguer les erreurs de sécurité (403) des erreurs réseau (502)
    const isSecurityError = error.message.includes("non autorisée");
    res.status(isSecurityError ? 403 : 502).json({ error: error.message });
  }
});

export default router;
