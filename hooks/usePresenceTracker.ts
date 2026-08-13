import { useEffect, useRef } from "react";

const HEARTBEAT_INTERVAL_MS = 15 * 1000; // Heartbeat toutes les 15s max

/**
 * Hook usePresenceTracker
 * Combines :
 * 1. Interactions utilisateur (souris, clavier, clic sur n'importe quel écran)
 * 2. Détection Webcam PC (en ignorant les caméras virtuelles/téléphones Windows Link)
 */
export function usePresenceTracker() {
  const lastHeartbeatRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);

  const sendHeartbeat = () => {
    const now = Date.now();
    if (now - lastHeartbeatRef.current >= HEARTBEAT_INTERVAL_MS) {
      lastHeartbeatRef.current = now;
      window.dispatchEvent(new CustomEvent("presence-detected"));
      fetch("http://localhost:3001/api/presence/heartbeat", {
        method: "POST",
      }).catch(() => {});
    }
  };

  useEffect(() => {
    // 1. Événements d'interaction utilisateur
    const handleUserActivity = () => {
      sendHeartbeat();
    };

    window.addEventListener("mousemove", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });
    window.addEventListener("click", handleUserActivity, { passive: true });

    // 2. Détection Webcam PC physique uniquement
    let stream: MediaStream | null = null;
    let webcamInterval: NodeJS.Timeout | null = null;

    const initWebcamPresence = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

        // Lister les périphériques vidéo pour trouver la webcam du PC
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");

        // Filtrer pour EXCLURE le téléphone portable (Phone Link, A56, DroidCam, etc.)
        const pcWebcam = videoDevices.find((d) => {
          const label = (d.label || "").toLowerCase();
          return (
            !label.includes("a56") &&
            !label.includes("phone") &&
            !label.includes("link") &&
            !label.includes("droidcam") &&
            !label.includes("virtual")
          );
        });

        // Contrainte vidéo : utiliser l'ID du PC si trouvé, sinon fallback générique
        const videoConstraints: MediaTrackConstraints = pcWebcam?.deviceId
          ? { deviceId: { exact: pcWebcam.deviceId }, width: 160, height: 120, frameRate: 5 }
          : { width: 160, height: 120, frameRate: 5 };

        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
        });

        const video = document.createElement("video");
        video.srcObject = stream;
        video.play().catch(() => {});
        videoRef.current = video;

        const canvas = document.createElement("canvas");
        canvas.width = 40;
        canvas.height = 30;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        // Analyse de mouvement toutes les 5s
        webcamInterval = setInterval(() => {
          if (!video || video.readyState < 2 || !ctx) return;

          ctx.drawImage(video, 0, 0, 40, 30);
          const frame = ctx.getImageData(0, 0, 40, 30);
          const currentData = frame.data;

          if (prevFrameRef.current) {
            let diff = 0;
            for (let i = 0; i < currentData.length; i += 4) {
              diff += Math.abs(currentData[i] - prevFrameRef.current[i]);
              diff += Math.abs(currentData[i + 1] - prevFrameRef.current[i + 1]);
              diff += Math.abs(currentData[i + 2] - prevFrameRef.current[i + 2]);
            }

            const avgDiff = diff / (40 * 30 * 3);
            if (avgDiff > 2.5) {
              sendHeartbeat();
            }
          }

          prevFrameRef.current = new Uint8ClampedArray(currentData);
        }, 5000);
      } catch {
        // En cas de refus ou indisponibilité, fallback transparent sur clavier/souris
      }
    };

    initWebcamPresence();

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);

      if (webcamInterval) clearInterval(webcamInterval);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);
}
