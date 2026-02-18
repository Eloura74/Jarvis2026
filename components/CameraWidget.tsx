import React, { useState, useEffect } from "react";
import { Video, Maximize2, Activity, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const CameraWidget: React.FC = () => {
  // CONFIGURATION HOME ASSISTANT
  const HA_TOKEN = import.meta.env.VITE_HA_TOKEN || "";

  const cameras = [
    {
      id: "camera.camera_ext_1",
      label: "EXTERIEUR",
      icon: "create",
      mode: "stream",
    },
    { id: "camera.camera_salon", label: "SALON", icon: "sofa", mode: "stream" },
    {
      id: "camera.a1mini_0309da452500192_camera",
      label: "A1 MINI",
      icon: "box",
      mode: "stream",
    },
    {
      id: "camera.mainsail_picam",
      label: "MAINSAIL",
      icon: "server",
      mode: "snapshot",
    },
    {
      id: "camera.vz330_plateau",
      label: "VZ330",
      icon: "printer",
      mode: "snapshot",
    },
  ] as const;

  // -- STATES --
  const [activeCameraId, setActiveCameraId] = useState<string>(cameras[0].id);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(Date.now());

  // -- EFFECTS --

  // Glitch effect randomizer
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 150);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Reset img error on camera change
  useEffect(() => {
    setImgError(false);
  }, [activeCameraId]);

  // Refresh trigger for snapshots
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // -- HELPERS --
  const currentCam = cameras.find((c) => c.id === activeCameraId);
  const isSnapshot = currentCam?.mode === "snapshot";

  const activeStreamUrl = HA_TOKEN
    ? isSnapshot
      ? `/api/camera_proxy/${activeCameraId}?token=${HA_TOKEN}&t=${refreshTrigger}`
      : `/api/camera_proxy_stream/${activeCameraId}?token=${HA_TOKEN}`
    : "";

  return (
    <div className="w-full relative overflow-hidden rounded-xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl group hover:border-cyan-400/50 transition-all duration-500 shadow-[0_0_15px_rgba(0,229,255,0.1)] flex flex-col h-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center px-3 py-2 border-b border-cyan-400/20 bg-cyan-900/10 h-8">
        <div className="flex items-center gap-2 text-cyan-300">
          <Video size={14} />
          <span className="text-xs font-bold tracking-widest">SECURE FEED</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold border border-red-500/30 animate-pulse">
            LIVE
          </div>
          <Maximize2
            size={12}
            className="text-cyan-400/50 hover:text-cyan-300 cursor-pointer"
          />
        </div>
      </div>

      <div className="relative w-full group">
        {/* Toggle Menu Button (Overlay) - Utilisation sécurisée de setIsMenuOpen */}
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="absolute top-2 left-2 z-50 p-1.5 rounded-lg bg-black/60 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-200 transition-all"
        >
          {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        {/* MENU OVERLAY (Liste des caméras) */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="absolute top-0 left-0 bottom-0 w-32 bg-black/80 backdrop-blur-xl border-r border-cyan-500/20 z-40 p-2 flex flex-col gap-2 overflow-y-auto custom-scrollbar pt-12"
            >
              {cameras.map((cam) => (
                <button
                  key={cam.id}
                  onClick={() => {
                    setActiveCameraId(cam.id);
                    setIsMenuOpen(false);
                  }}
                  className={`flex flex-col items-start p-2 rounded border transition-all relative overflow-hidden shrink-0 ${
                    activeCameraId === cam.id
                      ? "bg-cyan-500/20 border-cyan-500/50"
                      : "bg-transparent border-white/5 hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`text-[9px] font-bold z-10 w-full truncate ${activeCameraId === cam.id ? "text-cyan-300" : "text-gray-400"}`}
                  >
                    {cam.label}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN VIEWER */}
        <div className="relative bg-black/50 w-full">
          {HA_TOKEN && !imgError ? (
            <img
              key={activeCameraId + (isSnapshot ? "snap" : "stream")}
              src={activeStreamUrl}
              alt={currentCam?.label}
              className="w-full h-auto block"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="min-h-[200px] flex flex-col items-center justify-center text-center p-4">
              <span className="text-cyan-500/50 text-[10px] tracking-widest uppercase mb-2">
                SIGNAL LOST / NO AUTH
              </span>
              <span className="text-cyan-400 text-xs opacity-50">
                STANDBY...
              </span>
            </div>
          )}

          {/* Grid Overlay */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0, 229, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.1) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* Glitch Effect */}
          <AnimatePresence>
            {glitch && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-cyan-500/20 mix-blend-color-dodge z-10"
                style={{ transform: `translateX(${Math.random() * 10 - 5}px)` }}
              />
            )}
          </AnimatePresence>

          {/* Scan Line */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-full w-full animate-[scan_4s_linear_infinite] pointer-events-none" />

          <div className="absolute bottom-2 left-2 pointer-events-none">
            <div className="text-xs font-bold text-cyan-100 tracking-wider flex items-center gap-2 drop-shadow-md bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
              <Activity size={12} className="text-cyan-400" />
              {currentCam?.label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
