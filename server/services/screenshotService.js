import screenshot from "screenshot-desktop";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Définir __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Service de capture d'écran contextuelle
 * Prend un screenshot de l'écran principal et le retourne en base64 pour analyse IA
 */
export const takeContextualScreenshot = async () => {
  try {
    console.log("📸 Capture d'écran demandée (Copilote de Bureau)...");

    // On sauvegarde l'image dans le dossier temporaire du serveur
    const imgPath = path.join(__dirname, "..", "temp_screenshot.jpg"); // JPG plus léger que PNG

    // Capture de tous les écrans ou écran principal
    // Format JPG pour alléger la base64 envoyée à Gemini Vision
    await screenshot({ filename: imgPath, format: "jpg" });

    // Lecture en Base64
    const imgBuffer = fs.readFileSync(imgPath);
    const base64Image = imgBuffer.toString("base64");

    // Nettoyage immédiat pour la confidentialité
    try {
      fs.unlinkSync(imgPath);
    } catch (err) {
      console.warn("⚠️ Impossible de supprimer le screenshot temporaire", err);
    }

    // On retourne le mime type et les données pour vision
    return {
      success: true,
      mimeType: "image/jpeg",
      data: base64Image,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la capture d'écran :", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
