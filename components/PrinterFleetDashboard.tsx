/**
 * Dashboard Fleet Manager - Vue enrichie
 * Affichage premium des 3 imprimantes avec thumbnails et stats détaillées
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Printer, X, Clock, Layers, Zap, Thermometer } from "lucide-react";
import { usePrinterFleet } from "../hooks/usePrinterFleet";

export default function PrinterFleetDashboard() {
  const { printers, summary } = usePrinterFleet();
  const [isOpen, setIsOpen] = useState(false);

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
    <>
      {/* Toggle Button - À côté de Cache (bottom-right) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-20 p-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 backdrop-blur-md transition-all z-40"
        title="Printer Fleet"
      >
        <Printer className="w-5 h-5 text-cyan-400" />
        {summary.total > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
            {summary.total}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 right-4 w-[900px] max-h-[600px] bg-black/90 backdrop-blur-md border border-cyan-500/50 rounded-lg overflow-hidden z-30"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500/20 to-transparent p-3 border-b border-cyan-500/30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-cyan-400" />
                <h2 className="text-white font-bold">
                  Printer Fleet ({summary.total})
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printer Cards Grid */}
            <div className="p-4 overflow-y-auto max-h-[520px]">
              <div className="grid grid-cols-3 gap-4">
                {printers.map((printer) => (
                  <motion.div
                    key={printer.config.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`border-2 ${getBorderColor(printer.printerType)} rounded-lg p-3 bg-gradient-to-br ${getGradientColor(printer.printerType)} to-transparent`}
                  >
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-2">
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

                    {/* Thumbnail */}
                    {printer.currentJob?.thumbnail && (
                      <img
                        src={printer.currentJob.thumbnail}
                        alt={printer.currentJob.fileName}
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                    )}

                    {/* Printing Info */}
                    {printer.status === "printing" && printer.currentJob ? (
                      <div>
                        {/* File Name */}
                        <div
                          className="text-white text-xs truncate mb-1"
                          title={printer.currentJob.fileName}
                        >
                          {printer.currentJob.fileName}
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2">
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
                          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${printer.printerType === "bambu" ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gradient-to-r from-cyan-500 to-blue-500"}`}
                              style={{
                                width: `${printer.currentJob.progress}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                          {/* Nozzle Temp */}
                          <div className="flex items-center gap-1 bg-black/30 rounded p-1.5">
                            <Thermometer className="w-3 h-3 text-red-400" />
                            <span className="text-gray-400">Nozzle:</span>
                            <span className="text-white font-bold">
                              {printer.temps.nozzle.toFixed(0)}
                              {printer.temps.nozzleTarget &&
                                `/${printer.temps.nozzleTarget.toFixed(0)}`}
                              °C
                            </span>
                          </div>

                          {/* Bed Temp */}
                          <div className="flex items-center gap-1 bg-black/30 rounded p-1.5">
                            <Thermometer className="w-3 h-3 text-orange-400" />
                            <span className="text-gray-400">Bed:</span>
                            <span className="text-white font-bold">
                              {printer.temps.bed.toFixed(0)}
                              {printer.temps.bedTarget &&
                                `/${printer.temps.bedTarget.toFixed(0)}`}
                              °C
                            </span>
                          </div>

                          {/* Time Elapsed */}
                          <div className="flex items-center gap-1 bg-black/30 rounded p-1.5">
                            <Clock className="w-3 h-3 text-blue-400" />
                            <span className="text-gray-400">Elapsed:</span>
                            <span className="text-white font-bold">
                              {formatDuration(
                                printer.currentJob.printDuration || 0,
                              )}
                            </span>
                          </div>

                          {/* Time Remaining */}
                          <div className="flex items-center gap-1 bg-black/30 rounded p-1.5">
                            <Clock className="w-3 h-3 text-purple-400" />
                            <span className="text-gray-400">ETA:</span>
                            <span className="text-white font-bold">
                              {formatDuration(printer.currentJob.eta || 0)}
                            </span>
                          </div>

                          {/* Layers */}
                          {printer.currentJob.currentLayer &&
                            printer.currentJob.totalLayers && (
                              <div className="flex items-center gap-1 bg-black/30 rounded p-1.5">
                                <Layers className="w-3 h-3 text-yellow-400" />
                                <span className="text-gray-400">Layer:</span>
                                <span className="text-white font-bold">
                                  {printer.currentJob.currentLayer}/
                                  {printer.currentJob.totalLayers}
                                </span>
                              </div>
                            )}

                          {/* Speed */}
                          {printer.currentJob.speed && (
                            <div className="flex items-center gap-1 bg-black/30 rounded p-1.5">
                              <Zap className="w-3 h-3 text-green-400" />
                              <span className="text-gray-400">Speed:</span>
                              <span className="text-white font-bold">
                                {printer.currentJob.speed}mm/s
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Idle State
                      <div className="text-center py-6">
                        <div className="text-gray-500 text-sm mb-1">
                          Ready to print
                        </div>
                        <div className="text-gray-600 text-xs">
                          No active job
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    {printer.config.ip && (
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <a
                          href={`http://${printer.config.ip}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-[10px] ${printer.printerType === "bambu" ? "text-green-400 hover:text-green-300" : "text-cyan-400 hover:text-cyan-300"} transition-colors`}
                        >
                          Open{" "}
                          {printer.printerType === "bambu"
                            ? "Bambu"
                            : "Mainsail"}{" "}
                          →
                        </a>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
