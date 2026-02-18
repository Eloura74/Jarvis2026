/**
 * Dashboard Fleet Manager - Vue enrichie
 * Affichage premium des 3 imprimantes avec thumbnails et stats détaillées
 * + Ajout Mockup Webcam Feed
 */
import { motion } from "framer-motion";
import { Printer, Clock, Thermometer, Camera } from "lucide-react";
import { usePrinterFleet } from "../hooks/usePrinterFleet";

export default function PrinterFleetDashboard() {
  const { printers } = usePrinterFleet();

  // Formatage temps (secondes → HH:MM:SS ou MM:SS)
  const formatDuration = (seconds: number): string => {
    if (!seconds) return "--:--";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Couleur border selon type imprimante
  const getBorderColor = (type: "mainsail" | "bambu") => {
    return type === "bambu" ? "border-green-500" : "border-cyan-500";
  };

  // Couleur gradient selon type
  const getGradientColor = (type: "mainsail" | "bambu") => {
    return type === "bambu" ? "from-green-900/20" : "from-cyan-900/20";
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "idle":
        return "bg-green-500/20 text-green-400 border-green-500";
      case "printing":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500";
      case "offline":
        return "bg-gray-500/20 text-gray-400 border-gray-600";
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500";
    }
  };

  return (
    <div className="h-full flex flex-col p-2">
      {/* Printer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {printers.map((printer) => (
          <motion.div
            key={printer.config.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`border-2 ${getBorderColor(printer.printerType)} rounded-lg p-3 bg-gradient-to-br ${getGradientColor(printer.printerType)} to-transparent relative group overflow-hidden`}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-2 relative z-10">
              <div className="flex items-center gap-2">
                <Printer
                  className={`w-4 h-4 ${printer.printerType === "bambu" ? "text-green-400" : "text-cyan-400"}`}
                />
                <h3 className="text-white font-bold text-sm">
                  {printer.config.name}
                </h3>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(printer.status)}`}
              >
                {printer.status.toUpperCase()}
              </span>
            </div>

            {/* === CAMERA  / THUMBNAIL ZONE === */}
            <div className="relative z-10 aspect-video bg-black/60 rounded mb-3 overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors">
              {/* On priorise le thumbnail du job en cours, sinon placeholder cam */}
              {printer.currentJob?.thumbnail ? (
                <img
                  src={printer.currentJob.thumbnail}
                  alt="Print Job"
                  className="w-full h-full object-cover opacity-80"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                  <Camera className="w-8 h-8 opacity-50 mb-1" />
                  <span className="text-[9px] tracking-widest uppercase opacity-50">
                    NO SIGNAL
                  </span>
                </div>
              )}

              {/* Overlay Cam Info */}
              <div className="absolute top-1 left-1 bg-black/50 px-1 py-0.5 rounded text-[8px] text-white/70 font-mono">
                CAM_LINK_ACTIVE
              </div>
            </div>

            {/* Printing Info */}
            {printer.status === "printing" && printer.currentJob ? (
              <div className="relative z-10">
                <div
                  className="text-white text-xs truncate mb-1 opacity-90"
                  title={printer.currentJob.fileName}
                >
                  {printer.currentJob.fileName}
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span
                      className={
                        printer.printerType === "bambu"
                          ? "text-green-400"
                          : "text-cyan-400"
                      }
                    >
                      {printer.currentJob.progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full ${printer.printerType === "bambu" ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gradient-to-r from-cyan-500 to-blue-500"}`}
                      style={{
                        width: `${printer.currentJob.progress}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {/* Temps */}
                  <div className="flex items-center gap-2 bg-black/40 rounded p-2 border border-white/5">
                    <Thermometer className="w-3 h-3 text-red-400" />
                    <div>
                      <span className="text-gray-500 text-[9px] block">
                        NOZZLE
                      </span>
                      <span className="text-white font-medium">
                        {printer.temps.nozzle.toFixed(0)} /{" "}
                        {printer.temps.nozzleTarget?.toFixed(0)}°C
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 rounded p-2 border border-white/5">
                    <Clock className="w-3 h-3 text-purple-400" />
                    <div>
                      <span className="text-gray-500 text-[9px] block">
                        ETA
                      </span>
                      <span className="text-white font-medium">
                        {formatDuration(printer.currentJob.eta || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Idle State
              <div className="text-center py-4 relative z-10 text-gray-500 text-xs italic">
                Systeme prêt. Attente de job.
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
