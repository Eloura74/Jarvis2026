/**
 * WorkflowPanel — Éditeur & Gestionnaire complet de Routines / Workflows
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Trash2,
  Plus,
  Zap,
  Activity,
  CheckCircle2,
  X,
  Sliders,
  Settings,
  ChevronRight,
  ListPlus
} from "lucide-react";
import { toast } from "react-hot-toast";
import PresenceWidget from "./PresenceWidget";

export interface WorkflowItem {
  id: string;
  name: string;
  actions: string[];
  icon?: string;
  triggerCount: number;
}

const ACTION_SUGGESTIONS = [
  "Lumières Bureau On",
  "Lumières Bureau Off",
  "Lancer VS Code",
  "Spotify Focus",
  "Volume 50%",
  "Mode Veille On",
  "Capture Écran",
  "Vider Corbeille"
];

export default function WorkflowPanel() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"workflows" | "editor" | "presence">("workflows");

  // State création / édition workflow
  const [editingId, setEditingId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState("");
  const [actions, setActions] = useState<string[]>([]);
  const [newActionInput, setNewActionInput] = useState("");
  const [runningId, setRunningId] = useState<string | null>(null);

  // Charger workflows depuis le backend
  const fetchWorkflows = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/workflows");
      if (res.ok) {
        const json = await res.json();
        setWorkflows(json.workflows || []);
      }
    } catch {
      // Fallback localStorage
      const raw = localStorage.getItem("jarvis_workflows");
      if (raw) setWorkflows(JSON.parse(raw));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  // Déclencher un workflow
  const handleRun = async (wf: WorkflowItem) => {
    setRunningId(wf.id);
    toast.loading(`Exécution de "${wf.name}"...`, { id: "wf-run" });

    try {
      await fetch(`http://localhost:3001/api/workflows/${encodeURIComponent(wf.id)}/run`, {
        method: "POST"
      });

      // Exécuter la première action via l'API system
      toast.success(`Workflow "${wf.name}" exécuté avec succès`, { id: "wf-run" });
      fetchWorkflows();
    } catch {
      toast.error("Erreur exécution workflow", { id: "wf-run" });
    } finally {
      setRunningId(null);
    }
  };

  // Supprimer un workflow
  const handleDelete = async (wf: WorkflowItem) => {
    if (!confirm(`Supprimer la routine "${wf.name}" ?`)) return;

    try {
      await fetch(`http://localhost:3001/api/workflows/${encodeURIComponent(wf.id)}`, {
        method: "DELETE"
      });
      toast.success("Routine supprimée");
      fetchWorkflows();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  // Ouvrir éditeur pour créer ou modifier
  const handleOpenEditor = (wf?: WorkflowItem) => {
    if (wf) {
      setEditingId(wf.id);
      setWorkflowName(wf.name);
      setActions([...wf.actions]);
    } else {
      setEditingId(null);
      setWorkflowName("");
      setActions(["Lancer VS Code", "Spotify Focus"]);
    }
    setActiveTab("editor");
  };

  // Ajouter une étape dans le formulaire
  const handleAddAction = (actionText?: string) => {
    const text = actionText || newActionInput.trim();
    if (!text) return;
    setActions(prev => [...prev, text]);
    setNewActionInput("");
  };

  // Supprimer une étape
  const handleRemoveAction = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index));
  };

  // Sauvegarder le workflow (POST au backend)
  const handleSaveWorkflow = async () => {
    if (!workflowName.trim()) {
      toast.error("Veuillez saisir un nom de routine");
      return;
    }
    if (actions.length === 0) {
      toast.error("Ajoutez au moins 1 action");
      return;
    }

    try {
      const res = await fetch("http://localhost:3001/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName,
          actions
        })
      });

      if (res.ok) {
        toast.success(`Routine "${workflowName}" sauvegardée !`);
        fetchWorkflows();
        setActiveTab("workflows");
      } else {
        toast.error("Erreur sauvegarde serveur");
      }
    } catch {
      toast.error("Impossible de contacter le serveur");
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-4 space-y-4">
      {/* Navigation Onglets */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h2 className="text-sm font-bold text-cyan-300 uppercase tracking-widest">
            Routines & Automatisation
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("workflows")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "workflows" ? "bg-cyan-500/20 border border-cyan-400 text-cyan-200" : "bg-black/40 border border-white/10 text-gray-400 hover:text-white"}`}
          >
            <Activity size={14} /> Routines ({workflows.length})
          </button>

          <button
            onClick={() => handleOpenEditor()}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "editor" ? "bg-purple-500/20 border border-purple-400 text-purple-200" : "bg-black/40 border border-white/10 text-gray-400 hover:text-white"}`}
          >
            <Plus size={14} /> Créer Routine
          </button>

          <button
            onClick={() => setActiveTab("presence")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "presence" ? "bg-amber-500/20 border border-amber-400 text-amber-200" : "bg-black/40 border border-white/10 text-gray-400 hover:text-white"}`}
          >
            <Sliders size={14} /> Présence
          </button>
        </div>
      </div>

      {/* CONTENU */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {activeTab === "workflows" && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-gray-500 font-mono text-sm">
                Chargement des routines...
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-gray-400 text-sm">Aucune routine enregistrée pour l'instant.</p>
                <button
                  onClick={() => handleOpenEditor()}
                  className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-bold uppercase"
                >
                  + Créer ma première routine
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {workflows.map((wf) => (
                  <motion.div
                    key={wf.id || wf.name}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-black/40 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-cyan-200 flex items-center gap-2">
                          <Zap size={14} className="text-cyan-400" />
                          {wf.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditor(wf)}
                            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-cyan-300 hover:border-cyan-500/30"
                            title="Modifier"
                          >
                            <Settings size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(wf)}
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                            title="Supprimer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-gray-500 mb-3">
                        {wf.triggerCount || 0} exécution(s) • {wf.actions.length} étape(s)
                      </div>

                      {/* Étapes */}
                      <div className="space-y-1">
                        {wf.actions.map((act, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-300 bg-black/40 px-2.5 py-1 rounded border border-white/5">
                            <span className="text-[10px] font-bold text-cyan-500 font-mono">{i + 1}.</span>
                            <span className="truncate">{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRun(wf)}
                      disabled={runningId === wf.id}
                      className={`w-full py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${runningId === wf.id ? "bg-green-500/20 border-green-500 text-green-300 animate-pulse" : "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30"}`}
                    >
                      <Play size={14} className={runningId === wf.id ? "fill-current" : ""} />
                      {runningId === wf.id ? "Exécution..." : "Déclencher Routine"}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "editor" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-xl bg-black/40 border border-purple-500/30 space-y-4 max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <ListPlus size={16} />
                {editingId ? `Modifier : ${workflowName}` : "Créer une Nouvelle Routine"}
              </h3>
              <button onClick={() => setActiveTab("workflows")} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {/* Nom Routine */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Nom de la routine</label>
              <input
                type="text"
                placeholder="Ex: Mode Travail, Mode Cinéma..."
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/60 border border-purple-500/30 text-white placeholder-gray-600 text-xs font-mono focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Liste des actions */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">
                Étapes ({actions.length})
              </label>

              <div className="space-y-2">
                {actions.map((act, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-purple-950/20 border border-purple-500/20 px-3 py-2 rounded-lg">
                    <span className="text-xs text-purple-200 font-mono flex items-center gap-2">
                      <span className="text-purple-400 font-bold">{idx + 1}.</span> {act}
                    </span>
                    <button
                      onClick={() => handleRemoveAction(idx)}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Ajouter une action custom */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Ex: Éteindre les lumières du salon..."
                  value={newActionInput}
                  onChange={(e) => setNewActionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddAction()}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white placeholder-gray-600 text-xs font-mono focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => handleAddAction()}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-bold uppercase flex items-center gap-1"
                >
                  <Plus size={14} /> Ajouter
                </button>
              </div>

              {/* Suggestions rapides */}
              <div className="pt-2">
                <div className="text-[10px] font-mono text-gray-500 mb-1">Suggestions rapides :</div>
                <div className="flex flex-wrap gap-1">
                  {ACTION_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => handleAddAction(sug)}
                      className="px-2 py-0.5 rounded bg-black/40 border border-white/5 text-[10px] text-cyan-400 hover:border-cyan-500/40"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions Sauvegarder / Annuler */}
            <div className="flex gap-2 pt-4 border-t border-purple-500/20">
              <button
                onClick={() => setActiveTab("workflows")}
                className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs font-bold uppercase"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveWorkflow}
                className="flex-1 py-2 rounded-lg bg-purple-500/30 hover:bg-purple-500/40 border border-purple-400 text-purple-200 text-xs font-bold uppercase flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={14} /> Sauvegarder Routine
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "presence" && (
          <div className="max-w-xl mx-auto">
            <PresenceWidget />
          </div>
        )}
      </div>
    </div>
  );
}
