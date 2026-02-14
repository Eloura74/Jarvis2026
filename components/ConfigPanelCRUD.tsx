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
  X,
  Folder,
  Keyboard,
  Zap,
  Plus,
  Trash2,
  Save,
  Edit,
  Play,
  Check,
  Search,
  AlertCircle,
  Mic,
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
}

type TabType = "apps" | "shortcuts" | "commands" | "voice";
type ViewMode = "list" | "add" | "edit";

export const ConfigPanelCRUD: React.FC<ConfigPanelCRUDProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("apps");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [apps, setApps] = useState<Record<string, AppData>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [editingApp, setEditingApp] = useState<string | null>(null);

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

// Placeholder onglets
const ShortcutsTab = () => (
  <div className="text-center py-12 text-gray-500">
    <Keyboard size={48} className="mx-auto mb-4 opacity-50" />
    <p>Gestion des raccourcis clavier (à venir)</p>
  </div>
);

const CommandsTab = () => (
  <div className="text-center py-12 text-gray-500">
    <Zap size={48} className="mx-auto mb-4 opacity-50" />
    <p>Gestion des commandes personnalisées (à venir)</p>
  </div>
);
