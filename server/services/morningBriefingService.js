/**
 * morningBriefingService.js — Briefing Vocal Matinal pour J.A.R.V.I.S.
 *
 * Génère un résumé structuré au démarrage ou sur demande :
 * - Météo actuelle (via l'API weather du backend)
 * - Prochains événements Calendar (3 max)
 * - Nombre de mails non lus Gmail
 * - Statut des imprimantes 3D (si actives)
 * - Salutation adaptée à l'heure
 *
 * Expose : GET /api/briefing
 * Retourne un objet { text: string, sections: object[] } prêt à être vocalisé.
 */

import { listEvents, listEmails } from "../googleService.js";

/**
 * Retourne la salutation adaptée à l'heure locale.
 * @returns {string} "Bonjour" | "Bon après-midi" | "Bonsoir"
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

/**
 * Formate une date ISO en texte lisible en français.
 * @param {string} isoDate - Date ISO 8601
 * @returns {string} Ex: "lundi 23 février à 10h00"
 */
function formatEventDate(isoDate) {
  try {
    const date = new Date(isoDate);
    return date.toLocaleString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoDate;
  }
}

/**
 * Récupère les données météo depuis le backend local.
 * @param {string} city - Ville (ex: "Paris")
 * @returns {Promise<string>} Résumé météo texte
 */
async function fetchWeatherSummary(city = "Annecy") {
  try {
    const res = await fetch(
      `http://localhost:3001/api/weather/current?city=${encodeURIComponent(city)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Adapter selon la structure retournée par weatherRoutes
    const temp = data?.main?.temp ?? data?.temperature;
    const desc = data?.weather?.[0]?.description ?? data?.description ?? "";
    if (temp === undefined) return null;
    return `${Math.round(temp)}°C, ${desc}`;
  } catch {
    return null;
  }
}

/**
 * Génère le briefing matinal complet.
 *
 * @param {object} options
 * @param {string} options.city - Ville pour la météo
 * @param {number} options.maxEvents - Nombre max d'événements Calendar (défaut: 3)
 * @param {number} options.maxEmails - Nombre max de mails à compter (défaut: 10)
 * @returns {Promise<{ text: string, sections: Array<{title: string, content: string}> }>}
 */
export async function generateMorningBriefing({
  city = "Annecy",
  maxEvents = 3,
  maxEmails = 10,
} = {}) {
  const sections = [];
  const parts = [];

  const greeting = getGreeting();
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  parts.push(`${greeting} Monsieur. Nous sommes le ${dateStr}.`);

  // --- MÉTÉO ---
  const weatherSummary = await fetchWeatherSummary(city);
  if (weatherSummary) {
    const weatherText = `La météo à ${city} : ${weatherSummary}.`;
    parts.push(weatherText);
    sections.push({ title: "Météo", content: weatherText, icon: "🌤️" });
  }

  // --- CALENDAR ---
  try {
    const events = await listEvents(maxEvents);
    if (events && events.length > 0) {
      const eventLines = events
        .slice(0, maxEvents)
        .map((e) => `${e.summary} le ${formatEventDate(e.start)}`);
      const calText =
        events.length === 1
          ? `Vous avez 1 événement : ${eventLines[0]}.`
          : `Vous avez ${events.length} événements : ${eventLines.join(", ")}.`;
      parts.push(calText);
      sections.push({ title: "Agenda", content: calText, icon: "📅" });
    } else {
      const noEventsText = "Votre agenda est libre aujourd'hui.";
      parts.push(noEventsText);
      sections.push({ title: "Agenda", content: noEventsText, icon: "📅" });
    }
  } catch {
    // Google non configuré — on passe silencieusement
  }

  // --- GMAIL ---
  try {
    const emails = await listEmails(maxEmails, "is:unread");
    if (emails && emails.length > 0) {
      const mailText =
        emails.length === 1
          ? "Vous avez 1 mail non lu."
          : `Vous avez ${emails.length} mails non lus.`;
      parts.push(mailText);
      sections.push({ title: "Mails", content: mailText, icon: "📧" });
    }
  } catch {
    // Google non configuré — on passe silencieusement
  }

  // Conclusion
  parts.push("Je suis à votre disposition, Monsieur.");

  return {
    text: parts.join(" "),
    sections,
    generatedAt: new Date().toISOString(),
  };
}
