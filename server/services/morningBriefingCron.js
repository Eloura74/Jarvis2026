import { generateMorningBriefing } from "./morningBriefingService.js";
import { broadcastEvent } from "../routes/events.js";

let intervalId = null;

function checkMorningBriefing() {
  const now = new Date();
  
  // Check if it's 7:00 AM
  if (now.getHours() === 7 && now.getMinutes() === 0) {
    const lastRun = global.lastMorningBriefingRun || 0;
    // Ensure we run only once per day (checking within a 1-hour margin)
    if (now.getTime() - lastRun > 60 * 60 * 1000) {
      global.lastMorningBriefingRun = now.getTime();
      runMorningBriefing();
    }
  }
}

async function runMorningBriefing() {
  console.log("🌅 [MORNING BRIEFING] Génération du briefing automatique...");
  try {
    const briefing = await generateMorningBriefing({ city: "Annecy" });
    
    // Broadcast l'événement proactif vers le frontend
    broadcastEvent(
      "MORNING_BRIEFING",
      {
        sections: briefing.sections,
        generatedAt: briefing.generatedAt
      },
      briefing.text
    );
  } catch (err) {
    console.error("❌ [MORNING BRIEFING] Erreur génération:", err.message);
  }
}

/**
 * Démarre le cron job pour le briefing du matin
 */
export function startMorningBriefingCron() {
  if (intervalId) return;
  console.log("🌅 [MORNING BRIEFING] Cron démarré (exécution prévue à 07:00)");
  
  // Vérification toutes les minutes
  intervalId = setInterval(checkMorningBriefing, 60 * 1000);
}

/**
 * Arrête le cron job
 */
export function stopMorningBriefingCron() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("🌅 [MORNING BRIEFING] Cron arrêté");
  }
}
