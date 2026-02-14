/**
 * googleHandlers.ts - Gestionnaires pour les outils Google
 */

import { HandlerContext } from "../types/app.types";

/**
 * Lit les derniers emails
 */
export async function handleGmailRead(
  args: { max?: number },
  ctx: HandlerContext,
) {
  const { addLog, speak } = ctx;
  const max = args.max || 3;

  try {
    addLog(`Consultation des ${max} derniers emails...`, "OMNI", "info");
    const response = await fetch(
      `http://localhost:3001/api/google/gmail/list?max=${max}`,
    );
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    const emails = data.emails;
    if (emails.length === 0) {
      speak("Vous n'avez aucun nouveau message.");
      return { status: "success", message: "Aucun email trouvé" };
    }

    let summary = `Vous avez ${emails.length} nouveaux messages. `;
    emails.forEach((email: any, i: number) => {
      summary += `Message ${i + 1} de ${email.from}, sujet : ${email.subject}. `;
      addLog(`Email de ${email.from}: ${email.subject}`, "GMAIL", "info");
    });

    speak(summary);
    return { status: "success", data: emails };
  } catch (error: any) {
    addLog(
      `Erreur Gmail: ${error.message || String(error)}`,
      "SYSTEM",
      "error",
    );
    speak("Désolé, je n'ai pas pu consulter vos emails.");
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
  const { addLog, speak } = ctx;
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

    speak(`C'est fait, le mail a été envoyé à ${to}.`);
    return { status: "success", message: "Email envoyé" };
  } catch (error: any) {
    addLog(
      `Erreur envoi Gmail: ${error.message || String(error)}`,
      "SYSTEM",
      "error",
    );
    speak("Désolé, je n'ai pas pu envoyer l'email.");
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
  const { addLog, speak } = ctx;
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
      speak("Votre agenda est vide pour le moment.");
      return { status: "success", message: "Aucun évènement" };
    }

    let summary = `Vous avez ${events.length} évènements prévus. `;
    events.forEach((event: any) => {
      const date = new Date(event.start).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const time = new Date(event.start).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      summary += `${event.summary}, le ${date} à ${time}. `;
      addLog(`RDV: ${event.summary} (${date})`, "CALENDAR", "info");
    });

    speak(summary);
    return { status: "success", data: events };
  } catch (error: any) {
    addLog(
      `Erreur Calendrier: ${error.message || String(error)}`,
      "SYSTEM",
      "error",
    );
    speak("Je n'ai pas pu accéder à votre calendrier.");
    throw error;
  }
}
