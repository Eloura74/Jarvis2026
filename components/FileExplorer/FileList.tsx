import React from "react";
import { motion } from "framer-motion";
import { Loader, ChevronRight } from "lucide-react";
import { FileItem } from "./types";
import { FileIcon } from "./FileIcon"; // Modifié l'import pour pointer vers le fichier local

interface FileListProps {
  items: FileItem[];
  loading: boolean;
  onItemClick: (item: FileItem) => void;
  emptyMessage?: string;
}

export const FileList: React.FC<FileListProps> = ({
  items,
  loading,
  onItemClick,
  emptyMessage = "Aucun fichier",
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="animate-spin text-cyan-400" size={48} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {items.map((item, index) => (
        <motion.div
          key={`${item.path}-${index}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.02 }}
          onClick={() => onItemClick(item)}
          className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all group ${
            item.isDirectory
              ? "hover:bg-cyan-500/10 border border-transparent hover:border-cyan-400/30"
              : "hover:bg-slate-800/50 border border-transparent hover:border-gray-600"
          }`}
        >
          <FileIcon item={item} />

          <div className="flex-1 min-w-0">
            <div className="font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
              {item.name}
            </div>
            {!item.isDirectory && (
              <div className="text-xs text-gray-500">
                {item.sizeFormatted} •{" "}
                {new Date(item.modified).toLocaleDateString()}
              </div>
            )}
          </div>

          {item.isDirectory && (
            <ChevronRight
              className="text-cyan-400/50 group-hover:text-cyan-400 transition-colors"
              size={20}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};
