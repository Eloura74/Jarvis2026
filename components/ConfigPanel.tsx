/**
 * ConfigPanel - Version obsolète (Préférer ConfigPanelCRUD.tsx)
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Folder, Keyboard, Zap } from "lucide-react";

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "apps" | "shortcuts" | "commands";

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  isOpen,
  onClose,
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
            {activeTab === "apps" && (
              <div className="text-cyan-300">
                Utilisez ConfigPanelCRUD pour gérer les applications.
              </div>
            )}
            {activeTab === "shortcuts" && (
              <div className="text-cyan-300">
                Raccourcis clavier (obsolète).
              </div>
            )}
            {activeTab === "commands" && (
              <div className="text-cyan-300">
                Commandes personnalisées (obsolète).
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
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
