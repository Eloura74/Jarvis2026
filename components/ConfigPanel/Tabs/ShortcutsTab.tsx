import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";

type ViewMode = "list" | "add" | "edit";

export const ShortcutsTab: React.FC = () => {
  const [shortcuts, setShortcuts] = useState<
    Record<string, { keys: string; description: string }>
  >({});
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formKeys, setFormKeys] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const loadShortcuts = React.useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3001/api/shortcuts");
      const data = await res.json();
      setShortcuts(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    loadShortcuts();
  }, [loadShortcuts]);

  const handleSave = async () => {
    try {
      await fetch("http://localhost:3001/api/shortcuts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          data: { keys: formKeys, description: formDescription },
        }),
      });
      loadShortcuts();
      setViewMode("list");
      resetForm();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Supprimer ${name} ?`)) return;
    try {
      await fetch(`http://localhost:3001/api/shortcuts/${name}`, {
        method: "DELETE",
      });
      loadShortcuts();
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormKeys("");
    setFormDescription("");
  };

  const filtered = Object.entries(shortcuts).filter(([name]) =>
    name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {viewMode === "list" ? (
        <>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Rechercher un raccourci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-cyan-400/30 rounded-lg text-white"
              />
            </div>
            <button
              onClick={() => setViewMode("add")}
              className="px-6 py-3 bg-cyan-500/20 border border-cyan-400 rounded-lg text-cyan-300 flex items-center gap-2"
            >
              <Plus size={20} /> Ajouter
            </button>
          </div>
          <div className="grid gap-3">
            {filtered.map(([name, data]) => (
              <div
                key={name}
                className="bg-slate-800/50 border border-cyan-400/20 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="text-cyan-300 font-bold">{name}</h3>
                  <code className="text-xs text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded mt-1 inline-block">
                    {data.keys}
                  </code>
                  <p className="text-sm text-gray-400 mt-1">
                    {data.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFormName(name);
                      setFormKeys(data.keys);
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
            {viewMode === "add" ? "Ajouter" : "Modifier"} un raccourci
          </h3>
          <input
            type="text"
            placeholder="Nom (ex: Copier)"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full p-3 bg-slate-800 border border-cyan-400/30 rounded text-white"
          />
          <input
            type="text"
            placeholder="Touches (ex: ctrl+c)"
            value={formKeys}
            onChange={(e) => setFormKeys(e.target.value)}
            className="w-full p-3 bg-slate-800 border border-cyan-400/30 rounded text-white"
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
