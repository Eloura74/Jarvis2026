/**
 * googleHandlers.ts - Gestionnaires pour les outils Google
 */

import { HandlerContext } from "../types/app.types";

/**
 * Lit les derniers emails
 */
export async function handleGmailRead(
  args: { max?: number; maxResults?: number; query?: string },
  ctx: HandlerContext,
) {
  const { addLog } = ctx;
  // Gemini envoie parfois 'maxResults' au lieu de 'max' — on accepte les deux
  const max = args.max || args.maxResults || 5;
  // Par défaut : mails non lus uniquement (is:unread), sauf si query explicite
  const q = args.query !== undefined ? args.query : "is:unread";

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

    interface GmailMessage {
      id: string;
      snippet: string;
      from: string;
      subject: string;
      date: string;
    }

    const emails = data.emails as GmailMessage[];
    if (emails.length === 0) {
      return { status: "success", message: "Aucun email trouvé", data: [] };
    }

    // On ne "speak" plus ici, on laisse le brain générer une synthèse intelligente via Gemini
    emails.forEach((email) => {
      addLog(`Email de ${email.from}: ${email.subject}`, "GMAIL", "info");
    });

    return { status: "success", data: emails };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur Gmail: ${msg}`, "SYSTEM", "error");
    // Retourner un résultat d'erreur lisible plutôt que de throw (évite le silence)
    return {
      status: "error",
      message:
        msg.includes("authentifi") || msg.includes("expir")
          ? "Session Google expirée. Veuillez vous reconnecter via les paramètres."
          : `Impossible de lire les mails : ${msg}`,
    };
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
  } catch (error: unknown) {
    const err = error as Error;
    addLog(
      `Erreur envoi Gmail: ${err.message || String(error)}`,
      "SYSTEM",
      "error",
    );
    throw error;
  }
}

/**
 * Retourne le prochain rendez-vous du calendrier
 * Répond à "quel est mon prochain RDV", "qu'est-ce que j'ai prévu", etc.
 */
export async function handleCalendarNext(
  _args: Record<string, never>,
  ctx: HandlerContext,
) {
  const { addLog } = ctx;

  try {
    addLog("Recherche du prochain rendez-vous...", "OMNI", "info");
    const response = await fetch(
      `http://localhost:3001/api/google/calendar/events?max=1`,
    );
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    const events = data.events as Array<{
      summary: string;
      start: string;
      end: string;
      location?: string;
    }>;

    if (!events || events.length === 0) {
      return {
        status: "success",
        message: "Aucun rendez-vous à venir dans votre agenda.",
        data: null,
      };
    }

    const next = events[0];
    const startDate = new Date(next.start);
    const now = new Date();
    const diffMs = startDate.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);

    let timeLabel = "";
    if (diffMin < 60) {
      timeLabel = `dans ${diffMin} minute${diffMin > 1 ? "s" : ""}`;
    } else if (diffMin < 1440) {
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      timeLabel = `dans ${h}h${m > 0 ? m : ""}`;
    } else {
      timeLabel = startDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    addLog(
      `📅 Prochain RDV: ${next.summary} (${timeLabel})`,
      "CALENDAR",
      "info",
    );

    return {
      status: "success",
      data: { ...next, timeLabel },
      message: `Prochain rendez-vous : ${next.summary}, ${timeLabel}${next.location ? `, à ${next.location}` : ""}.`,
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur Calendar Next: ${msg}`, "SYSTEM", "error");
    return {
      status: "error",
      message:
        msg.includes("authentifi") || msg.includes("expir")
          ? "Session Google expirée. Veuillez vous reconnecter."
          : `Impossible de récupérer le prochain rendez-vous : ${msg}`,
    };
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

    interface CalendarEvent {
      summary: string;
      start: { dateTime?: string; date?: string };
    }

    const events = data.events as CalendarEvent[];

    if (events.length > 0) {
      // Logique de notification (à implémenter)
    }

    if (events.length === 0) {
      return { status: "success", message: "Aucun évènement", data: [] };
    }

    events.forEach((event) => {
      const date = new Date(
        event.start.dateTime || event.start.date!,
      ).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
      addLog(`📅 ${date} : ${event.summary}`, "CALENDAR", "info");
    });

    return { status: "success", data: events };
  } catch (error: unknown) {
    const err = error as Error;
    addLog(
      `Erreur Calendar: ${err.message || String(error)}`,
      "SYSTEM",
      "error",
    );
    throw error;
  }
}

/**
 * Crée un évènement dans le calendrier
 */
export async function handleCalendarCreate(
  args: {
    summary: string;
    startTime: string;
    endTime?: string;
    location?: string;
    description?: string;
  },
  ctx: HandlerContext,
) {
  const { addLog } = ctx;
  const { summary, startTime, endTime, location, description } = args;

  try {
    addLog(`Création du rendez-vous: ${summary}...`, "OMNI", "info");

    // Si pas de end, on met +1h par défaut
    const start = new Date(startTime);
    const end = endTime
      ? new Date(endTime)
      : new Date(start.getTime() + 60 * 60 * 1000);

    const response = await fetch(
      `http://localhost:3001/api/google/calendar/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          location,
          description,
        }),
      },
    );
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    addLog(`✅ Rendez-vous créé: ${summary}`, "CALENDAR", "success");
    return { status: "success", message: "Évènement créé", data };
  } catch (error: unknown) {
    const err = error as Error;
    addLog(
      `Erreur création calendrier: ${err.message || String(error)}`,
      "SYSTEM",
      "error",
    );
    throw error;
  }
}

/**
 * Supprime un évènement du calendrier
 */
export async function handleCalendarDelete(
  args: { eventId: string },
  ctx: HandlerContext,
) {
  const { addLog } = ctx;

  try {
    addLog("Suppression de l'évènement...", "OMNI", "info");
    const response = await fetch(
      `http://localhost:3001/api/google/calendar/events/${args.eventId}`,
      { method: "DELETE" },
    );
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    return {
      status: "success",
      message: "Évènement supprimé avec succès",
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur Calendar Delete: ${msg}`, "SYSTEM", "error");
    return {
      status: "error",
      message: `Impossible de supprimer l'évènement : ${msg}`,
    };
  }
}

/**
 * Déplace un évènement du calendrier (modifie l'heure de début)
 */
export async function handleCalendarMove(
  args: { eventId: string; newStartTime: string; newEndTime?: string },
  ctx: HandlerContext,
) {
  const { addLog, speak } = ctx;

  try {
    addLog(`Déplacement de l'évènement ${args.eventId}...`, "CALENDAR", "info");

    const getResponse = await fetch(
      `http://localhost:3001/api/google/calendar/events/${args.eventId}`,
    );
    const eventData = await getResponse.json();

    if (eventData.error) throw new Error(eventData.error);

    const event = eventData.event;
    const oldStart = new Date(event.start.dateTime || event.start.date);
    const newStart = new Date(args.newStartTime);

    let newEnd: Date;
    if (args.newEndTime) {
      newEnd = new Date(args.newEndTime);
    } else {
      const oldEnd = new Date(event.end.dateTime || event.end.date);
      const duration = oldEnd.getTime() - oldStart.getTime();
      newEnd = new Date(newStart.getTime() + duration);
    }

    const checkResponse = await fetch(
      `http://localhost:3001/api/google/calendar/events?timeMin=${newStart.toISOString()}&timeMax=${newEnd.toISOString()}`,
    );
    const checkData = await checkResponse.json();

    const conflicts =
      checkData.events?.filter((e: any) => e.id !== args.eventId) || [];

    if (conflicts.length > 0) {
      const conflictNames = conflicts.map((e: any) => e.summary).join(", ");
      speak(
        `Attention, conflit horaire détecté avec : ${conflictNames}. Souhaitez-vous continuer ?`,
      );
      addLog(`⚠️ Conflit horaire: ${conflictNames}`, "CALENDAR", "warning");
    }

    const updateResponse = await fetch(
      `http://localhost:3001/api/google/calendar/events/${args.eventId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: { dateTime: newStart.toISOString() },
          end: { dateTime: newEnd.toISOString() },
        }),
      },
    );

    const updateData = await updateResponse.json();

    if (updateData.error) throw new Error(updateData.error);

    const oldTime = oldStart.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const newTime = newStart.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const message = `Rendez-vous "${event.summary}" déplacé de ${oldTime} à ${newTime}, Monsieur.`;
    speak(message);
    addLog(`✅ ${message}`, "CALENDAR", "success");

    return {
      status: "success",
      message,
      data: {
        event: updateData.event,
        oldStart: oldStart.toISOString(),
        newStart: newStart.toISOString(),
        conflicts: conflicts.length,
      },
    };
  } catch (error: unknown) {
    const err = error as Error;
    const msg = err.message || String(error);
    addLog(`Erreur Calendar Move: ${msg}`, "SYSTEM", "error");
    speak("Impossible de déplacer le rendez-vous, Monsieur.");
    return {
      status: "error",
      message: `Impossible de déplacer l'évènement : ${msg}`,
    };
  }
}
