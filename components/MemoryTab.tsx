import React, { useState } from "react";
import { useMemory } from "../hooks/useMemory";
import {
  FolderSearch,
  HardDrive,
  RefreshCw,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";

export const MemoryTab: React.FC = () => {
  const { status, scanDirectory, searchResults, searchMemory } = useMemory();
  const [pathInput, setPathInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Simulation de liste de dossiers surveillés (à persister plus tard)
  const [watchedPaths, setWatchedPaths] = useState<string[]>([]);

  const handlescan = async () => {
    if (!pathInput) return;
    await scanDirectory(pathInput);
    if (!watchedPaths.includes(pathInput)) {
      setWatchedPaths([...watchedPaths, pathInput]);
    }
    setPathInput("");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchMemory(searchQuery);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* HEADER STATS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-4 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-cyan-500/20 rounded-lg">
            <HardDrive className="text-cyan-400" size={24} />
          </div>
          <div>
            <div className="text-gray-400 text-xs uppercase tracking-wider">
              État Mémoire
            </div>
            <div className="text-xl font-bold flex items-center gap-2">
              {status.isIndexing ? (
                <span className="text-yellow-400 flex items-center gap-2">
                  <RefreshCw className="animate-spin" size={16} /> Indexation...
                </span>
              ) : (
                <span className="text-green-400">Prêt</span>
              )}
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center space-x-4">
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <FolderSearch className="text-purple-400" size={24} />
          </div>
          <div>
            <div className="text-gray-400 text-xs uppercase tracking-wider">
              Dernier Scan
            </div>
            <div className="text-lg font-bold">
              {status.lastIndexedCount > 0
                ? `${status.lastIndexedCount} fichiers`
                : "Aucun"}
            </div>
            <div
              className="text-xs text-gray-500 truncate max-w-[150px]"
              title={status.lastIndexedPath || ""}
            >
              {status.lastIndexedPath || "-"}
            </div>
          </div>
        </div>
      </div>

      {/* ADD FOLDER */}
      <div className="glass-panel p-4 rounded-xl space-y-3">
        <h3 className="text-lg font-medium text-cyan-400 flex items-center gap-2">
          <Plus size={18} /> Ajouter une source de connaissances
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={pathInput}
            onChange={(e) => setPathInput(e.target.value)}
            placeholder="Chemin absolu (ex: C:\Users\Moi\Documents\ProjetX)"
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={handlescan}
            disabled={status.isIndexing || !pathInput}
            className="btn-premium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status.isIndexing ? "Scan..." : "Indexer"}
          </button>
        </div>

        {/* LISTE DES DOSSIERS (Mock pour l'instant) */}
        <div className="space-y-2 mt-4">
          {watchedPaths.map((p, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-white/5 px-3 py-2 rounded text-sm group"
            >
              <span className="truncate text-gray-300">{p}</span>
              <button
                onClick={() =>
                  setWatchedPaths(watchedPaths.filter((wp) => wp !== p))
                }
                className="text-gray-500 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {watchedPaths.length === 0 && (
            <div className="text-center text-gray-600 text-xs py-2 italic">
              Aucun dossier surveillé
            </div>
          )}
        </div>
      </div>

      {/* TEST SEARCH */}
      <div className="glass-panel p-4 rounded-xl flex-1 flex flex-col min-h-0">
        <h3 className="text-lg font-medium text-purple-400 flex items-center gap-2 mb-3">
          <Search size={18} /> Tester la mémoire
        </h3>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans les fichiers indexés..."
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50"
          />
        </form>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {searchResults.map((res, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={i}
              className="bg-white/5 p-3 rounded hover:bg-white/10 transition-colors border-l-2 border-purple-500/50"
            >
              <div className="text-xs text-purple-300 font-mono mb-1 truncate">
                {res.name}
              </div>
              <div className="text-sm text-gray-300 line-clamp-2">
                {res.preview}
              </div>
              <div className="text-[10px] text-gray-600 mt-2 truncate">
                {res.path}
              </div>
            </motion.div>
          ))}
          {searchResults.length === 0 && searchQuery && (
            <div className="text-center text-gray-500 py-10">
              Aucun résultat trouvé dans la mémoire.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
