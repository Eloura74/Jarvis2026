import { StatusOverlayData } from "../types/app.types";
import { HandlerContext } from "../types/app.types";
import {
  toggleEntity,
  callHAService,
  setLightColor,
  setLightBrightness,
  HA_ENTITIES,
} from "../services/homeAssistantService";

// On étend le contexte pour inclure speak qui est injecté par useJarvisBrain
type ExtendedContext = HandlerContext & { speak: (text: string) => void };

/**
 * Gère les commandes domotiques via Home Assistant
 */
export const handleControlHomeAutomation = async (
  args: { target: string; action: string; value?: string },
  context: HandlerContext,
) => {
  // Assertion de type car on sait que speak est injecté
  const { addLog, speak } = context as ExtendedContext;
  const { target, action, value } = args;

  addLog(
    `HA Command: ${action} on ${target} (${value || "no value"})`,
    "SYSTEM",
    "info",
  );

  // 1. Trouver l'ID de l'entité correspondante
  // On cherche dans toutes les listes d'entités (LIGHTS, SENSORS, etc.)
  let entityId = target; // Par défaut, on suppose que c'est déjà un ID ou un nom exact
  let entityLabel = target;

  const allEntities = [
    ...HA_ENTITIES.LIGHTS,
    ...HA_ENTITIES.SENSORS,
    ...HA_ENTITIES.DOORS,
    ...HA_ENTITIES.PRINTERS.map((p) => ({
      id: p.name,
      label: p.name,
      type: "printer",
    })), // Adaptateur pour printers
  ];

  // Recherche plus intelligente (par label ou ID)
  const found = allEntities.find(
    (e) =>
      e.id.toLowerCase() === target.toLowerCase() ||
      e.label.toLowerCase() === target.toLowerCase() ||
      target.toLowerCase().includes(e.label.toLowerCase()), // "allume la lumière du SALON"
  );

  if (found) {
    entityId = found.id;
    entityLabel = found.label;
  }

  // 2. Exécuter l'action
  try {
    switch (action) {
      case "turn_on":
        await callHAService(
          entityId.split(".")[0] || "homeassistant",
          "turn_on",
          entityId,
        );
        speak(`J'allume ${entityLabel}.`);
        break;

      case "turn_off":
        await callHAService(
          entityId.split(".")[0] || "homeassistant",
          "turn_off",
          entityId,
        );
        speak(`J'éteins ${entityLabel}.`);
        break;

      case "toggle":
        // On ne connait pas l'état actuel ici sans refetch, donc on utilise toggle du service HA
        await toggleEntity(entityId, "unknown");
        speak(`Je bascule ${entityLabel}.`);
        break;

      case "set_color":
        if (value) {
          // Mapping simple de couleurs (anglais -> RGB)
          const colors: Record<string, [number, number, number]> = {
            red: [255, 0, 0],
            green: [0, 255, 0],
            blue: [0, 0, 255],
            white: [255, 255, 255],
            purple: [128, 0, 128],
            cyan: [0, 255, 255],
            yellow: [255, 255, 0],
            orange: [255, 165, 0],
            pink: [255, 192, 203],
          };
          const rgb = colors[value.toLowerCase()] || [255, 255, 255];
          await setLightColor(entityId, rgb);
          speak(`Je mets ${entityLabel} en ${value}.`);
        }
        break;

      case "set_brightness":
        if (value) {
          // Gestion "50%" ou "128"
          let brightness = 255;
          if (value.includes("%")) {
            brightness = Math.round((parseInt(value) / 100) * 255);
          } else {
            brightness = parseInt(value);
          }
          await setLightBrightness(entityId, brightness);
          speak(`Luminosité de ${entityLabel} ajustée.`);
        }
        break;

      default:
        speak(
          `Désolé, je ne connais pas l'action ${action} pour la domotique.`,
        );
        return { status: "error", message: `Unknown HA action: ${action}` };
    }

    return {
      status: "success",
      message: `HA Action ${action} executed on ${target}`,
    };
  } catch (error) {
    console.error("HA Handler Error:", error);
    speak("Il y a eu une erreur avec la commande domotique.");
    return { status: "error", message: String(error) };
  }
};

/**
 * Prépare les données pour l'overlay holographique de statut
 */
export const handleShowStatusOverlay = async (
  args: { target: string },
  context: HandlerContext,
) => {
  const { addLog } = context;
  const { target } = args;
  const query = target.toLowerCase();

  addLog(`Status Overlay requested for: ${target}`, "SYSTEM", "info");
  console.log(`[HA_HANDLER] Overlay Target: "${target}", Query: "${query}"`);

  try {
    const { fetchHAStates, HA_ENTITIES } =
      await import("../services/homeAssistantService");
    const states = await fetchHAStates();
    const lastUpdate = new Date().toLocaleTimeString("fr-FR");

    // 1. Détection du type de demande

    // CAS S: FLOTTE COMPLETE (Imprimantes)
    if (
      query.includes("flotte") ||
      query.includes("fleet") ||
      query.includes("toutes") ||
      query.includes("tout") ||
      query.includes("ensemble") ||
      (query.includes("imprimante") && query.includes("toute")) ||
      query.includes("imprimantes") || // Pluriel = souvent flotte
      (query.includes("ferme") &&
        !query.includes("popup") &&
        !query.includes("fenêtre") &&
        !query.includes("écran")) // "Ferme" (Farm) mais pas "Ferme" (Close)
    ) {
      console.log("[HA_HANDLER] 🚀 DETECTED FLEET MODE");
      const printers = HA_ENTITIES.PRINTERS.map((p) => {
        const bed = states[p.bed]?.state || "?";
        const ext = states[p.ext]?.state || "?";
        const progValue = states[p.progress]?.state;
        const prog = progValue ? parseFloat(progValue) : 0;

        return {
          id: `printer-${p.name}-${Date.now()}`,
          title: p.name,
          type: "printer" as const,
          ip: p.ip,
          webcamUrl: p.webcamUrl,
          image: p.webcamUrl || "/vzbot_330_render.png",
          stats: [
            {
              label: "PROGRESSION",
              value: `${prog}%`,
              progress: prog,
              status: prog > 90 ? "normal" : "normal",
            },
            {
              label: "TEMP. PLATEAU",
              value: bed,
              unit: "°C",
              status: parseFloat(bed) > 90 ? "warning" : "normal",
            },
            {
              label: "TEMP. BUSE",
              value: ext,
              unit: "°C",
              status: parseFloat(ext) > 250 ? "warning" : "normal",
            },
            { label: "SYSTEM", value: "ONLINE", status: "normal" as const },
          ],
          lastUpdate,
        } as StatusOverlayData;
      });

      try {
        fetch("http://localhost:3001/api/sphere/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "FLOTTE" }),
        }).catch((err) => console.warn("Sphere API Error (text):", err));
      } catch (err) {
        console.warn("Failed to send fleet text to sphere:", err);
      }

      return {
        status: "success",
        data: {
          id: `fleet-${Date.now()}`,
          title: "FLOTTE D'IMPRESSION",
          type: "fleet",
          lastUpdate,
          stats: [], // Vide car géré par items
          items: printers,
        },
      };
    }

    // CAS A: Imprimantes 3D - Matching plus robuste (enlève espaces et tirets)
    const normalizedQuery = query.replace(/[\s-]/g, "");
    const printer = HA_ENTITIES.PRINTERS.find((p) => {
      const normalizedName = p.name.toLowerCase().replace(/[\s-]/g, "");
      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedQuery.includes(normalizedName)
      );
    });

    if (printer) {
      const bed = states[printer.bed]?.state || "?";
      const ext = states[printer.ext]?.state || "?";
      const progValue = states[printer.progress]?.state;
      const prog = progValue ? parseFloat(progValue) : 0;

      const printerData: StatusOverlayData & {
        ip?: string;
        webcamUrl?: string;
      } = {
        id: `printer-${printer.name}-${Date.now()}`,
        title: printer.name,
        type: "printer" as const,
        ip: printer.ip,
        webcamUrl: printer.webcamUrl,
        image: printer.webcamUrl || "/vzbot_330_render.png",
        stats: [
          {
            label: "PROGRESSION",
            value: `${prog}%`,
            progress: prog,
            status: prog > 90 ? "normal" : "normal",
          },
          {
            label: "TEMP. PLATEAU",
            value: bed,
            unit: "°C",
            status: parseFloat(bed) > 90 ? "warning" : "normal",
          },
          {
            label: "TEMP. BUSE",
            value: ext,
            unit: "°C",
            status: parseFloat(ext) > 250 ? "warning" : "normal",
          },
          { label: "SYSTEM", value: "ONLINE", status: "normal" as const },
        ],
        lastUpdate,
      };

      console.log(
        `[HA_HANDLER] Success: Prepared printer data for ${printer.name}`,
      );

      try {
        const textStr = `${ext}|${bed}|${prog}`;
        fetch("http://localhost:3001/api/sphere/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textStr }),
        }).catch((err) => console.warn("Sphere API Error (text):", err));
      } catch (err) {
        console.warn("Failed to send printer text to sphere:", err);
      }

      return {
        status: "success",
        data: printerData,
      };
    }

    // CAS B: Capteurs de porte / Sécurité
    if (
      query.includes("porte") ||
      query.includes("door") ||
      query.includes("sécurité")
    ) {
      const doorStats = HA_ENTITIES.DOORS.map((d) => {
        const state = states[d.id]?.state === "on" ? "OUVERT" : "FERMÉ";
        return { label: d.label, value: state };
      });

      return {
        status: "success",
        data: {
          id: `security-${Date.now()}`,
          title: "Sécurité Périmètre",
          type: "door",
          image:
            "https://images.unsplash.com/photo-1558002038-1a221295b214?auto=format&fit=crop&q=80&w=800",
          stats: doorStats.map((s) => ({
            ...s,
            status: s.value === "OUVERT" ? "warning" : "normal",
          })),
          lastUpdate,
        },
      };
    }

    // CAS C: Température / Climat
    if (
      query.includes("temp") ||
      query.includes("climat") ||
      query.includes("humidité")
    ) {
      const tempStats = HA_ENTITIES.SENSORS.filter(
        (s) => s.type === "sensor",
      ).map((s) => {
        const val = states[s.id]?.state || "?";
        return { label: s.label, value: val, unit: s.unit };
      });

      return {
        status: "success",
        data: {
          id: `climate-${Date.now()}`,
          title: "Analyse Climatique",
          type: "sensor",
          image:
            "https://images.unsplash.com/photo-1502472545331-5079a499312c?auto=format&fit=crop&q=80&w=800",
          stats: tempStats.map((s) => ({ ...s, status: "normal" as const })),
          lastUpdate,
        },
      };
    }

    // CAS D: Recherche générique d'une entité par label
    const allEntities = [
      ...HA_ENTITIES.LIGHTS,
      ...HA_ENTITIES.SENSORS,
      ...HA_ENTITIES.DOORS,
    ];
    const found = allEntities.find(
      (e) =>
        e.label.toLowerCase().includes(query) ||
        query.includes(e.label.toLowerCase()),
    );

    if (found) {
      const state = states[found.id];
      return {
        status: "success",
        data: {
          title: found.label,
          type: found.type || "general",
          image:
            "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800",
          stats: [
            { label: "ÉTAT ACTUEL", value: state?.state || "Unknown" },
            { label: "ENTITÉ ID", value: found.id },
          ],
          lastUpdate,
        },
      };
    }

    return { status: "error", message: `Cible "${target}" non identifiée.` };
  } catch (error) {
    console.error("Status Overlay Handler Error:", error);
    return { status: "error", message: String(error) };
  }
};
