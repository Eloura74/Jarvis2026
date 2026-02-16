import { motion } from "framer-motion";
import { Eye, Loader2, AlertCircle } from "lucide-react";
import { useGhostMode } from "../hooks/useGhostMode";

/**
 * Panel Ghost Mode
 * Affichage suggestions contextuelles écran
 */
export default function GhostModePanel() {
  const { analyze, isAnalyzing, lastAnalysis, error } = useGhostMode();

  const handleAnalyze = async () => {
    await analyze();
    // Auto-open managed by parent
  };

  return (
    <div className="h-full flex flex-col p-4 w-full">
      <div className="flex justify-center mb-6">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="relative group overflow-hidden bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/50 hover:border-purple-400 rounded-full px-8 py-3 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 relative z-10">
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 animate-spin text-purple-300" />
            ) : (
              <Eye className="w-5 h-5 text-purple-300 group-hover:text-white" />
            )}
            <span className="text-purple-300 font-bold tracking-widest group-hover:text-white transition-colors">
              {isAnalyzing ? "ANALYZING..." : "INITIATE SCAN"}
            </span>
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <span className="text-red-400 text-sm font-medium">{error}</span>
          </div>
        )}

        {lastAnalysis && (
          <div className="space-y-4 max-w-2xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Detected Task */}
              {lastAnalysis.detectedTask && (
                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded p-3">
                  <div className="text-cyan-400 text-[10px] font-bold mb-1 tracking-wider uppercase">
                    TASK DETECTED
                  </div>
                  <div className="text-white text-sm">
                    {lastAnalysis.detectedTask}
                  </div>
                </div>
              )}

              {/* Detected Language */}
              {lastAnalysis.detectedLanguage && (
                <div className="bg-green-500/5 border border-green-500/20 rounded p-3">
                  <div className="text-green-400 text-[10px] font-bold mb-1 tracking-wider uppercase">
                    LANGUAGE
                  </div>
                  <div className="text-white text-sm">
                    {lastAnalysis.detectedLanguage}
                  </div>
                </div>
              )}
            </div>

            {/* Context */}
            <div className="bg-purple-500/5 border border-purple-500/20 rounded p-4">
              <div className="text-purple-400 text-[10px] font-bold mb-2 tracking-wider uppercase">
                VISUAL CONTEXT
              </div>
              <div className="text-gray-300 text-sm leading-relaxed">
                {lastAnalysis.context}
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded p-4">
              <div className="text-yellow-400 text-[10px] font-bold mb-3 tracking-wider uppercase">
                TACTICAL SUGGESTIONS
              </div>
              <ul className="space-y-2">
                {lastAnalysis.suggestions.map((sug, i) => (
                  <li
                    key={i}
                    className="text-gray-300 text-sm flex items-start gap-3 group"
                  >
                    <span className="text-yellow-500/50 mt-1.5 text-[10px] group-hover:text-yellow-400 transition-colors">
                      ▶
                    </span>
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Timestamp */}
            <div className="text-gray-600 text-[10px] text-center mt-4 font-mono">
              ANALYSIS TIMESTAMP:{" "}
              {new Date(lastAnalysis.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        {!lastAnalysis && !error && (
          <div className="flex flex-col items-center justify-center p-10 opacity-50">
            <Eye className="w-16 h-16 text-purple-500/30 mb-4" />
            <div className="text-purple-300/50 text-sm tracking-widest uppercase">
              Awaiting Visual Input
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
