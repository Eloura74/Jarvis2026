// ============================================================================
// SYNTHÈSE DES RÉSULTATS D'OUTILS — JARVIS
// ============================================================================
// Ce module gère la transformation des données brutes retournées par les outils
// (Gmail, Calendrier, Météo, etc.) en phrases vocales naturelles en français.
// Il contient également l'analyse QMS et le briefing neural.

import {
  generateSummarizeProxy,
  generateQMSProxy,
} from "./geminiProxyClient";
import { waitIfNecessary, checkShield, record429 } from "./geminiRateLimiter";

// ============================================================================
// RÉSUMÉ VOCAL DES RÉSULTATS D'OUTILS
// ============================================================================

/**
 * Transforme le résultat brut d'un outil en phrase vocale naturelle en français.
 * Chaque outil a un template spécialisé pour une synthèse optimale.
 * En dernier recours, délègue à Gemini via le proxy backend.
 *
 * @param toolName - Nom de l'outil appelé (ex: "gmail_read", "get_weather")
 * @param resultData - Données brutes retournées par l'outil
 * @returns Phrase vocale prête à être lue par le TTS
 */
export const summarizeToolResults = async (
  toolName: string,
  resultData: unknown,
): Promise<string> => {
  await waitIfNecessary();

  try {
    // --- Gmail : liste des mails non lus ---
    if (toolName === "gmail_read") {
      const emails = resultData as Array<{
        from: string;
        subject: string;
        date: string;
      }>;
      if (!emails || emails.length === 0) {
        return "Aucun mail non lu, Monsieur.";
      }
      // Construire un résumé direct sans passer par Gemini pour éviter le fallback
      const lines = emails.map((e, i) => {
        // Extraire juste le nom de l'expéditeur (avant le <email>)
        const senderName = e.from
          ? e.from
              .replace(/<[^>]+>/g, "")
              .replace(/"/g, "")
              .trim()
          : "Expéditeur inconnu";
        return `${i + 1}. De ${senderName} : ${e.subject || "sans objet"}`;
      });
      return `Monsieur a ${emails.length} mail${emails.length > 1 ? "s" : ""} non lu${emails.length > 1 ? "s" : ""}. ${lines.join(". ")}.`;
    }

    // --- Calendrier : liste des événements à venir ---
    if (toolName === "calendar_list") {
      const events = resultData as Array<{ summary: string; start: string }>;
      if (!events || events.length === 0) {
        return "Aucun événement à venir dans votre agenda, Monsieur.";
      }
      const lines = events.slice(0, 3).map((e) => {
        const date = new Date(e.start).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        });
        return `${e.summary} le ${date}`;
      });
      return `Voici vos prochains rendez-vous, Monsieur : ${lines.join(", ")}.`;
    }

    // --- Calendrier : création d'un événement ---
    if (toolName === "calendar_create") {
      const event = resultData as {
        summary?: string;
        start?: { dateTime?: string };
      };
      const title = event?.summary || "l'événement";
      return `Rendez-vous "${title}" ajouté à votre agenda, Monsieur.`;
    }

    // --- Calendrier : prochain rendez-vous ---
    if (toolName === "calendar_next") {
      const result = resultData as {
        summary?: string;
        timeLabel?: string;
        location?: string;
      } | null;
      if (!result || !result.summary) {
        return "Aucun rendez-vous à venir dans votre agenda, Monsieur.";
      }
      const loc = result.location ? `, à ${result.location}` : "";
      return `Votre prochain rendez-vous est "${result.summary}", ${result.timeLabel}${loc}, Monsieur.`;
    }

    // --- WhatsApp : confirmation d'envoi ---
    if (toolName === "whatsapp_reply") {
      const result = resultData as { message?: string } | null;
      return result?.message || "Message WhatsApp envoyé, Monsieur.";
    }

    // --- Météo : conditions actuelles ou prévisions ---
    if (toolName === "get_weather") {
      const w = resultData as {
        temperature?: number;
        condition?: string;
        city?: string;
        windSpeed?: number;
        humidity?: number;
        precipitation?: number;
      } | null;

      if (!w || w.condition === "Offline") {
        return "Je n'ai pas pu récupérer la météo, Monsieur. Vérifiez votre connexion.";
      }

      const city = w.city || "votre position";
      const temp =
        w.temperature !== undefined
          ? `${w.temperature}°C`
          : "température inconnue";
      const cond = w.condition || "conditions inconnues";
      const wind =
        w.windSpeed !== undefined ? `vent à ${w.windSpeed} km/h` : null;
      const humidity =
        w.humidity !== undefined ? `humidité à ${w.humidity}%` : null;

      // Construire une phrase naturelle et complète
      let response = `Monsieur, à ${city}, il fait actuellement ${temp}, ${cond}.`;
      if (wind && humidity) {
        response += ` ${wind}, ${humidity}.`;
      } else if (wind) {
        response += ` ${wind}.`;
      }
      if (w.precipitation && w.precipitation > 0) {
        response += ` Probabilité de précipitations : ${w.precipitation}%.`;
      }
      return response;
    }

    // --- Trajet / trafic ---
    if (toolName === "get_travel_time") {
      const t = resultData as {
        duration?: string;
        distance?: string;
        destination?: string;
        trafficInfo?: string;
      } | null;
      if (!t) return "Impossible de calculer le trajet, Monsieur.";
      const dest = t.destination ? ` vers ${t.destination}` : "";
      const dur = t.duration || "durée inconnue";
      const dist = t.distance ? `, soit ${t.distance}` : "";
      const traffic = t.trafficInfo ? ` ${t.trafficInfo}.` : ".";
      return `Monsieur, le trajet${dest} prend environ ${dur}${dist}${traffic}`;
    }

    // --- Fallback générique : délégation à Gemini via proxy backend ---
    const prompt =
      "Synthétise ces résultats de l'outil '" +
      toolName +
      "' pour Monsieur en 1-2 phrases en français, de façon naturelle et concise.\n" +
      "DONNÉES: " +
      JSON.stringify(resultData).substring(0, 2000) +
      "\nRÈGLES: répondre en français, s'adresser comme 'Monsieur', ne pas lire les emails complets.";

    return await generateSummarizeProxy(prompt);
  } catch (err: unknown) {
    console.error("Erreur summarize:", err);
    return "J'ai les résultats, Monsieur.";
  }
};

// ============================================================================
// ANALYSE QMS (QUANTUM MEMORY STITCHING)
// ============================================================================

/**
 * Analyse les logs système pour proposer une action proactive à Monsieur.
 * Utilisé par le moteur QMS pour détecter des opportunités d'automatisation.
 *
 * @param logs - Tableau de logs système récents
 * @param taskContext - Contexte de la tâche en cours
 * @returns Suggestion d'action proactive ou { hasSuggestion: false } si rien à proposer
 */
export const getQMSAnalysis = async (
  logs: string[],
  taskContext: string,
): Promise<{
  hasSuggestion: boolean;
  tool?: string;
  args?: Record<string, unknown>;
  explanation?: string;
}> => {
  await waitIfNecessary();
  try {
    const prompt =
      "Analyse ces logs système pour proposer une action proactive à Monsieur. \n" +
      "LOGS: " +
      JSON.stringify(logs) +
      "\n" +
      "CONTEXTE: " +
      taskContext +
      "\n\n" +
      "RÉPONDRE UNIQUEMENT EN JSON avec structure: { hasSuggestion: boolean, tool: string, args: object, explanation: string }";

    // Via proxy backend (S1)
    return await generateQMSProxy(prompt);
  } catch {
    /* Silently fail QMS si surchargé */
    return { hasSuggestion: false };
  }
};

// ============================================================================
// BRIEFING NEURAL
// ============================================================================

/**
 * Génère un briefing court basé sur des logs système.
 * Utilisé par l'outil "get_neural_briefing" dans useToolExecutor.
 *
 * @param task - Description de la tâche en cours
 * @param logs - Tableau de logs système récents
 * @returns Phrase de briefing vocale en français
 */
export const getNeuralBriefing = async ({
  task,
  logs,
}: {
  task: string;
  logs: string[];
}): Promise<string> => {
  if (checkShield())
    return "Systèmes nominaux, Monsieur. Neural Core en refroidissement.";
  await waitIfNecessary();

  try {
    const prompt =
      "Génère un briefing court basés sur ces logs: " +
      JSON.stringify(logs) +
      "\n" +
      "CONTEXTE: " +
      task;

    // Via proxy backend (S1)
    return await generateSummarizeProxy(prompt);
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message?.includes("429")) record429();
    return "Briefing indisponible momentanément, Monsieur.";
  }
};
