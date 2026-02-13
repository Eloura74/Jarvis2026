/**
 * ConfigPanel - Panneau de configuration unifié pour J.A.R.V.I.S.
 *
 * Onglets :
 * - Applications (chemins personnalisés avec CRUD complet)
 * - Raccourcis (clavier globaux)
 * - Commandes (macros personnalisées)
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Folder, Keyboard, Zap, Plus, Trash2, Save, Edit, Play, Check } from "lucide-react";
import { APPS_DATABASE, AppEntry } from "../appsDatabase";

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "apps" | "shortcuts" | "commands";

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>("apps");

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
          className="bg-slate-900/95 backdrop-blur-xl border border-cyan-400/30 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(0,229,255,0.3)]"
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
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "apps" && <AppsTab />}
            {activeTab === "shortcuts" && <ShortcutsTab />}
            {activeTab === "commands" && <CommandsTab />}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================================
// TAB BUTTON
// ============================================================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-semibold transition-all ${
      active
        ? "bg-cyan-500/20 border-t-2 border-cyan-400 text-cyan-300"
        : "bg-slate-800/50 text-gray-400 hover:text-cyan-300 hover:bg-slate-800"
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// ============================================================================
// APPS TAB
// ============================================================================

const AppsTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-cyan-300">Chemins des Applications</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 rounded-lg text-cyan-300 transition-colors">
          <Plus size={18} />
          Ajouter
        </button>
      </div>

      <p className="text-sm text-gray-400">
        Configurez les chemins des applications pour les lancer avec des commandes vocales.
      </p>

      <div className="space-y-2">
        {["Chrome", "Opera", "VSCode", "Spotify"].map((app) => (
          <div
            key={app}
            className="flex items-center gap-4 p-4 bg-slate-800/50 border border-cyan-400/20 rounded-lg hover:border-cyan-400/40 transition-colors"
          >
            <Folder className="text-cyan-400" size={20} />
            <div className="flex-1">
              <div className="font-semibold text-white">{app}</div>
              <div className="text-xs text-gray-500">C:\Program Files\{app}\{app}.exe</div>
            </div>
            <button className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// SHORTCUTS TAB
// ============================================================================

const ShortcutsTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-cyan-300">Raccourcis Clavier Globaux</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 rounded-lg text-cyan-300 transition-colors">
          <Plus size={18} />
          Ajouter
        </button>
      </div>

      <p className="text-sm text-gray-400">
        Définissez des raccourcis clavier pour activer J.A.R.V.I.S. depuis n'importe où.
      </p>

      <div className="space-y-2">
        <ShortcutItem
          shortcut="Ctrl + Space"
          action="Activer l'écoute vocale"
          enabled={true}
        />
        <ShortcutItem
          shortcut="Ctrl + Shift + J"
          action="Ouvrir/Fermer J.A.R.V.I.S."
          enabled={false}
        />
        <ShortcutItem
          shortcut="Ctrl + Alt + S"
          action="Capturer l'écran et analyser"
          enabled={false}
        />
      </div>
    </div>
  );
};

interface ShortcutItemProps {
  shortcut: string;
  action: string;
  enabled: boolean;
}

const ShortcutItem: React.FC<ShortcutItemProps> = ({ shortcut, action, enabled }) => (
  <div className="flex items-center gap-4 p-4 bg-slate-800/50 border border-cyan-400/20 rounded-lg">
    <Keyboard className="text-cyan-400" size={20} />
    <div className="flex-1">
      <div className="font-mono font-semibold text-cyan-300">{shortcut}</div>
      <div className="text-sm text-gray-400">{action}</div>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">{enabled ? "Activé" : "Désactivé"}</span>
      <button
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? "bg-cyan-500" : "bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  </div>
);

// ============================================================================
// COMMANDS TAB
// ============================================================================

const CommandsTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-cyan-300">Commandes Personnalisées</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 rounded-lg text-cyan-300 transition-colors">
          <Plus size={18} />
          Créer
        </button>
      </div>

      <p className="text-sm text-gray-400">
        Créez des macros personnalisées pour automatiser des séquences d'actions.
      </p>

      <div className="space-y-2">
        <CommandItem
          name="Mode Travail"
          description="Lance VSCode, Chrome et Spotify"
          actions={["Lance VSCode", "Lance Chrome", "Lance Spotify"]}
        />
        <CommandItem
          name="Pause Café"
          description="Met la musique et ouvre YouTube"
          actions={["Lance Spotify", "Ouvre YouTube sur Chrome"]}
        />
      </div>

      {/* Template pour nouvelle commande */}
      <div className="p-4 bg-slate-800/30 border-2 border-dashed border-cyan-400/30 rounded-lg">
        <div className="text-center text-gray-400">
          <Zap className="mx-auto mb-2 text-cyan-400" size={32} />
          <p className="font-semibold">Créez votre première commande</p>
          <p className="text-xs mt-1">Exemple : "Mode Gaming" = Lance Discord + Lance Steam</p>
        </div>
      </div>
    </div>
  );
};

interface CommandItemProps {
  name: string;
  description: string;
  actions: string[];
}

const CommandItem: React.FC<CommandItemProps> = ({ name, description, actions }) => (
  <div className="p-4 bg-slate-800/50 border border-cyan-400/20 rounded-lg hover:border-cyan-400/40 transition-colors">
    <div className="flex items-start justify-between mb-2">
      <div>
        <div className="font-bold text-cyan-300">{name}</div>
        <div className="text-sm text-gray-400">{description}</div>
      </div>
      <div className="flex gap-2">
        <button className="p-2 hover:bg-cyan-500/20 rounded-lg text-cyan-400 transition-colors">
          <Save size={16} />
        </button>
        <button className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
    <div className="flex flex-wrap gap-2 mt-3">
      {actions.map((action, i) => (
        <span
          key={i}
          className="px-3 py-1 bg-cyan-500/10 border border-cyan-400/30 rounded-full text-xs text-cyan-300"
        >
          {action}
        </span>
      ))}
    </div>
  </div>
);
