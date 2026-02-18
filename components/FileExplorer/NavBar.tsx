import React from "react";
import { ArrowLeft, Home, Search, Loader } from "lucide-react";

interface NavBarProps {
  currentPath: string;
  searchQuery: string;
  isSearching: boolean;
  onNavigateUp: () => void;
  onNavigateHome: () => void;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  currentPath,
  searchQuery,
  isSearching,
  onNavigateUp,
  onNavigateHome,
  onSearchChange,
  onSearch,
}) => {
  return (
    <div className="p-4 border-b border-cyan-400/10 bg-slate-800/50">
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={onNavigateUp}
          disabled={!currentPath}
          className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-cyan-400"
          title="Dossier parent"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={onNavigateHome}
          className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors text-cyan-400"
          title="Racine"
        >
          <Home size={20} />
        </button>
        <div className="flex-1 bg-black/40 rounded-lg px-4 py-2 text-sm text-gray-300 font-mono border border-cyan-500/20 truncate">
          {currentPath || "Chargement..."}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && onSearch()}
            placeholder="Rechercher des fichiers..."
            className="w-full bg-black/40 border border-cyan-500/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
          />
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/50"
            size={18}
          />
        </div>
        <button
          onClick={onSearch}
          disabled={!searchQuery.trim() || isSearching}
          className="px-6 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 rounded-lg text-cyan-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center min-w-[120px]"
        >
          {isSearching ? (
            <>
              <Loader className="animate-spin" size={18} /> Recherche...
            </>
          ) : (
            "Rechercher"
          )}
        </button>
      </div>
    </div>
  );
};
