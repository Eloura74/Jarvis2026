/**
 * PrinterFleetDashboard Component
 *
 * Vue unifiée du parc d'imprimantes 3D
 * Status live + queue + alertes filament
 */

import { motion, AnimatePresence } from "framer-motion";
import { Printer, AlertTriangle, Clock } from "lucide-react";
import { usePrinterFleet } from "../hooks/usePrinterFleet";
import { useState } from "react";

export default function PrinterFleetDashboard() {
  const { printers, summary, queue, filament, filamentAlert } =
    usePrinterFleet(1000);
  const [isOpen, setIsOpen] = useState(false); // Masqué par défaut

  // Si aucune imprimante, pas d'affichage
  if (printers.length === 0) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "idle":
        return "text-green-400 border-green-500";
      case "printing":
        return "text-cyan-400 border-cyan-500";
      case "offline":
        return "text-gray-500 border-gray-600";
      case "error":
        return "text-red-400 border-red-500";
      default:
        return "text-gray-400 border-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "idle":
        return "🟢";
      case "printing":
        return "🔵";
      case "offline":
        return "⚫";
      case "error":
        return "🔴";
      default:
        return "⚪";
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
            className="fixed bottom-20 right-4 w-[500px] bg-black/90 backdrop-blur-md border border-cyan-500/50 rounded-lg overflow-hidden z-30"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500/20 to-transparent p-3 border-b border-cyan-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-cyan-400" />
                  <span className="font-bold text-cyan-400">PRINTER FLEET</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-green-400">{summary.idle} idle</span>
                  <span className="text-cyan-400">
                    {summary.printing} active
                  </span>
                  <span className="text-gray-500">
                    {summary.offline} offline
                  </span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Printers Grid */}
            {printers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Aucune imprimante configurée
              </div>
            ) : (
              <>
                <div className="p-3 grid grid-cols-2 gap-3">
                  {printers.map((printer) => (
                    <div
                      key={printer.config.id}
                      className={`p-3 rounded-lg border ${getStatusColor(printer.status)} bg-black/40`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white">
                          {printer.config.name}
                        </span>
                        <span className="text-2xl">
                          {getStatusIcon(printer.status)}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span
                            className={
                              getStatusColor(printer.status).split(" ")[0]
                            }
                          >
                            {printer.status.toUpperCase()}
                          </span>
                        </div>

                        {printer.currentJob ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Job:</span>
                              <span className="text-cyan-400 truncate max-w-[100px]">
                                {printer.currentJob.fileName}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Progress:</span>
                              <span className="text-green-400">
                                {printer.currentJob.progress}%
                              </span>
                            </div>
                            {printer.currentJob.eta && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">ETA:</span>
                                <span className="text-yellow-400">
                                  {Math.floor(printer.currentJob.eta / 60)}min
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-500 text-center py-2">
                            {printer.status === "offline"
                              ? "Hors ligne"
                              : "Prête"}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Queue */}
                {queue.length > 0 && (
                  <div className="border-t border-cyan-500/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-bold text-sm">
                        QUEUE ({queue.length})
                      </span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {queue.slice(0, 3).map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-2 rounded bg-yellow-500/10 border border-yellow-500/30 text-xs"
                        >
                          <span className="text-white truncate flex-1">
                            {job.fileName}
                          </span>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-yellow-400 font-bold">
                              [P{job.priority}]
                            </span>
                            <span className="text-gray-400">
                              {job.estimatedFilament}g
                            </span>
                          </div>
                        </div>
                      ))}
                      {queue.length > 3 && (
                        <div className="text-gray-500 text-center text-xs">
                          +{queue.length - 3} autres jobs
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Filament Alert */}
                {filamentAlert.alert && (
                  <div className="border-t border-red-500/30 p-3 bg-red-500/10">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 font-bold text-sm">
                        {filamentAlert.message || "Stock filament faible"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Total Filament Used */}
                <div className="border-t border-cyan-500/30 p-3 bg-cyan-500/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Filament total utilisé:
                    </span>
                    <span className="text-cyan-400 font-bold">
                      {filament.totalUsed.toFixed(1)}g
                    </span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
