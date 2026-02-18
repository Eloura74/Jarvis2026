import React from "react";
import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";

interface QuickAccessProps {
  folders: Array<{ name: string; path: string }>;
  onFolderClick: (path: string) => void;
}

export const QuickAccess: React.FC<QuickAccessProps> = ({
  folders,
  onFolderClick,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="col-span-full mb-4">
        <h3 className="text-xl font-bold text-cyan-300 mb-2">
          📁 Accès Rapide
        </h3>
        <p className="text-sm text-gray-400">
          Sélectionnez un dossier pour commencer
        </p>
      </div>
      {folders.map((folder, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onFolderClick(folder.path)}
          className="flex flex-col items-center gap-3 p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 hover:border-cyan-400 hover:from-cyan-500/20 hover:to-blue-500/20 transition-all group cursor-pointer"
        >
          <FolderOpen
            className="text-cyan-400 group-hover:text-cyan-300"
            size={48}
          />
          <span className="text-sm font-semibold text-white group-hover:text-cyan-300 text-center">
            {folder.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
};
