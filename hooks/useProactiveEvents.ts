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
}

export function useProactiveEvents({
  speak,
  addLog,
  setStatusOverlay,
}: UseProactiveEventsProps) {
  // Use a ref for the Speak function to avoid reconnecting SSE if speak reference changes
  const speakRef = useRef(speak);
  const addLogRef = useRef(addLog);
  const setStatusOverlayRef = useRef(setStatusOverlay);

  useEffect(() => {
    speakRef.current = speak;
    addLogRef.current = addLog;
    setStatusOverlayRef.current = setStatusOverlay;
  }, [speak, addLog, setStatusOverlay]);

  useEffect(() => {
    const sseUrl = "http://localhost:3001/api/events";
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      console.log(
        `🔌 [SSE] Connected to JARVIS Push Notifications at ${sseUrl}`,
      );
    };

    eventSource.addEventListener("PRINTER_BAMBU", (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { data, message } = payload;

        console.log(`📥 [SSE] Reçu event PRINTER_BAMBU:`, data, message);

        if (message) {
          addLogRef.current("Push Notification: " + message, "SYSTEM", "info");
          speakRef.current(message);
        }

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
      } catch (err) {
        console.error("❌ Erreur parsing SSE PRINTER_BAMBU:", err);
      }
    });

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
