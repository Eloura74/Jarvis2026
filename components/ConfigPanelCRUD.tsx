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

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  Keyboard,
  Zap,
  Shield,
  Brain,
  X,
  FolderSearch,
  MapPin,
  Mic,
} from "lucide-react";

import { MemoryTab } from "./MemoryTab";
import { ConfigLocations } from "./ConfigLocations";

import { AppsTab } from "./ConfigPanel/Tabs/AppsTab";
import { ShortcutsTab } from "./ConfigPanel/Tabs/ShortcutsTab";
import { CommandsTab } from "./ConfigPanel/Tabs/CommandsTab";
import { GoogleTab } from "./ConfigPanel/Tabs/GoogleTab";
import { NeuralTab } from "./ConfigPanel/Tabs/NeuralTab";
import { SettingsTab } from "./ConfigPanel/Tabs/SettingsTab";
import { TabButton } from "./ConfigPanel/UI/TabButton";

// Types
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
  | "settings"
  | "google"
  | "neural"
  | "memory"
  | "navigation";

const TAB_LABELS: Record<TabType, string> = {
  apps: "Applications",
  shortcuts: "Raccourcis",
  commands: "Commandes",
  settings: "Paramètres",
  google: "Google Beta",
  neural: "Neural Stats",
  memory: "Mémoire (RAG)",
  navigation: "Navigation",
};

export const ConfigPanelCRUD: React.FC<ConfigPanelCRUDProps> = ({
  isOpen,
  onClose,
  tokenUsage,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("apps");
  const activeLabel = TAB_LABELS[activeTab];

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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-slate-950/98 backdrop-blur-xl border border-cyan-400/20 rounded-2xl w-full max-w-7xl h-[88vh] flex flex-row overflow-hidden shadow-[0_0_60px_rgba(0,229,255,0.15),0_0_120px_rgba(0,229,255,0.05)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ================= SIDEBAR GAUCHE ================= */}
          <div className="w-64 bg-slate-900/60 border-r border-cyan-400/10 flex flex-col shrink-0">
            {/* Header Sidebar */}
            <div className="px-5 py-5 border-b border-cyan-400/10">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_6px_rgba(0,229,255,0.8)]" />
                <h2 className="text-sm font-bold text-cyan-300 tracking-[0.2em] uppercase">
                  Configuration
                </h2>
              </div>
              <p className="text-[10px] text-cyan-500/40 font-mono tracking-widest pl-4">
                J.A.R.V.I.S. SYSTEM v2.5
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-col gap-1 overflow-y-auto flex-1 p-3 custom-scrollbar">
              {/* Groupe principal */}
              <p className="text-[9px] text-slate-600 uppercase tracking-widest px-3 pt-1 pb-1 font-semibold">
                Gestion
              </p>
              <TabButton
                active={activeTab === "apps"}
                onClick={() => setActiveTab("apps")}
                icon={<Folder size={16} />}
                label="Applications"
              />
              <TabButton
                active={activeTab === "shortcuts"}
                onClick={() => setActiveTab("shortcuts")}
                icon={<Keyboard size={16} />}
                label="Raccourcis"
              />
              <TabButton
                active={activeTab === "commands"}
                onClick={() => setActiveTab("commands")}
                icon={<Zap size={16} />}
                label="Commandes"
              />

              <p className="text-[9px] text-slate-600 uppercase tracking-widest px-3 pt-3 pb-1 font-semibold">
                Paramètres
              </p>
              <TabButton
                active={activeTab === "settings"}
                onClick={() => setActiveTab("settings")}
                icon={<Mic size={16} />}
                label="Paramètres"
              />
              <TabButton
                active={activeTab === "navigation"}
                onClick={() => setActiveTab("navigation")}
                icon={<MapPin size={16} />}
                label="Navigation"
              />
              <TabButton
                active={activeTab === "google"}
                onClick={() => setActiveTab("google")}
                icon={<Shield size={16} />}
                label="Google Beta"
              />

              <p className="text-[9px] text-slate-600 uppercase tracking-widest px-3 pt-3 pb-1 font-semibold">
                Diagnostics
              </p>
              <TabButton
                active={activeTab === "neural"}
                onClick={() => setActiveTab("neural")}
                icon={<Brain size={16} />}
                label="Neural Stats"
              />
              <TabButton
                active={activeTab === "memory"}
                onClick={() => setActiveTab("memory")}
                icon={<FolderSearch size={16} />}
                label="Mémoire (RAG)"
              />
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-cyan-500/10">
              <p className="text-[9px] text-cyan-500/20 font-mono">
                OMNI UI v2.5.0
              </p>
            </div>
          </div>

          {/* ================= CONTENU PRINCIPAL (DROITE) ================= */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* TopBar avec titre de l'onglet actif + bouton fermer */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-cyan-400/10 bg-slate-900/30 shrink-0">
              <h1 className="text-lg font-bold text-slate-100 tracking-wide">
                {activeLabel}
              </h1>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Zone de contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {activeTab === "apps" && <AppsTab />}
              {activeTab === "shortcuts" && <ShortcutsTab />}
              {activeTab === "commands" && <CommandsTab />}
              {activeTab === "settings" && <SettingsTab />}
              {activeTab === "google" && <GoogleTab />}
              {activeTab === "neural" && <NeuralTab tokenUsage={tokenUsage} />}
              {activeTab === "memory" && <MemoryTab />}
              {activeTab === "navigation" && <ConfigLocations />}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
