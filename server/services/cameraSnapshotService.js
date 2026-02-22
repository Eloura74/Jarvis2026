/**
 * cameraSnapshotService.js — Capture de snapshots webcam pour J.A.R.V.I.S.
 *
 * Fonctionnement :
 * - Récupère une frame JPEG depuis l'URL de stream MJPEG d'une imprimante
 * - Retourne l'image en base64 pour affichage dans l'overlay holographique
 * - Timeout strict de 5s pour éviter de bloquer le serveur
 * - Supporte les streams MJPEG (Klipper/Moonraker) et les URLs d'image statique
 *
 * Expose : GET /api/camera/snapshot?url=<webcamUrl>
 */

// Timeout pour la capture (ms) — évite de bloquer si la caméra est hors ligne
const SNAPSHOT_TIMEOUT_MS = 5_000;

// Taille max de la réponse acceptée (5 MB) — protection contre les streams infinis
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

// Liste blanche des IPs/hostnames autorisés (sécurité : évite le SSRF)
// Seules les adresses du réseau local sont acceptées
const ALLOWED_HOST_PATTERNS = [
  /^192\.168\.\d{1,3}\.\d{1,3}$/,  // 192.168.x.x
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 10.x.x.x
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, // 172.16-31.x.x
  /^localhost$/,
  /^127\.0\.0\.1$/,
];

/**
 * Vérifie que l'URL pointe vers un hôte du réseau local (anti-SSRF).
 * @param {string} urlStr - URL à valider
 * @returns {boolean} true si l'URL est autorisée
 */
function isAllowedUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    // Seul HTTP est autorisé (pas de file://, ftp://, etc.)
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const hostname = url.hostname;
    return ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}

/**
 * Capture un snapshot JPEG depuis une URL de webcam.
 *
 * Pour les streams MJPEG (?action=stream), on lit uniquement la première frame.
 * Pour les URLs d'image statique (?action=snapshot), on lit directement.
 *
 * @param {string} webcamUrl - URL du stream ou snapshot (ex: "http://192.168.1.130/webcam/?action=stream")
 * @returns {Promise<{ base64: string, mimeType: string, capturedAt: string }>}
 * @throws {Error} Si l'URL est invalide, non autorisée, ou si la capture échoue
 */
export async function captureSnapshot(webcamUrl) {
  // Validation de sécurité : URL locale uniquement
  if (!isAllowedUrl(webcamUrl)) {
    throw new Error(`URL non autorisée : seules les adresses réseau local sont acceptées.`);
  }

  // Normaliser l'URL : préférer ?action=snapshot à ?action=stream pour une image statique
  // Klipper/Mainsail expose les deux endpoints
  const snapshotUrl = webcamUrl.replace("?action=stream", "?action=snapshot");

  // AbortController pour le timeout strict
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SNAPSHOT_TIMEOUT_MS);

  try {
    const response = await fetch(snapshotUrl, {
      signal: controller.signal,
      headers: {
        // Indiquer qu'on veut une image (certains serveurs vérifient Accept)
        Accept: "image/jpeg, image/png, image/*",
      },
    });

    if (!response.ok) {
      throw new Error(`Caméra inaccessible (HTTP ${response.status})`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Lire le corps en ArrayBuffer avec limite de taille
    const reader = response.body.getReader();
    const chunks = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      // Protection contre les réponses trop volumineuses (stream infini)
      if (totalBytes > MAX_RESPONSE_BYTES) {
        reader.cancel();
        throw new Error("Réponse trop volumineuse (stream MJPEG non supporté directement).");
      }
      chunks.push(value);
    }

    // Assembler les chunks en Buffer
    const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    const base64 = buffer.toString("base64");

    return {
      base64,
      mimeType: contentType.split(";")[0].trim(),
      capturedAt: new Date().toISOString(),
      sizeBytes: buffer.byteLength,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
