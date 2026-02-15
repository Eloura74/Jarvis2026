/**
 * Config Panel avec CRUD Complet - J.A.R.V.I.S.
 *
 * Fonctionnalités :
 * - Liste toutes les applications
 * - Ajouter une application
 * - Modifier une application
 * - Supprimer une application
 * - Tester le lancement
 * - Recherche et filtres
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  Keyboard,
  Zap,
  Plus,
  Trash2,
  Save,
  Edit,
  Play,
  Search,
  AlertCircle,
  Mic,
  Shield,
  Brain,
  Key,
  X,
} from "lucide-react";

import { VoiceSettingsTab } from "./VoiceSettingsTab";

// Types
interface AppData {
  name: string;
  path: string;
  category: string;
  keywords: string[];
  description: string;
  aliases?: string[];
}

interface ConfigPanelCRUDProps {
  isOpen: boolean;
  onClose: () => void;
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    candidatesTokens: number;
  };
}

type TabType =
  | "apps"
  | "shortcuts"
  | "commands"
  | "voice"
  | "google"
  | "neural";
type ViewMode = "list" | "add" | "edit";

export const ConfigPanelCRUD: React.FC<ConfigPanelCRUDProps> = ({
  isOpen,
  onClose,
  tokenUsage,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("apps");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [apps, setApps] = useState<Record<string, AppData>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [_editingApp, setEditingApp] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPath, setFormPath] = useState("");
  const [formCategory, setFormCategory] = useState("app");
  const [formDescription, setFormDescription] = useState("");
  const [formKeywords, setFormKeywords] = useState("");
  const [formAliases, setFormAliases] = useState("");

  // Charger les apps au montage
  useEffect(() => {
    loadApps();
  }, []);

  // Charger les applications depuis le backend
  const loadApps = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/apps");
      const data = await response.json();
      setApps(data);
    } catch (error) {
      console.error("Erreur chargement apps:", error);
    }
  };

  // Sauvegarder une application
  const saveApp = async () => {
    const appData: AppData = {
      name: formName,
      path: formPath,
      category: formCategory,
      keywords: formKeywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k),
      description: formDescription,
      aliases: formAliases
        ? formAliases
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a)
        : undefined,
    };

    try {
      const response = await fetch("http://localhost:3001/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, data: appData }),
      });

      if (response.ok) {
        await loadApps();
        resetForm();
        setViewMode("list");
      }
    } catch (error) {
      console.error("Erreur sauvegarde app:", error);
    }
  };

  // Supprimer une application
  const deleteApp = async (appName: string) => {
    if (!confirm(`Supprimer "${appName}" ?`)) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/apps/${appName}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        await loadApps();
      }
    } catch (error) {
      console.error("Erreur suppression app:", error);
    }
  };

  // Tester le lancement
  const testLaunch = async (appName: string) => {
    try {
      const response = await fetch("http://localhost:3001/api/apps/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName }),
      });

      if (response.ok) {
        alert(`✅ ${appName} lancé avec succès !`);
      } else {
        alert(`❌ Échec du lancement de ${appName}`);
      }
    } catch (error) {
      alert(`❌ Erreur : ${error}`);
    }
  };

  // Éditer une application
  const startEdit = (appName: string) => {
    const app = apps[appName];
    if (!app) return;

    setFormName(appName);
    setFormPath(app.path);
    setFormCategory(app.category);
    setFormDescription(app.description);
    setFormKeywords(app.keywords.join(", "));
    setFormAliases(app.aliases?.join(", ") || "");
    setEditingApp(appName);
    setViewMode("edit");
  };

  // Reset formulaire
  const resetForm = () => {
    setFormName("");
    setFormPath("");
    setFormCategory("app");
    setFormDescription("");
    setFormKeywords("");
    setFormAliases("");
    setEditingApp(null);
  };

  // Filtrer les apps par recherche
  const filteredApps = Object.entries(apps).filter(
    ([name, data]) =>
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      data.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      data.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-900/95 backdrop-blur-xl border border-cyan-400/30 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,229,255,0.3)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-cyan-400/20">
            <h2 className="text-2xl font-bold text-cyan-300 tracking-wider">
              ⚙️ CONFIGURATION J.A.R.V.I.S.
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors text-cyan-400"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-6 pt-4 border-b border-cyan-400/10">
            <TabButton
              active={activeTab === "apps"}
              onClick={() => setActiveTab("apps")}
              icon={<Folder size={18} />}
              label="Applications"
            />
            <TabButton
              active={activeTab === "shortcuts"}
              onClick={() => setActiveTab("shortcuts")}
              icon={<Keyboard size={18} />}
              label="Raccourcis"
            />
            <TabButton
              active={activeTab === "commands"}
              onClick={() => setActiveTab("commands")}
              icon={<Zap size={18} />}
              label="Commandes"
            />
            <TabButton
              active={activeTab === "voice"}
              onClick={() => setActiveTab("voice")}
              icon={<Mic size={18} />}
              label="Voix"
            />
            <TabButton
              active={activeTab === "google"}
              onClick={() => setActiveTab("google")}
              icon={<Shield size={18} />}
              label="Bêta : Google"
            />
            <TabButton
              active={activeTab === "neural"}
              onClick={() => setActiveTab("neural")}
              icon={<Brain size={18} />}
              label="Neural Stats"
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "apps" && (
              <div className="space-y-4">
                {viewMode === "list" && (
                  <>
                    {/* Barre d'actions */}
                    <div className="flex gap-4 items-center mb-6">
                      <div className="flex-1 relative">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400"
                          size={20}
                        />
                        <input
                          type="text"
                          placeholder="Rechercher une application..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-400/50 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <button
                        onClick={() => {
                          resetForm();
                          setViewMode("add");
                        }}
                        className="px-6 py-3 bg-cyan-500/20 border border-cyan-400 rounded-lg text-cyan-300 hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
                      >
                        <Plus size={20} />
                        Ajouter
                      </button>
                    </div>

                    {/* Liste des applications */}
                    <div className="grid gap-3">
                      {filteredApps.map(([name, data]) => (
                        <motion.div
                          key={name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-slate-800/50 border border-cyan-400/20 rounded-lg p-4 hover:border-cyan-400/40 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-cyan-300">
                                {name}
                              </h3>
                              <p className="text-sm text-gray-400 mt-1">
                                {data.description}
                              </p>
                              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                <span>📁 {data.category}</span>
                                <span>📍 {data.path}</span>
                              </div>
                              {data.keywords && data.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {data.keywords.map((kw, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-xs"
                                    >
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => testLaunch(name)}
                                className="p-2 bg-green-500/20 border border-green-400/50 rounded hover:bg-green-500/30 text-green-400 transition-colors"
                                title="Tester"
                              >
                                <Play size={18} />
                              </button>
                              <button
                                onClick={() => startEdit(name)}
                                className="p-2 bg-blue-500/20 border border-blue-400/50 rounded hover:bg-blue-500/30 text-blue-400 transition-colors"
                                title="Modifier"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => deleteApp(name)}
                                className="p-2 bg-red-500/20 border border-red-400/50 rounded hover:bg-red-500/30 text-red-400 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {filteredApps.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <AlertCircle
                          size={48}
                          className="mx-auto mb-4 opacity-50"
                        />
                        <p>Aucune application trouvée</p>
                      </div>
                    )}
                  </>
                )}

                {(viewMode === "add" || viewMode === "edit") && (
                  <div className="max-w-2xl mx-auto">
                    <h3 className="text-xl font-bold text-cyan-300 mb-6">
                      {viewMode === "add"
                        ? "➕ Ajouter une application"
                        : "✏️ Modifier l'application"}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-cyan-400 mb-2">
                          Nom
                        </label>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Ex: chrome, vscode, bambu"
                          className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-400/30 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-cyan-400 mb-2">
                          Chemin
                        </label>
                        <input
                          type="text"
                          value={formPath}
                          onChange={(e) => setFormPath(e.target.value)}
                          placeholder="Ex: C:\\Program Files\\App\\app.exe"
                          className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-400/30 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-cyan-400 mb-2">
                          Catégorie
                        </label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                        >
                          <option value="app">Application</option>
                          <option value="browser">Navigateur</option>
                          <option value="ide">IDE</option>
                          <option value="media">Média</option>
                          <option value="gaming">Gaming</option>
                          <option value="creative">Créatif</option>
                          <option value="system">Système</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-cyan-400 mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          placeholder="Description courte"
                          className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-400/30 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-cyan-400 mb-2">
                          Mots-clés (séparés par virgules)
                        </label>
                        <input
                          type="text"
                          value={formKeywords}
                          onChange={(e) => setFormKeywords(e.target.value)}
                          placeholder="Ex: web, browser, internet"
                          className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-400/30 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-cyan-400 mb-2">
                          Alias (séparés par virgules, optionnel)
                        </label>
                        <input
                          type="text"
                          value={formAliases}
                          onChange={(e) => setFormAliases(e.target.value)}
                          placeholder="Ex: google chrome, chrome browser"
                          className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-400/30 rounded-lg text-white placeholder-cyan-400/30 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div className="flex gap-4 mt-6">
                        <button
                          onClick={saveApp}
                          disabled={!formName || !formPath}
                          className="flex-1 px-6 py-3 bg-cyan-500/20 border border-cyan-400 rounded-lg text-cyan-300 hover:bg-cyan-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save size={20} />
                          Sauvegarder
                        </button>
                        <button
                          onClick={() => {
                            resetForm();
                            setViewMode("list");
                          }}
                          className="px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-gray-300 hover:bg-slate-700 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "shortcuts" && <ShortcutsTab />}
            {activeTab === "commands" && <CommandsTab />}
            {activeTab === "voice" && <VoiceSettingsTab />}
            {activeTab === "google" && <GoogleTab />}
            {activeTab === "neural" && <NeuralTab tokenUsage={tokenUsage} />}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Composant bouton d'onglet
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-all ${
      active
        ? "bg-slate-800/80 border-t border-x border-cyan-400/30 text-cyan-300"
        : "bg-transparent text-gray-500 hover:text-cyan-400"
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

// ============================================================================
// SHORTCUTS TAB
// ============================================================================

const ShortcutsTab: React.FC = () => {
  const [shortcuts, setShortcuts] = useState<
    Record<string, { keys: string; description: string }>
  >({});
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formKeys, setFormKeys] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const loadShortcuts = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/shortcuts");
      const data = await res.json();
      setShortcuts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadShortcuts();
  }, []);

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

// ============================================================================
// COMMANDS TAB
// ============================================================================

const CommandsTab: React.FC = () => {
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

// ============================================================================
// GOOGLE TAB (Gmail & Calendrier)
// ============================================================================

const GoogleTab: React.FC = () => {
  const [config, setConfig] = useState({
    client_id: "",
    client_secret: "",
    redirect_uri: "http://localhost:3001/api/google/callback",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  // Tentative de récupération de l'URL d'auth au montage si les IDs sont là
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const response = await fetch(
          "http://localhost:3001/api/google/auth-url",
        );
        const data = await response.json();
        if (data.url) setAuthUrl(data.url);
      } catch (e) {
        // Pas encore configuré, c'est ok
      }
    };
    checkExistingAuth();
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("http://localhost:3001/api/google/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const data = await fetch(
          "http://localhost:3001/api/google/auth-url",
        ).then((r) => r.json());
        setAuthUrl(data.url);
      }
    } catch (error) {
      console.error("Erreur save config Google:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-cyan-300 flex items-center gap-2">
          <Shield size={22} /> Services Google (Gmail & Calendrier)
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Connectez J.A.R.V.I.S. à votre compte Google pour une gestion vocale
          de vos mails et rendez-vous.
        </p>
      </div>

      <div className="grid gap-4 bg-slate-800/30 p-6 rounded-xl border border-cyan-400/10">
        <div className="space-y-2">
          <label className="text-xs font-bold text-cyan-400/70 uppercase tracking-widest flex items-center gap-2">
            <Key size={12} /> Client ID
          </label>
          <input
            type="text"
            value={config.client_id}
            onChange={(e) =>
              setConfig({ ...config, client_id: e.target.value })
            }
            className="w-full bg-slate-900 border border-cyan-400/20 rounded-lg p-3 text-cyan-100 focus:outline-none focus:border-cyan-400/50 transition-all"
            placeholder="000000000000-xxx.apps.googleusercontent.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-cyan-400/70 uppercase tracking-widest flex items-center gap-2">
            <Shield size={12} /> Client Secret
          </label>
          <input
            type="password"
            value={config.client_secret}
            onChange={(e) =>
              setConfig({ ...config, client_secret: e.target.value })
            }
            className="w-full bg-slate-900 border border-cyan-400/20 rounded-lg p-3 text-cyan-100 focus:outline-none focus:border-cyan-400/50 transition-all"
            placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          />
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 w-full py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 rounded-lg text-cyan-300 font-bold transition-all disabled:opacity-50"
        >
          {isSaving ? "Traitement..." : "Enregistrer et Générer l'Auth"}
        </button>
      </div>

      {authUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-cyan-400/10 border border-cyan-400/30 rounded-xl"
        >
          <h4 className="text-cyan-300 font-bold mb-2 flex items-center gap-2">
            <Shield size={18} /> Étape 2 : Autorisation
          </h4>
          <p className="text-sm text-cyan-100/70 mb-4">
            Cliquez sur le bouton ci-dessous pour autoriser J.A.R.V.I.S. sur
            votre compte Google.
          </p>
          <a
            href={authUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2 bg-cyan-400 text-slate-900 rounded-lg font-bold hover:bg-cyan-300 transition-colors"
          >
            Se connecter avec Google
          </a>
        </motion.div>
      )}

      <div className="bg-slate-800/50 p-4 rounded-lg border border-yellow-500/20">
        <div className="flex gap-3">
          <Zap className="text-yellow-500 shrink-0" size={20} />
          <div className="text-xs text-gray-400 leading-relaxed">
            <p className="font-bold text-yellow-500/80 mb-1 uppercase">
              Note de Sécurité
            </p>
            Vos identifiants sont stockés localement sur votre machine.
            J.A.R.V.I.S. utilise un proxy backend pour ne jamais exposer vos
            secrets au navigateur. Assurez-vous d'avoir configuré le{" "}
            <b>Redirect URI</b> sur{" "}
            <code className="text-cyan-400">
              http://localhost:3001/api/google/callback
            </code>{" "}
            dans votre console Google Cloud.
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// NEURAL TAB
// ============================================================================

const NeuralTab: React.FC<{
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    candidatesTokens: number;
  };
}> = ({ tokenUsage }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-cyan-400/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-cyan-300 mb-4 flex items-center gap-2">
          <Brain className="text-cyan-400" />
          Activité Neuronale (Gemini 2.0)
        </h3>

        {!tokenUsage ? (
          <div className="text-center py-8 text-cyan-500/50 italic">
            Aucune donnée de session disponible.
            <br />
            Lancez une commande pour voir les métriques.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/40 p-4 rounded-lg border border-cyan-500/10">
              <div className="text-xs uppercase text-cyan-500 mb-1">
                Total Tokens
              </div>
              <div className="text-3xl font-bold text-cyan-300">
                {tokenUsage.totalTokens.toLocaleString()}
              </div>
            </div>
            <div className="bg-black/40 p-4 rounded-lg border border-cyan-500/10">
              <div className="text-xs uppercase text-gray-500 mb-1">
                Prompt (Input)
              </div>
              <div className="text-2xl font-bold text-gray-300">
                {tokenUsage.promptTokens.toLocaleString()}
              </div>
            </div>
            <div className="bg-black/40 p-4 rounded-lg border border-cyan-500/10">
              <div className="text-xs uppercase text-purple-400 mb-1">
                Response (Output)
              </div>
              <div className="text-2xl font-bold text-purple-300">
                {tokenUsage.candidatesTokens.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-800/30 border border-cyan-400/10 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-cyan-200 mb-2">
          À propos des Tokens
        </h4>
        <p className="text-sm text-gray-400 leading-relaxed">
          Les tokens sont les unités de base que l'IA utilise pour traiter
          l'information. 1000 tokens correspondent environ à 750 mots. Le modèle
          Gemini 2.0 Flash est optimisé pour la rapidité et l'efficacité à
          faible coût.
        </p>
      </div>
    </div>
  );
};
