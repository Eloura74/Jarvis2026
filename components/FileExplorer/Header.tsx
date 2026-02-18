import React from "react";
import { FolderOpen, X } from "lucide-react";

interface HeaderProps {
  onClose: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onClose }) => {
  return (
    <div className="flex items-center justify-between p-6 border-b border-cyan-400/20">
      <div className="flex items-center gap-4">
        <FolderOpen className="text-cyan-400" size={28} />
        <h2 className="text-2xl font-bold text-cyan-300 tracking-wider">
          EXPLORATEUR DE FICHIERS
        </h2>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors text-cyan-400"
      >
        <X size={24} />
      </button>
    </div>
  );
};
