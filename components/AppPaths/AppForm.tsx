import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { AppPath } from "../../hooks/useAppPaths";

interface AppFormProps {
  app: AppPath;
  onSave: (app: AppPath) => void;
  onCancel: () => void;
  onChange: (app: AppPath) => void;
  isNew?: boolean;
}

export const AppForm: React.FC<AppFormProps> = ({
  app,
  onSave,
  onCancel,
  onChange,
  isNew,
}) => {
  const [localApp, setLocalApp] = useState(app);

  const handleChange = (field: keyof AppPath, value: any) => {
    const updated = { ...localApp, [field]: value };
    setLocalApp(updated);
    onChange(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 bg-cyan-500/10 border-2 border-cyan-400 rounded-lg space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-cyan-300 font-mono font-bold">
          {isNew ? "➕ Nouvelle Application" : "✏️ Édition"}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(localApp)}
            disabled={!localApp.name || !localApp.path}
            className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-mono flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            SAUVEGARDER
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded hover:bg-red-500/30 transition-all text-xs font-mono flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            ANNULER
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Nom */}
        <div>
          <label className="block text-cyan-400 font-mono text-xs mb-1">
            Nom *
          </label>
          <input
            type="text"
            value={localApp.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Ex: Chrome"
            className="w-full px-3 py-2 bg-black/50 border border-cyan-500/30 rounded text-cyan-50 font-mono text-sm focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Icône */}
        <div>
          <label className="block text-cyan-400 font-mono text-xs mb-1">
            Icône
          </label>
          <input
            type="text"
            value={localApp.icon}
            onChange={(e) => handleChange("icon", e.target.value)}
            placeholder="🌐"
            className="w-full px-3 py-2 bg-black/50 border border-cyan-500/30 rounded text-cyan-50 font-mono text-sm focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Chemin */}
        <div className="col-span-2">
          <label className="block text-cyan-400 font-mono text-xs mb-1">
            Chemin complet *
          </label>
          <input
            type="text"
            value={localApp.path}
            onChange={(e) => handleChange("path", e.target.value)}
            placeholder="C:\Program Files\...\app.exe"
            className="w-full px-3 py-2 bg-black/50 border border-cyan-500/30 rounded text-cyan-50 font-mono text-sm focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-cyan-400 font-mono text-xs mb-1">
            Catégorie
          </label>
          <select
            value={localApp.category}
            onChange={(e) =>
              handleChange("category", e.target.value as AppPath["category"])
            }
            className="w-full px-3 py-2 bg-black/50 border border-cyan-500/30 rounded text-cyan-50 font-mono text-sm focus:outline-none focus:border-cyan-400"
          >
            <option value="browser">Navigateur</option>
            <option value="ide">IDE</option>
            <option value="media">Média</option>
            <option value="productivity">Productivité</option>
            <option value="system">Système</option>
            <option value="other">Autre</option>
          </select>
        </div>

        {/* Alias */}
        <div className="col-span-2">
          <label className="block text-cyan-400 font-mono text-xs mb-1">
            Alias (séparés par des virgules)
          </label>
          <input
            type="text"
            value={localApp.aliases.join(", ")}
            onChange={(e) =>
              handleChange(
                "aliases",
                e.target.value.split(",").map((a) => a.trim()),
              )
            }
            placeholder="chrome, google chrome, navigateur"
            className="w-full px-3 py-2 bg-black/50 border border-cyan-500/30 rounded text-cyan-50 font-mono text-sm focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>
    </motion.div>
  );
};
