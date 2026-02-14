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
