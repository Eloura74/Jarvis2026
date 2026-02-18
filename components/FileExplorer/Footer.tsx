import React from "react";
import { FileItem } from "./types";

interface FooterProps {
  items: FileItem[];
}

export const Footer: React.FC<FooterProps> = ({ items }) => {
  const fileCount = items.length;
  const dirCount = items.filter((i) => i.isDirectory).length;
  const simpleFileCount = items.filter((i) => !i.isDirectory).length;

  return (
    <div className="p-4 border-t border-cyan-400/10 bg-slate-800/50 flex items-center justify-between text-sm text-gray-400">
      <div>
        {fileCount} élément{fileCount > 1 ? "s" : ""}
      </div>
      <div className="flex gap-4">
        <span>
          {dirCount} dossier{dirCount > 1 ? "s" : ""}
        </span>
        <span>
          {simpleFileCount} fichier{simpleFileCount > 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
};
