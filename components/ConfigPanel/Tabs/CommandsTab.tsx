import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";

type ViewMode = "list" | "add" | "edit";

export const CommandsTab: React.FC = () => {
  const [commands, setCommands] = useState<
    Record<string, { triggers: string[]; action: string; description: string }>
  >({});
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Form state
  const [formName, setFormName] = useState("");
  const [formTriggers, setFormTriggers] = useState("");
  const [formAction, setFormAction] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const loadCommands = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/commands");
      const data = await res.json();
      setCommands(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCommands();
  }, []);

  const handleSave = async () => {
    try {
      await fetch("http://localhost:3001/api/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          data: {
            triggers: formTriggers
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t),
            action: formAction,
            description: formDescription,
          },
        }),
      });
      loadCommands();
      setViewMode("list");
      resetForm();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Supprimer ${name} ?`)) return;
    try {
      await fetch(`http://localhost:3001/api/commands/${name}`, {
        method: "DELETE",
      });
      loadCommands();
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormTriggers("");
    setFormAction("");
    setFormDescription("");
  };

  return (
    <div className="space-y-4">
      {viewMode === "list" ? (
        <>
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setViewMode("add")}
              className="px-6 py-3 bg-cyan-500/20 border border-cyan-400 rounded-lg text-cyan-300 flex items-center gap-2"
            >
              <Plus size={20} /> Ajouter une commande
            </button>
          </div>
          <div className="grid gap-3">
            {Object.entries(commands).map(([name, data]) => (
              <div
                key={name}
                className="bg-slate-800/50 border border-cyan-400/20 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="text-cyan-300 font-bold">{name}</h3>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {data.triggers.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] bg-slate-700 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 italic"
                      >
                        "{t}"
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {data.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFormName(name);
                      setFormTriggers(data.triggers.join(", "));
                      setFormAction(data.action);
                      setFormDescription(data.description);
                      setViewMode("edit");
                    }}
                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(name)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="max-w-md mx-auto space-y-4">
          <h3 className="text-xl font-bold text-cyan-300">
            {viewMode === "add" ? "Nouvelle" : "Modifier la"} commande
          </h3>
          <input
            type="text"
            placeholder="Nom technique (ex: screenshot)"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full p-3 bg-slate-800 border border-cyan-400/30 rounded text-white"
          />
          <input
            type="text"
            placeholder="Phrases d'activation (ex: capture d'écran, fait un screen)"
            value={formTriggers}
            onChange={(e) => setFormTriggers(e.target.value)}
            className="w-full p-3 bg-slate-800 border border-cyan-400/30 rounded text-white"
          />
          <textarea
            placeholder="Action (JSON ou code)"
            value={formAction}
            onChange={(e) => setFormAction(e.target.value)}
            className="w-full p-3 bg-slate-800 border border-cyan-400/30 rounded text-white h-24"
          />
          <input
            type="text"
            placeholder="Description"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="w-full p-3 bg-slate-800 border border-cyan-400/30 rounded text-white"
          />
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-cyan-500 text-slate-900 font-bold rounded"
            >
              Sauvegarder
            </button>
            <button
              onClick={() => {
                setViewMode("list");
                resetForm();
              }}
              className="px-6 py-3 border border-slate-600 rounded text-gray-400"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
