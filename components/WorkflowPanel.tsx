/**
 * WorkflowPanel Component Refactored (MK-85)
 *
 * Gestion des workflows automation
 * Piloté par le OrbitalMenu (plus de bouton flottant interne)
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Workflow,
  Play,
  Trash2,
  Plus,
  ChevronRight,
  Activity,
} from "lucide-react";
import { useWorkflows } from "../hooks/useWorkflows";
import { toast } from "react-hot-toast";

export default function WorkflowPanel() {
  const { workflows, suggestedPatterns, acceptPattern, removeWorkflow } =
    useWorkflows();
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [selectedPatternIndex, setSelectedPatternIndex] = useState<
    number | null
  >(null);
  const [runningWorkflow, setRunningWorkflow] = useState<string | null>(null);

  const handleCreateWorkflow = () => {
    if (selectedPatternIndex !== null && newWorkflowName.trim()) {
      acceptPattern(selectedPatternIndex, newWorkflowName);
      setNewWorkflowName("");
      setSelectedPatternIndex(null);
      toast.success("Workflow créé avec succès");
    }
  };

  const handleRunWorkflow = async (workflowName: string) => {
    setRunningWorkflow(workflowName);
    toast.loading(`Exécution de "${workflowName}"...`, { id: "run-wf" });

    try {
      // Simulation appel Backend
      // const res = await fetch('/api/automation/run', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name: workflowName })
      // });

      // Simulation délai
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success(`"${workflowName}" exécuté avec succès`, { id: "run-wf" });
    } catch (error) {
      toast.error("Erreur lors de l'exécution", { id: "run-wf" });
    } finally {
      setRunningWorkflow(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-96 max-h-[70vh] jarvis-panel-glass overflow-hidden flex flex-col rounded-xl border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/40 to-transparent p-4 border-b border-purple-500/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <Workflow className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-purple-300 tracking-wider text-sm">
              AUTOMATION SEQUENCE
            </h3>
            <div className="text-[10px] text-purple-500/60 font-mono">
              BACKEND LINK: ACTIVE
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar flex-1">
        {/* Patterns Suggérés */}
        {suggestedPatterns.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-yellow-500 animate-pulse" />
              <h4 className="text-yellow-500/80 font-bold text-xs tracking-widest uppercase">
                Patterns Détectés ({suggestedPatterns.length})
              </h4>
            </div>

            <div className="space-y-2">
              {suggestedPatterns.map((pattern, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedPatternIndex === i
                      ? "bg-purple-500/20 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                      : "bg-black/40 border-purple-500/10 hover:border-purple-500/30"
                  }`}
                  onClick={() => setSelectedPatternIndex(i)}
                >
                  <div className="flex items-center gap-1 flex-wrap mb-2">
                    {pattern.pattern.map((cmd: string, j: number) => (
                      <span key={j} className="flex items-center gap-1">
                        <span className="text-cyan-300 text-xs bg-cyan-900/30 px-1.5 py-0.5 rounded border border-cyan-500/20">
                          {cmd}
                        </span>
                        {j < pattern.pattern.length - 1 && (
                          <ChevronRight className="w-3 h-3 text-gray-600" />
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono flex justify-between">
                    <span>Féquence: {pattern.count}x</span>
                    <span>Intervalle: {pattern.timeWindow}s</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Create Workflow Form */}
            {selectedPatternIndex !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 rounded-lg bg-purple-900/20 border border-purple-500/30"
              >
                <input
                  type="text"
                  placeholder="Nom du workflow..."
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-black/50 border border-purple-500/30 text-white placeholder-gray-600 focus:outline-none focus:border-purple-400 text-sm mb-2 font-mono"
                  autoFocus
                />
                <button
                  onClick={handleCreateWorkflow}
                  disabled={!newWorkflowName.trim()}
                  className="w-full py-1.5 rounded bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/50 text-purple-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-3 h-3" />
                  Sauvegarder Sequence
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Workflows Actifs */}
        <div>
          <h4 className="text-cyan-500/80 font-bold text-xs tracking-widest uppercase mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
            Workflows Actifs
            <span className="px-1.5 py-0.5 bg-cyan-900/30 rounded text-[10px] border border-cyan-500/20 text-cyan-300">
              {workflows.length}
            </span>
          </h4>

          {workflows.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-white/10 text-center">
              <Workflow className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <div className="text-gray-500 text-xs">Aucun workflow actif</div>
            </div>
          ) : (
            <div className="space-y-2">
              {workflows.map((wf) => (
                <div
                  key={wf.name}
                  className="p-3 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-cyan-500/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cyan-100 font-bold text-sm tracking-wide">
                      {wf.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRunWorkflow(wf.name)}
                        disabled={runningWorkflow === wf.name}
                        className={`p-1.5 rounded-lg border transition-all ${
                          runningWorkflow === wf.name
                            ? "bg-green-500/20 border-green-500 text-green-400 animate-pulse"
                            : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                        }`}
                        title="Exécuter"
                      >
                        <Play
                          className={`w-3 h-3 ${runningWorkflow === wf.name ? "fill-current" : ""}`}
                        />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer "${wf.name}" ?`)) {
                            removeWorkflow(wf.name);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all opacity-0 group-hover:opacity-100"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mb-2">
                    <span>{wf.triggerCount} exécutions</span>
                    <span className="w-1 h-1 bg-gray-700 rounded-full" />
                    <span>{wf.actions.length} étapes</span>
                  </div>

                  <div className="flex items-center gap-1 overflow-hidden">
                    {wf.actions.slice(0, 4).map((action, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-gray-400 text-[10px] truncate max-w-[80px]"
                      >
                        {action}
                      </span>
                    ))}
                    {wf.actions.length > 4 && (
                      <span className="text-gray-600 text-[10px]">+</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
