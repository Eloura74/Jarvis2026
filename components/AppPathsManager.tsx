/**
 * AppPathsManager - Interface de gestion des chemins d'applications
 * Permet de configurer graphiquement les chemins des applications
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FolderOpen,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Search,
  Edit2,
  Check,
} from 'lucide-react';
import { useAppPaths, AppPath } from '../hooks/useAppPaths';

interface AppPathsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppPathsManager: React.FC<AppPathsManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    appPaths,
    addApp,
    updateApp,
    removeApp,
    resetToDefaults,
    exportPaths,
    importPaths,
  } = useAppPaths();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newApp, setNewApp] = useState<AppPath | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Filtrage des applications
  const filteredApps = appPaths.filter(app => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.aliases.some(alias =>
        alias.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesCategory =
      filterCategory === 'all' || app.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Catégories disponibles
  const categories = [
    { value: 'all', label: 'Toutes', icon: '📦' },
    { value: 'browser', label: 'Navigateurs', icon: '🌐' },
    { value: 'ide', label: 'Éditeurs', icon: '💻' },
    { value: 'media', label: 'Média', icon: '🎵' },
    { value: 'productivity', label: 'Productivité', icon: '📊' },
    { value: 'system', label: 'Système', icon: '⚙️' },
    { value: 'other', label: 'Autres', icon: '📁' },
  ];

  // Sauvegarder modification
  const handleSaveEdit = (index: number, updatedApp: AppPath) => {
    updateApp(index, updatedApp);
    setEditingIndex(null);
  };

  // Ajouter nouvelle application
  const handleAddNew = () => {
    if (newApp) {
      addApp(newApp);
      setNewApp(null);
    }
  };

  // Exporter configuration
  const handleExport = () => {
    const json = exportPaths();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jarvis_app_paths.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Importer configuration
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result as string;
        if (importPaths(content)) {
          alert('✅ Configuration importée avec succès !');
        } else {
          alert('❌ Erreur lors de l\'import');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Panel Modal */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 h-full w-full max-w-4xl bg-black/95 backdrop-blur-lg border-l border-cyan-500/30 z-[101] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-6 h-6 text-cyan-400" />
                <h2 className="text-xl font-mono text-cyan-400 tracking-wider">
                  GESTION DES APPLICATIONS
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-cyan-400" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-cyan-500/20 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                <input
                  type="text"
                  placeholder="Rechercher une application..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/50 border border-cyan-500/30 rounded text-cyan-50 font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Filters & Actions */}
              <div className="flex items-center justify-between gap-4">
                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap">
                  {categories.map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => setFilterCategory(cat.value)}
                      className={`px-3 py-1 rounded border text-xs font-mono transition-all ${
                        filterCategory === cat.value
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                          : 'border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10'
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setNewApp({
                        name: '',
                        path: '',
                        aliases: [],
                        category: 'other',
                        icon: '📦',
                      })
                    }
                    className="px-3 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded hover:bg-green-500/30 transition-all text-xs font-mono flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    AJOUTER
                  </button>
                  <button
                    onClick={handleExport}
                    className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded hover:bg-blue-500/30 transition-all text-xs font-mono flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    EXPORTER
                  </button>
                  <label className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded hover:bg-purple-500/30 transition-all text-xs font-mono flex items-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    IMPORTER
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          'Réinitialiser toutes les applications aux valeurs par défaut ?'
                        )
                      ) {
                        resetToDefaults();
                      }
                    }}
                    className="px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded hover:bg-red-500/30 transition-all text-xs font-mono flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    RESET
                  </button>
                </div>
              </div>
            </div>

            {/* Liste Applications */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {/* Formulaire Nouvelle App */}
              {newApp && (
                <AppForm
                  app={newApp}
                  onSave={handleAddNew}
                  onCancel={() => setNewApp(null)}
                  onChange={setNewApp}
                  isNew
                />
              )}

              {/* Applications Existantes */}
              {filteredApps.map((app) => {
                const realIndex = appPaths.indexOf(app);
                return editingIndex === realIndex ? (
                  <AppForm
                    key={realIndex}
                    app={app}
                    onSave={updatedApp =>
                      handleSaveEdit(realIndex, updatedApp)
                    }
                    onCancel={() => setEditingIndex(null)}
                    onChange={updatedApp =>
                      handleSaveEdit(realIndex, updatedApp)
                    }
                  />
                ) : (
                  <AppCard
                    key={realIndex}
                    app={app}
                    onEdit={() => setEditingIndex(realIndex)}
                    onDelete={() => {
                      if (
                        confirm(`Supprimer "${app.name}" ?`)
                      ) {
                        removeApp(realIndex);
                      }
                    }}
                  />
                );
              })}

              {filteredApps.length === 0 && (
                <div className="text-center py-12 text-cyan-500/40 font-mono text-sm">
                  Aucune application trouvée
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-cyan-500/20">
              <p className="text-xs text-cyan-500/40 font-mono text-center">
                {appPaths.length} application(s) configurée(s)
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Composant Carte Application
const AppCard: React.FC<{
  app: AppPath;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ app, onEdit, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg hover:border-cyan-400/40 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{app.icon}</span>
            <h3 className="text-cyan-300 font-mono font-bold">{app.name}</h3>
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded font-mono">
              {app.category}
            </span>
          </div>
          <p className="text-cyan-500/60 font-mono text-xs mb-2 break-all">
            {app.path}
          </p>
          <div className="flex flex-wrap gap-1">
            {app.aliases.map((alias, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400/60 text-xs rounded font-mono"
              >
                {alias}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-cyan-500/20 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4 text-cyan-400" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-500/20 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Composant Formulaire Application
const AppForm: React.FC<{
  app: AppPath;
  onSave: (app: AppPath) => void;
  onCancel: () => void;
  onChange: (app: AppPath) => void;
  isNew?: boolean;
}> = ({ app, onSave, onCancel, onChange, isNew }) => {
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
          {isNew ? '➕ Nouvelle Application' : '✏️ Édition'}
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
            onChange={e => handleChange('name', e.target.value)}
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
            onChange={e => handleChange('icon', e.target.value)}
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
            onChange={e => handleChange('path', e.target.value)}
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
            onChange={e =>
              handleChange(
                'category',
                e.target.value as AppPath['category']
              )
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
            value={localApp.aliases.join(', ')}
            onChange={e =>
              handleChange(
                'aliases',
                e.target.value.split(',').map(a => a.trim())
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
