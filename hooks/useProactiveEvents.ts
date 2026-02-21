import { useEffect, useRef } from "react";
import { LogEntry } from "../types";
import { StatusOverlayData } from "../types/app.types";

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
    const sseUrl = "http://localhost:3001/api/events";
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      console.log(
        `🔌 [SSE] Connected to JARVIS Push Notifications at ${sseUrl}`,
      );
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, payload: data, messageToSpeak } = payload;

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
              title: "Bambu Lab A1 Mini",
              type: "printer",
              lastUpdate: new Date().toLocaleTimeString(),
              stats: [
                {
                  label: "Statut",
                  value: "Impression terminée",
                  status: "normal",
                  icon: "fas fa-check-circle",
                },
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
        }
      } catch (err) {
        console.error("❌ Erreur parsing SSE dans useProactiveEvents:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error(
        "❌ Erreur SSE Push Notifications (reconnexion auto).",
        err,
      );
    };

    return () => {
      console.log("🔌 [SSE] Fermeture connexion Push Notifications.");
      eventSource.close();
    };
  }, []);
}
