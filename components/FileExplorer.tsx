/**
 * FileExplorer - Explorateur de fichiers visuel
 * 
 * Interface moderne pour naviguer dans le système de fichiers.
 * Utilise l'API backend pour lister, rechercher et ouvrir des fichiers.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Folder,
  File,
  Search,
  Home,
  ChevronRight,
  ArrowLeft,
  FileText,
  FileImage,
  FileCode,
  FileVideo,
  FileAudio,
  FolderOpen,
  Loader,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  sizeFormatted: string;
  extension: string;
  type: string;
  modified: string;
}

interface FileExplorerProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE = "http://localhost:3001";

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const FileExplorer: React.FC<FileExplorerProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentPath, setCurrentPath] = useState<string>("");
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FileItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  /**
   * Charge le contenu d'un répertoire
   */
  const loadDirectory = async (path?: string) => {
    setLoading(true);
    try {
      const url = path
        ? `${API_BASE}/api/files/list?path=${encodeURIComponent(path)}`
        : `${API_BASE}/api/files/list`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setCurrentPath(data.data.path);
        setItems(data.data.items);
      }
    } catch (error) {
      console.error("Erreur chargement répertoire:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Recherche des fichiers
   */
  const searchFiles = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/files/search?path=${encodeURIComponent(currentPath)}&query=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error("Erreur recherche:", error);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Charge les dossiers d'accès rapide au démarrage
   */
  const [quickFolders, setQuickFolders] = useState<any[]>([]);

  useEffect(() => {
    // Charger les dossiers favoris
    const loadQuickAccess = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/files/quick-access`);
        const data = await response.json();
        if (data.success) {
          setQuickFolders(data.data);
        }
      } catch (error) {
        console.error("Erreur chargement quick access:", error);
      }
    };

    if (isOpen) {
      loadQuickAccess();
    }
  }, [isOpen]);

  /**
   * Charge le répertoire utilisateur au premier clic sur un bouton
   */
  const handleQuickFolderClick = (folderPath: string) => {
    navigateToFolder(folderPath);
  };

  /**
   * Navigation vers un dossier
   */
  const navigateToFolder = (path: string) => {
    loadDirectory(path);
    setSearchQuery("");
    setSearchResults([]);
  };

  /**
   * Navigation vers le parent
   */
  const navigateUp = () => {
    if (currentPath) {
      const parent = currentPath.split("\\").slice(0, -1).join("\\");
      loadDirectory(parent || "C:\\");
    }
  };

  /**
   * Icône selon le type de fichier
   */
  const getFileIcon = (item: FileItem) => {
    if (item.isDirectory) return <Folder size={20} className="text-cyan-400" />;

    switch (item.type) {
      case "image":
        return <FileImage size={20} className="text-green-400" />;
      case "video":
        return <FileVideo size={20} className="text-purple-400" />;
      case "audio":
        return <FileAudio size={20} className="text-pink-400" />;
      case "code":
        return <FileCode size={20} className="text-blue-400" />;
      case "text":
        return <FileText size={20} className="text-gray-400" />;
      default:
        return <File size={20} className="text-gray-500" />;
    }
  };

  /**
   * Gère le clic sur un élément
   */
  const handleItemClick = (item: FileItem) => {
    if (item.isDirectory) {
      navigateToFolder(item.path);
    } else {
      // Ouvrir le fichier (via backend)
      window.open(`file:///${item.path}`, "_blank");
    }
  };

  if (!isOpen) return null;

  const displayItems = searchResults.length > 0 ? searchResults : items;
  const showQuickAccess = !currentPath && quickFolders.length > 0;

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
          className="bg-slate-900/95 backdrop-blur-xl border border-cyan-400/30 rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col shadow-[0_0_50px_rgba(0,229,255,0.3)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* === HEADER === */}
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

          {/* === BARRE DE NAVIGATION === */}
          <div className="p-4 border-b border-cyan-400/10 bg-slate-800/50">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={navigateUp}
                disabled={!currentPath}
                className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-cyan-400"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                onClick={() => loadDirectory()}
                className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors text-cyan-400"
              >
                <Home size={20} />
              </button>
              <div className="flex-1 bg-black/40 rounded-lg px-4 py-2 text-sm text-gray-300 font-mono border border-cyan-500/20">
                {currentPath || "Chargement..."}
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && searchFiles()}
                  placeholder="Rechercher des fichiers..."
                  className="w-full bg-black/40 border border-cyan-500/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                />
                <Search
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/50"
                  size={18}
                />
              </div>
              <button
                onClick={searchFiles}
                disabled={!searchQuery.trim() || isSearching}
                className="px-6 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 rounded-lg text-cyan-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? <Loader className="animate-spin" size={18} /> : "Rechercher"}
              </button>
            </div>
          </div>

          {/* === LISTE DES FICHIERS === */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader className="animate-spin text-cyan-400" size={48} />
              </div>
            ) : showQuickAccess ? (
              // Afficher les dossiers favoris à l'ouverture
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-full mb-4">
                  <h3 className="text-xl font-bold text-cyan-300 mb-2">
                    📁 Accès Rapide
                  </h3>
                  <p className="text-sm text-gray-400">
                    Sélectionnez un dossier pour commencer
                  </p>
                </div>
                {quickFolders.map((folder, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleQuickFolderClick(folder.path)}
                    className="flex flex-col items-center gap-3 p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 hover:border-cyan-400 hover:from-cyan-500/20 hover:to-blue-500/20 transition-all group cursor-pointer"
                  >
                    <FolderOpen className="text-cyan-400 group-hover:text-cyan-300" size={48} />
                    <span className="text-sm font-semibold text-white group-hover:text-cyan-300 text-center">
                      {folder.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            ) : displayItems.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                {searchResults.length === 0 && searchQuery
                  ? "Aucun résultat trouvé"
                  : "Aucun fichier"}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {displayItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => handleItemClick(item)}
                    className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all group ${
                      item.isDirectory
                        ? "hover:bg-cyan-500/10 border border-transparent hover:border-cyan-400/30"
                        : "hover:bg-slate-800/50 border border-transparent hover:border-gray-600"
                    }`}
                  >
                    {getFileIcon(item)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
                        {item.name}
                      </div>
                      {!item.isDirectory && (
                        <div className="text-xs text-gray-500">
                          {item.sizeFormatted} • {new Date(item.modified).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {item.isDirectory && (
                      <ChevronRight className="text-cyan-400/50 group-hover:text-cyan-400 transition-colors" size={20} />
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* === FOOTER === */}
          <div className="p-4 border-t border-cyan-400/10 bg-slate-800/50 flex items-center justify-between text-sm text-gray-400">
            <div>{displayItems.length} élément{displayItems.length > 1 ? "s" : ""}</div>
            <div className="flex gap-4">
              <span>
                {displayItems.filter((i) => i.isDirectory).length} dossier{displayItems.filter((i) => i.isDirectory).length > 1 ? "s" : ""}
              </span>
              <span>
                {displayItems.filter((i) => !i.isDirectory).length} fichier{displayItems.filter((i) => !i.isDirectory).length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
