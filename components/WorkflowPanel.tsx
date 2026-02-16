/**
 * WorkflowPanel Component
 *
 * Gestion des workflows automation
 * Affiche patterns suggérés + workflows existants
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Workflow, Play, Trash2, Plus, ChevronRight } from "lucide-react";
import { useWorkflows } from "../hooks/useWorkflows";

export default function WorkflowPanel() {
  const { workflows, suggestedPatterns, acceptPattern, removeWorkflow } =
    useWorkflows();
  const [isOpen, setIsOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [selectedPatternIndex, setSelectedPatternIndex] = useState<
    number | null
  >(null);

  const handleCreateWorkflow = () => {
    if (selectedPatternIndex !== null && newWorkflowName.trim()) {
      acceptPattern(selectedPatternIndex, newWorkflowName);
      setNewWorkflowName("");
      setSelectedPatternIndex(null);
    }
  };

  return (
    <>
      {/* Toggle Button - À côté de Printer/Cache (bottom-right) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-36 p-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 backdrop-blur-md transition-all z-40"
        title="Workflows"
      >
        <Workflow
          className={`w-5 h-5 text-purple-400 ${suggestedPatterns.length > 0 ? "animate-pulse" : ""}`}
        />
        {suggestedPatterns.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
            {suggestedPatterns.length}
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
            className="fixed bottom-20 right-4 w-96 max-h-[70vh] bg-black/90 backdrop-blur-md border border-purple-500/50 rounded-lg overflow-hidden z-50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500/20 to-transparent p-4 border-b border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-purple-400">AUTOMATION</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(70vh-80px)]">
              {/* Patterns Suggérés */}
              {suggestedPatterns.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    <h4 className="text-yellow-400 font-bold text-sm">
                      Patterns Détectés ({suggestedPatterns.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {suggestedPatterns.map((pattern, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          selectedPatternIndex === i
                            ? "bg-purple-500/20 border-purple-500"
                            : "bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/15"
                        }`}
                        onClick={() => setSelectedPatternIndex(i)}
                      >
                        <div className="text-xs text-gray-400 mb-1">
                          Répété {pattern.count}× sur {pattern.timeWindow}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {pattern.pattern.map((cmd: string, j: number) => (
                            <span key={j} className="flex items-center gap-1">
                              <span className="text-cyan-400 text-sm">
                                "{cmd}"
                              </span>
                              {j < pattern.pattern.length - 1 && (
                                <ChevronRight className="w-3 h-3 text-gray-500" />
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Create Workflow Form */}
                  {selectedPatternIndex !== null && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30"
                    >
                      <input
                        type="text"
                        placeholder="Nom du workflow (ex: Mode Travail)"
                        value={newWorkflowName}
                        onChange={(e) => setNewWorkflowName(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-black/50 border border-purple-500/50 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 mb-2"
                      />
                      <button
                        onClick={handleCreateWorkflow}
                        disabled={!newWorkflowName.trim()}
                        className="w-full px-4 py-2 rounded bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500 text-purple-400 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Créer Workflow
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Workflows Actifs */}
              <div>
                <h4 className="text-green-400 font-bold text-sm mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  Workflows Actifs ({workflows.length})
                </h4>
                {workflows.length === 0 ? (
                  <div className="text-gray-500 text-center py-8 text-sm">
                    Aucun workflow créé.
                    <br />
                    Répétez des actions pour détecter des patterns !
                  </div>
                ) : (
                  <div className="space-y-2">
                    {workflows.map((wf) => (
                      <div
                        key={wf.name}
                        className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/15 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-bold">
                            {wf.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              className="p-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500 text-cyan-400 transition-all"
                              title="Exécuter (UI only - backend integration needed)"
                            >
                              <Play className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Supprimer "${wf.name}" ?`)) {
                                  removeWorkflow(wf.name);
                                }
                              }}
                              className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-400 transition-all"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {wf.actions.length} actions • Déclenché{" "}
                          {wf.triggerCount}×
                        </div>
                        <div className="mt-2 flex items-center gap-1 flex-wrap">
                          {wf.actions.slice(0, 3).map((action, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 rounded bg-black/50 text-cyan-400 text-xs"
                            >
                              {action}
                            </span>
                          ))}
                          {wf.actions.length > 3 && (
                            <span className="text-gray-500 text-xs">
                              +{wf.actions.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
