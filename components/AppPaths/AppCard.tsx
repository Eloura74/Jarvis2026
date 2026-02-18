import React from "react";
import { motion } from "framer-motion";
import { Edit2, Trash2 } from "lucide-react";
import { AppPath } from "../../hooks/useAppPaths";

interface AppCardProps {
  app: AppPath;
  onEdit: () => void;
  onDelete: () => void;
}

export const AppCard: React.FC<AppCardProps> = ({ app, onEdit, onDelete }) => {
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
