/**
 * Service pour la gestion du Ducking Audio (Baisse du son)
 * Utilise 'loudness' pour réduire le volume global de Windows quand Jarvis parle.
 */

import loudness from "loudness";

let originalVolume = null;
let isDucked = false;

// Baisse le volume de 80%
export async function duckAudio() {
  try {
    if (isDucked) return;

    const vol = await loudness.getVolume();
    if (vol === null || vol === undefined) return;

    // On sauvegarde le volume original s'il est au-dessus d'un seuil minimal
    if (vol > 15) {
      originalVolume = vol;
      // On réduit à environ 20% du volume actuel, avec un minimum de 10
      const targetVol = Math.max(10, Math.floor(vol * 0.2));
      await loudness.setVolume(targetVol);
      isDucked = true;
      console.log(`[Ducking] Volume baissé de ${vol}% à ${targetVol}%`);
    } else {
      // Si le son est déjà très bas, pas besoin de le baisser, mais on ne duck pas.
      originalVolume = null;
    }
  } catch (error) {
    console.error("[Ducking] Erreur duckAudio:", error.message);
  }
}

// Restaure le volume précédent
export async function restoreAudio() {
  try {
    if (!isDucked || originalVolume === null) return;

    await loudness.setVolume(originalVolume);
    console.log(`[Ducking] Volume restauré à ${originalVolume}%`);

    isDucked = false;
    originalVolume = null;
  } catch (error) {
    console.error("[Ducking] Erreur restoreAudio:", error.message);
    // Fallback de sûreté
    isDucked = false;
    originalVolume = null;
  }
}
