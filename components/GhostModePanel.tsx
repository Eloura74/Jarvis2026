import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, X, Loader2, AlertCircle } from "lucide-react";
import { useGhostMode } from "../hooks/useGhostMode";

/**
 * Panel Ghost Mode
 * Affichage suggestions contextuelles écran
 */
export default function GhostModePanel() {
  const { analyze, isAnalyzing, lastAnalysis, error } = useGhostMode();
  const [isOpen, setIsOpen] = useState(false);

  const handleAnalyze = async () => {
    await analyze();
    if (!isOpen) setIsOpen(true); // Auto-open panel après analyse
  };

  return (
    <>
      {/* Toggle Button - Bottom-right HUD (à côté Printer/Workflow) */}
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="fixed bottom-4 right-56 p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 backdrop-blur-md transition-all z-40 disabled:opacity-50"
        title="Ghost Mode - Analyze Screen (Ctrl+Shift+A)"
      >
        {isAnalyzing ? (
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
        ) : (
          <Eye className="w-4 h-4 text-purple-400" />
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-24 right-4 w-[400px] max-h-[500px] bg-black/90 backdrop-blur-md border border-purple-500/50 rounded-lg overflow-hidden z-30"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500/20 to-transparent p-3 border-b border-purple-500/30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <h3 className="text-white font-bold text-sm">Ghost Mode</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 overflow-y-auto max-h-[440px]">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded p-2 mb-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                  <span className="text-red-400 text-xs">{error}</span>
                </div>
              )}

              {lastAnalysis && (
                <div className="space-y-3">
                  {/* Context */}
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2">
                    <div className="text-purple-400 text-[10px] font-bold mb-1">
                      CONTEXT
                    </div>
                    <div className="text-white text-xs">
                      {lastAnalysis.context}
                    </div>
                  </div>

                  {/* Detected Task */}
                  {lastAnalysis.detectedTask && (
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-2">
                      <div className="text-cyan-400 text-[10px] font-bold mb-1">
                        TASK DETECTED
                      </div>
                      <div className="text-white text-xs">
                        {lastAnalysis.detectedTask}
                      </div>
                    </div>
                  )}

                  {/* Detected Language */}
                  {lastAnalysis.detectedLanguage && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                      <div className="text-green-400 text-[10px] font-bold mb-1">
                        LANGUAGE
                      </div>
                      <div className="text-white text-xs">
                        {lastAnalysis.detectedLanguage}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                    <div className="text-yellow-400 text-[10px] font-bold mb-2">
                      SUGGESTIONS
                    </div>
                    <ul className="space-y-1">
                      {lastAnalysis.suggestions.map((sug, i) => (
                        <li
                          key={i}
                          className="text-white text-xs flex items-start gap-2"
                        >
                          <span className="text-yellow-400 mt-0.5">•</span>
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Timestamp */}
                  <div className="text-gray-500 text-[10px] text-right">
                    {new Date(lastAnalysis.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              )}

              {!lastAnalysis && !error && (
                <div className="text-center text-gray-500 text-sm py-8">
                  Click Eye icon to analyze screen
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
