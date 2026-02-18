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

import { VoiceSettingsTab } from "./VoiceSettingsTab";
import { MemoryTab } from "./MemoryTab";
import { ConfigLocations } from "./ConfigLocations";

import { AppsTab } from "./ConfigPanel/Tabs/AppsTab";
import { ShortcutsTab } from "./ConfigPanel/Tabs/ShortcutsTab";
import { CommandsTab } from "./ConfigPanel/Tabs/CommandsTab";
import { GoogleTab } from "./ConfigPanel/Tabs/GoogleTab";
import { NeuralTab } from "./ConfigPanel/Tabs/NeuralTab";
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
  | "voice"
  | "google"
  | "neural"
  | "memory"
  | "navigation";

export const ConfigPanelCRUD: React.FC<ConfigPanelCRUDProps> = ({
  isOpen,
  onClose,
  tokenUsage,
}) => {
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
          className="bg-slate-900/95 backdrop-blur-xl border border-cyan-400/30 rounded-2xl w-full max-w-7xl h-[85vh] flex flex-row overflow-hidden shadow-[0_0_50px_rgba(0,229,255,0.3)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ================= SIDEBAR GAUCHE ================= */}
          <div className="w-72 bg-slate-900/80 border-r border-cyan-400/20 flex flex-col p-4 shrink-0">
            {/* Header Sidebar */}
            <div className="mb-8 px-2 pt-2">
              <h2 className="text-xl font-bold text-cyan-300 tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                CONFIGURATION
              </h2>
              <p className="text-xs text-cyan-500/60 uppercase tracking-widest mt-1 pl-4">
                J.A.R.V.I.S. SYSTEM
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
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
                label="Voix & Synthèse"
              />
              <TabButton
                active={activeTab === "google"}
                onClick={() => setActiveTab("google")}
                icon={<Shield size={18} />}
                label="Google Beta"
              />
              <TabButton
                active={activeTab === "navigation"}
                onClick={() => setActiveTab("navigation")}
                icon={<MapPin size={18} />}
                label="Navigation"
              />

              <div className="my-2 border-t border-cyan-500/10 mx-2" />

              <TabButton
                active={activeTab === "neural"}
                onClick={() => setActiveTab("neural")}
                icon={<Brain size={18} />}
                label="Neural Stats"
              />
              <TabButton
                active={activeTab === "memory"}
                onClick={() => setActiveTab("memory")}
                icon={<FolderSearch size={18} />}
                label="Mémoire (RAG)"
              />
            </div>

            {/* Version ou Info bas de page */}
            <div className="mt-4 pt-4 border-t border-cyan-500/10 text-center">
              <p className="text-[10px] text-cyan-500/30 font-mono">
                OMNI UI v2.4.0
              </p>
            </div>
          </div>

          {/* ================= CONTENU PRINCIPAL (DROITE) ================= */}
          <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-transparent to-cyan-900/5 relative">
            {/* Bouton Fermer (Absolu ou dans une TopBar) */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                className="p-2 bg-slate-800/50 hover:bg-red-500/20 border border-transparent hover:border-red-500/50 rounded-lg transition-all text-gray-400 hover:text-red-400 shadow-lg"
                title="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Zone de contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-8 pt-12 custom-scrollbar">
              {activeTab === "apps" && <AppsTab />}
              {activeTab === "shortcuts" && <ShortcutsTab />}
              {activeTab === "commands" && <CommandsTab />}
              {activeTab === "voice" && <VoiceSettingsTab />}
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
