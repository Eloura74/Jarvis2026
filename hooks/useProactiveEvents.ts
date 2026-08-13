import { useEffect, useRef } from "react";
import { LogEntry } from "../types";
import { StatusOverlayData } from "../types/app.types";
import { subscribe, SSEPayload } from "../services/sseClient"; // B1 : Singleton SSE

interface UseProactiveEventsProps {
  speak: (text: string) => void;
  addLog: (
    message: string,
    source: LogEntry["source"],
    type: LogEntry["type"],
  ) => void;
  setStatusOverlay: (data: StatusOverlayData | null) => void;
  onProactiveEvent?: (type: string, messageToSpeak?: string) => void;
}

export function useProactiveEvents({
  speak,
  addLog,
  setStatusOverlay,
  onProactiveEvent,
}: UseProactiveEventsProps) {
  // Use a ref for the Speak function to avoid reconnecting SSE if speak reference changes
  const speakRef = useRef(speak);
  const addLogRef = useRef(addLog);
  const setStatusOverlayRef = useRef(setStatusOverlay);
  const onProactiveEventRef = useRef(onProactiveEvent);

  useEffect(() => {
    speakRef.current = speak;
    addLogRef.current = addLog;
    setStatusOverlayRef.current = setStatusOverlay;
    onProactiveEventRef.current = onProactiveEvent;
  }, [speak, addLog, setStatusOverlay, onProactiveEvent]);

  useEffect(() => {
    // B1 : Utilisation du singleton SSE — une seule connexion partagée entre tous les hooks
    const unsubscribe = subscribe((payload: SSEPayload) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { type, payload: data, messageToSpeak } = payload as any;

        // Déléguer la parole et le HUD au brain via callback
        if (messageToSpeak && onProactiveEventRef.current) {
          onProactiveEventRef.current(type, messageToSpeak);
        } else if (messageToSpeak) {
          // Fallback si le callback n'est pas encore branché
          speakRef.current(messageToSpeak);
          addLogRef.current(
            `Proactive: ${messageToSpeak}`,
            "SYSTEM",
            "warning",
          );
        }

        if (type === "PRINTER_BAMBU") {
          console.log(`📥 [SSE] Reçu event PRINTER_BAMBU:`, data);

          if (data && data.event === "PRINT_FINISHED") {
            setStatusOverlayRef.current({
              id: `bambu-finished-${Date.now()}`,
              title: "🖨️ Bambu Lab A1 Mini",
              type: "printer",
              lastUpdate: new Date().toLocaleTimeString(),
              stats: [
                {
                  label: "Statut",
                  value: "✅ Impression terminée",
                  status: "normal",
                  icon: "fas fa-check-circle",
                },
                ...(data.file && data.file !== "fichier inconnu"
                  ? [{ label: "Fichier", value: data.file, status: "normal" as const, icon: "fas fa-file" }]
                  : []),
              ],
            });
          } else if (data && data.event === "PRINT_FAILED") {
            setStatusOverlayRef.current({
              id: `bambu-failed-${Date.now()}`,
              title: "⚠️ Bambu Lab A1 Mini — Échec",
              type: "printer",
              lastUpdate: new Date().toLocaleTimeString(),
              stats: [
                {
                  label: "Statut",
                  value: "❌ Impression échouée",
                  status: "error" as const,
                  icon: "fas fa-times-circle",
                },
                ...(data.file && data.file !== "fichier inconnu"
                  ? [{ label: "Fichier", value: data.file, status: "error" as const, icon: "fas fa-file" }]
                  : []),
              ],
            });
          }
        } else if (type === "WHATSAPP") {
          console.log(`📥 [SSE] Reçu event WHATSAPP:`, data);

          if (data && data.sender) {
            // Afficher l'expéditeur ET le contenu du message dans l'overlay
            // mais NE PAS lire le contenu vocalement (seulement l'expéditeur via messageToSpeak)
            const messageBody = data.body
              ? data.body.length > 120
                ? data.body.substring(0, 117) + "..."
                : data.body
              : "(Contenu média)";

            setStatusOverlayRef.current({
              id: `whatsapp-${Date.now()}`,
              title: "Nouveau Message WhatsApp",
              type: "system",
              lastUpdate: new Date().toLocaleTimeString(),
              // Stocker l'expéditeur et le numéro pour la réponse vocale
              origin: data.from,
              stats: [
                {
                  label: "De",
                  value: data.sender,
                  status: "normal",
                  icon: "fab fa-whatsapp",
                },
                {
                  label: "Message",
                  value: messageBody,
                  status: "normal",
                  icon: "fas fa-comment-dots",
                },
              ],
            });

            // Fermeture automatique après 15 secondes
            setTimeout(() => {
              setStatusOverlayRef.current(null);
            }, 15000);
          }
        } else if (type === "CALENDAR_REMINDER") {
          console.log(`📥 [SSE] Reçu event CALENDAR_REMINDER:`, data);

          if (data && data.summary) {
            setStatusOverlayRef.current({
              id: `calendar-${Date.now()}`,
              title: "Rappel Agenda",
              type: "system",
              lastUpdate: new Date().toLocaleTimeString(),
              stats: [
                {
                  label: "Événement",
                  value: data.summary,
                  status: "warning",
                  icon: "fas fa-calendar-alt",
                },
                {
                  label: "Dans",
                  value: data.timeUntil || "bientôt",
                  status: "warning",
                  icon: "fas fa-clock",
                },
              ],
            });

            setTimeout(() => {
              setStatusOverlayRef.current(null);
            }, 20000);
          }
        } else if (type === "SLEEP_MODE") {
          // Événement déclenché par sleepModeService.js (activation/désactivation veille)
          console.log(`📥 [SSE] Reçu event SLEEP_MODE:`, data);

          if (data?.active) {
            // Afficher un overlay discret indiquant que la veille est active
            setStatusOverlayRef.current({
              id: `sleep-${Date.now()}`,
              title: "Mode Veille Activé",
              type: "system",
              lastUpdate: new Date().toLocaleTimeString(),
              stats: [
                {
                  label: "Statut",
                  value: "Ne pas déranger",
                  status: "normal",
                  icon: "fas fa-moon",
                },
                {
                  label: "Réveil",
                  value: data.wakeUpAt
                    ? new Date(data.wakeUpAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Manuel",
                  status: "normal",
                  icon: "fas fa-clock",
                },
              ],
            });
            // Fermer l'overlay après 5s (mode veille = interface discrète)
            setTimeout(() => setStatusOverlayRef.current(null), 5000);
          } else {
            // Réveil : fermer tout overlay résiduel
            setStatusOverlayRef.current(null);
          }
        } else if (type === "HA_ALERT") {
          console.log(`📥 [SSE] Reçu event HA_ALERT:`, data);
          if (data) {
            setStatusOverlayRef.current({
              id: `ha-alert-${Date.now()}`,
              title: "Alerte Maison Intelligente",
              type: "system",
              lastUpdate: new Date().toLocaleTimeString(),
              stats: [
                {
                  label: "Alerte",
                  value: data.type || "Notification",
                  status: "warning",
                  icon: "fas fa-exclamation-triangle",
                },
                {
                  label: "Message",
                  value: data.message || "Alerte reçue de Home Assistant",
                  status: "warning",
                  icon: "fas fa-info-circle",
                },
              ],
            });
            setTimeout(() => setStatusOverlayRef.current(null), 15000);
          }
        }
      } catch (err) {
        console.error("❌ Erreur parsing SSE dans useProactiveEvents:", err);
      }
    });

    // Cleanup : désabonnement du singleton (ne ferme la connexion que si plus aucun abonné)
    return unsubscribe;
  }, []);
}
