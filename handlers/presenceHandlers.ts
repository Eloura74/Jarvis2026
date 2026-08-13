import { HandlerContext } from "../types/app.types";

/**
 * Handler de gestion de présence au bureau et lumières
 */
export const handleManagePresence = async (
  args: { action: "status" | "simulate_away" | "simulate_present" },
  ctx: HandlerContext & { speak?: (text: string) => void },
) => {
  const { action } = args;
  const { addLog, speak } = ctx;

  try {
    const API_BASE = "http://localhost:3001";

    if (action === "simulate_away") {
      const res = await fetch(`${API_BASE}/api/presence/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ABSENT" }),
      });
      const data = await res.json();
      addLog("👤 Mode absence activé (lumières éteintes)", "SYSTEM", "info");
      if (speak) speak("Mode absence activé, Monsieur. Les lumières du bureau ont été éteintes.");
      return { status: "success", data };
    }

    if (action === "simulate_present") {
      const res = await fetch(`${API_BASE}/api/presence/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PRESENT" }),
      });
      const data = await res.json();
      addLog("👤 Présence confirmée (lumières allumées)", "SYSTEM", "info");
      if (speak) speak("Bon retour au bureau, Monsieur.");
      return { status: "success", data };
    }

    // Status par défaut
    const res = await fetch(`${API_BASE}/api/presence/status`);
    const data = await res.json();
    const statusText = data.status === "PRESENT" ? "présent" : "absent";
    if (speak) speak(`Vous êtes actuellement marqué comme ${statusText} au bureau.`);
    return { status: "success", data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    addLog(`Erreur gestion présence: ${msg}`, "SYSTEM", "error");
    return { status: "error", message: msg };
  }
};
