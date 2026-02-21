/**
 * Handler WhatsApp pour J.A.R.V.I.S.
 * Gère l'envoi de messages WhatsApp via l'API backend.
 */

import { HandlerContext } from "../types/app.types";

/**
 * Envoie un message WhatsApp à un contact via le backend.
 * @param args - { to: string, message: string }
 * @param ctx - Contexte du handler (addLog, speak)
 */
export async function handleWhatsAppReply(
  args: { to: string; message: string },
  ctx: HandlerContext,
): Promise<{ status: string; message: string }> {
  const { to, message } = args;

  if (!to || !message) {
    const errMsg = "Destinataire ou message manquant pour l'envoi WhatsApp.";
    ctx.addLog(`⚠️ WhatsApp: ${errMsg}`, "SYSTEM", "error");
    return { status: "error", message: errMsg };
  }

  try {
    ctx.addLog(`📱 WhatsApp: Envoi à "${to}"...`, "SYSTEM", "info");

    const response = await fetch("http://localhost:3001/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, message }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg =
        data.error ||
        "Erreur lors de l'envoi du message WhatsApp.";
      ctx.addLog(`❌ WhatsApp: ${errMsg}`, "SYSTEM", "error");
      return { status: "error", message: errMsg };
    }

    ctx.addLog(`✅ WhatsApp: Message envoyé à ${to}`, "SYSTEM", "info");
    return {
      status: "success",
      message: `Message WhatsApp envoyé à ${to}.`,
    };
  } catch (err) {
    const errMsg = `Impossible de contacter le service WhatsApp : ${err instanceof Error ? err.message : String(err)}`;
    ctx.addLog(`❌ WhatsApp: ${errMsg}`, "SYSTEM", "error");
    return { status: "error", message: errMsg };
  }
}
