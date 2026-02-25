/**
 * Service Vision - Gemini Vision API
 * - Capture webcam
 * - Analyse image avec Gemini Vision
 * - Détection objets/personnes
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

/**
 * Capture une image depuis la webcam (simulation pour backend Node.js)
 * En production, utiliser un outil comme ffmpeg ou imagesnap (macOS)
 */
async function captureWebcam() {
  try {
    // Pour Windows : utiliser ffmpeg ou CommandCam
    // Pour macOS : utiliser imagesnap
    // Pour Linux : utiliser fswebcam

    const platform = process.platform;
    const tempDir = path.join(__dirname, "../../temp");
    const imagePath = path.join(tempDir, `webcam_${Date.now()}.jpg`);

    // Créer dossier temp si inexistant
    await fs.mkdir(tempDir, { recursive: true });

    let command = "";

    if (platform === "win32") {
      // Windows : utiliser ffmpeg (doit être installé)
      // ffmpeg -f dshow -i video="Integrated Camera" -frames:v 1 output.jpg
      command = `ffmpeg -f dshow -i video="Integrated Camera" -frames:v 1 "${imagePath}" -y`;
    } else if (platform === "darwin") {
      // macOS : utiliser imagesnap (doit être installé : brew install imagesnap)
      command = `imagesnap "${imagePath}"`;
    } else {
      // Linux : utiliser fswebcam (doit être installé : sudo apt install fswebcam)
      command = `fswebcam -r 1280x720 --no-banner "${imagePath}"`;
    }

    // Exécuter la commande
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    await execAsync(command);

    // Vérifier que l'image existe
    await fs.access(imagePath);

    return imagePath;
  } catch (error) {
    console.error("Erreur capture webcam:", error.message);
    throw new Error(`Impossible de capturer webcam: ${error.message}`);
  }
}

/**
 * Analyse une image avec Gemini Vision
 */
export async function analyzeImageWithGemini(
  imagePath,
  prompt = "Décris ce que tu vois dans cette image.",
) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY non configuré");
    }

    // Initialiser Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Lire l'image en base64
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");

    // Préparer le contenu pour Gemini Vision
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg",
      },
    };

    // Générer l'analyse
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      analysis: text,
      imagePath,
    };
  } catch (error) {
    console.error("Erreur analyse Gemini Vision:", error.message);
    throw new Error(`Impossible d'analyser l'image: ${error.message}`);
  }
}

/**
 * Capture webcam et analyse avec Gemini Vision
 */
export async function captureAndAnalyzeWebcam(prompt) {
  try {
    // Capturer l'image
    const imagePath = await captureWebcam();

    // Analyser avec Gemini Vision
    const result = await analyzeImageWithGemini(imagePath, prompt);

    // Convertir le chemin en URL relative pour le frontend
    const imageUrl = `/temp/${path.basename(imagePath)}`;

    return {
      success: true,
      analysis: result.analysis,
      imagePath,
      imageUrl,
    };
  } catch (error) {
    console.error("Erreur captureAndAnalyzeWebcam:", error.message);
    throw new Error(`Impossible de capturer et analyser: ${error.message}`);
  }
}

/**
 * Nettoie les anciennes images temporaires (>1h)
 */
export async function cleanupOldImages() {
  try {
    const tempDir = path.join(__dirname, "../../temp");

    // Créer le dossier temp s'il n'existe pas
    try {
      await fs.access(tempDir);
    } catch {
      await fs.mkdir(tempDir, { recursive: true });
      return; // Pas de fichiers à nettoyer si le dossier vient d'être créé
    }

    const files = await fs.readdir(tempDir);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const file of files) {
      if (file.startsWith("webcam_")) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > oneHour) {
          await fs.unlink(filePath);
          console.log(`Nettoyage: ${file} supprimé`);
        }
      }
    }
  } catch (error) {
    console.error("Erreur nettoyage images:", error.message);
  }
}

// Nettoyer les anciennes images toutes les heures
setInterval(cleanupOldImages, 60 * 60 * 1000);
