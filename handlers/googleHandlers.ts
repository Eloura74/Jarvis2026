/**
 * googleHandlers.ts - Gestionnaires pour les outils Google
 */

import { HandlerContext } from "../types/app.types";

/**
 * Lit les derniers emails
 */
export async function handleGmailRead(
  args: { max?: number; query?: string },
  ctx: HandlerContext,
) {
  const { addLog } = ctx;
  const max = args.max || 3;
  const q = args.query || "";

  try {
    addLog(
      `Consultation Gmail ${q ? `(recherche: ${q})` : "derniers messages"}...`,
      "OMNI",
      "info",
    );
    const response = await fetch(
      `http://localhost:3001/api/google/gmail/list?max=${max}&q=${encodeURIComponent(q)}`,
    );
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    const emails = data.emails;
    if (emails.length === 0) {
      return { status: "success", message: "Aucun email trouvé", data: [] };
    }

    // On ne "speak" plus ici, on laisse le brain générer une synthèse intelligente via Gemini
    emails.forEach((email: any) => {
      addLog(`Email de ${email.from}: ${email.subject}`, "GMAIL", "info");
    });

    return { status: "success", data: emails };
  } catch (error: any) {
    addLog(
      `Erreur Gmail: ${error.message || String(error)}`,
      "SYSTEM",
      "error",
    );
    throw error;
  }
}

/**
 * Envoie un email
 */
export async function handleGmailSend(
  args: { to: string; subject: string; body: string },
  ctx: HandlerContext,
) {
  const { addLog } = ctx;
  const { to, subject, body } = args;

  try {
    addLog(`Envoi d'un mail à ${to}...`, "OMNI", "info");
    const response = await fetch(
      `http://localhost:3001/api/google/gmail/send`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      },
    );
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    return { status: "success", message: "Email envoyé", data: { to } };
  } catch (error: any) {
    addLog(
      `Erreur envoi Gmail: ${error.message || String(error)}`,
      "SYSTEM",
      "error",
    );
    throw error;
  }
}

/**
 * Liste les évènements du calendrier
 */
export async function handleCalendarList(
  args: { max?: number },
  ctx: HandlerContext,
) {
  const { addLog } = ctx;
  const max = args.max || 5;

  try {
    addLog("Consultation de votre calendrier...", "OMNI", "info");
    const response = await fetch(
      `http://localhost:3001/api/google/calendar/events?max=${max}`,
    );
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    const events = data.events;
    if (events.length === 0) {
      return { status: "success", message: "Aucun évènement", data: [] };
    }

    events.forEach((event: any) => {
      const date = new Date(event.start).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      addLog(`RDV: ${event.summary} (${date})`, "CALENDAR", "info");
    });

    return { status: "success", data: events };
  } catch (error: any) {
    addLog(
      `Erreur Calendrier: ${error.message || String(error)}`,
      "SYSTEM",
      "error",
    );
    throw error;
  }
}
