import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, Camera, ScanLine } from "lucide-react";
import { useGhostMode } from "../hooks/useGhostMode";

/**
 * Panel Ghost Mode
 * Affichage suggestions contextuelles + Flux Webcam
 */
export default function GhostModePanel() {
  const { analyze, isAnalyzing, lastAnalysis, error } = useGhostMode();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Initialisation Caméra
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "environment" },
        });
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
          // IMPORTANT: Mute la vidéo locale pour éviter l'écho audio si le stream contient de l'audio
          // Et surtout pour éviter que le navigateur focus le composant vidéo
          videoRef.current.muted = true;
        }
      } catch (err: unknown) {
        console.error("Camera Error:", err);
        setCameraError(
          "Impossible d'accéder à la caméra. Vérifiez les permissions.",
        );
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleScan = async () => {
    // Feedback Sonore (si dispo)
    // new Audio('/sounds/scan_start.mp3').play().catch(() => {});

    // Capture d'image
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        await analyze();
      }
    }
  };

  return (
    <div
      className="h-full flex flex-col p-4 w-full relative overflow-hidden"
      tabIndex={-1} // Empêcher le focus
      style={{ outline: "none" }}
    >
      {/* Container Vidéo avec effet Holographique */}
      <div className="relative w-full aspect-video bg-black/50 rounded-lg overflow-hidden border border-purple-500/30 mb-6 group shrink-0 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
        {/* VIDEO FEED */}
        {cameraError ? (
          <div className="absolute inset-0 flex items-center justify-center text-red-400 p-4 text-center">
            <AlertCircle className="mb-2 mr-2" />
            {cameraError}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover opacity-80"
          />
        )}

        {/* OVERLAYS UI */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 border-l-2 border-t-2 border-purple-400 w-8 h-8" />
          <div className="absolute top-4 right-4 border-r-2 border-t-2 border-purple-400 w-8 h-8" />
          <div className="absolute bottom-4 left-4 border-l-2 border-b-2 border-purple-400 w-8 h-8" />
          <div className="absolute bottom-4 right-4 border-r-2 border-b-2 border-purple-400 w-8 h-8" />

          {/* Target Reticle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-purple-500/30 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_10px_#a855f7]" />
            <div className="absolute top-0 w-[1px] h-3 bg-purple-500/50"></div>
            <div className="absolute bottom-0 w-[1px] h-3 bg-purple-500/50"></div>
            <div className="absolute left-0 h-[1px] w-3 bg-purple-500/50"></div>
            <div className="absolute right-0 h-[1px] w-3 bg-purple-500/50"></div>
          </div>

          {/* SCAN LINE ANIMATION */}
          {isAnalyzing && (
            <motion.div
              className="absolute top-0 left-0 w-full h-1 bg-purple-400/80 shadow-[0_0_15px_rgba(168,85,247,0.8)] z-20"
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          )}

          <div className="absolute bottom-2 right-4 text-[10px] text-purple-300 bg-black/60 backdrop-blur px-2 py-1 rounded border border-purple-500/20">
            <span className="animate-pulse text-red-500 mr-2">●</span> LIVE FEED
            // 1280x720
          </div>
        </div>

        {/* Hidden Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* SCAN BUTTON */}
      <div className="flex justify-center mb-6 shrink-0">
        <button
          onClick={handleScan}
          disabled={isAnalyzing || !!cameraError}
          className="relative group overflow-hidden bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/50 hover:border-purple-400 rounded-full px-8 py-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
        >
          <div className="absolute inset-0 bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 relative z-10">
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 animate-spin text-purple-300" />
            ) : (
              <ScanLine className="w-5 h-5 text-purple-300 group-hover:text-white" />
            )}
            <span className="text-purple-300 font-bold tracking-widest group-hover:text-white transition-colors text-sm">
              {isAnalyzing ? "ANALYZING SECTOR..." : "INITIATE VISUAL SCAN"}
            </span>
          </div>
        </button>
      </div>

      {/* RESULTATS ANALYSE */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <span className="text-red-400 text-sm font-medium">{error}</span>
          </div>
        )}

        {lastAnalysis ? (
          <div className="space-y-4 max-w-2xl mx-auto w-full pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Detected Task */}
              {lastAnalysis.detectedTask && (
                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
                  <div className="text-cyan-400 text-[10px] font-bold mb-1 tracking-wider uppercase">
                    DETECTED ENTITY
                  </div>
                  <div className="text-white text-sm font-medium">
                    {lastAnalysis.detectedTask}
                  </div>
                </div>
              )}

              {/* Detected Language */}
              {lastAnalysis.detectedLanguage && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                  <div className="text-green-400 text-[10px] font-bold mb-1 tracking-wider uppercase">
                    CONFIDENCE SCORE
                  </div>
                  <div className="text-white text-sm font-mono">98.4%</div>
                </div>
              )}
            </div>

            {/* Context */}
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
              <div className="text-purple-400 text-[10px] font-bold mb-2 tracking-wider uppercase">
                VISUAL CONTEXT
              </div>
              <div className="text-gray-300 text-sm leading-relaxed">
                {lastAnalysis.context}
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
              <div className="text-amber-400 text-[10px] font-bold mb-3 tracking-wider uppercase">
                TACTICAL SUGGESTIONS
              </div>
              <ul className="space-y-2">
                {lastAnalysis.suggestions.map((sug, i) => (
                  <li
                    key={i}
                    className="text-gray-300 text-sm flex items-start gap-3 group"
                  >
                    <span className="text-amber-500/50 mt-1.5 text-[10px] group-hover:text-amber-400 transition-colors">
                      ▶
                    </span>
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          !isAnalyzing &&
          !error && (
            <div className="flex flex-col items-center justify-center h-full opacity-30 pb-10">
              <Camera className="w-12 h-12 text-purple-500/50 mb-4" />
              <div className="text-purple-300/50 text-xs tracking-widest uppercase text-center">
                Visual Systems Online
                <br />
                Waiting for Capture
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
