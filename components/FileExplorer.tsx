/**
 * FileExplorer - Explorateur de fichiers visuel
 *
 * Interface moderne pour naviguer dans le système de fichiers.
 * Utilise l'API backend pour lister, rechercher et ouvrir des fichiers.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Composants extraits
import { Header } from "./FileExplorer/Header";
import { NavBar } from "./FileExplorer/NavBar";
import { FileList } from "./FileExplorer/FileList";
import { QuickAccess } from "./FileExplorer/QuickAccess";
import { Footer } from "./FileExplorer/Footer";
import { FileItem } from "./FileExplorer/types";

// Types locaux pour Quick Access
interface QuickFolder {
  name: string;
  path: string;
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
  const [quickFolders, setQuickFolders] = useState<QuickFolder[]>([]);

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
        `${API_BASE}/api/files/search?path=${encodeURIComponent(currentPath)}&query=${encodeURIComponent(searchQuery)}`,
      );
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error("Erreur recherche:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Charge les dossiers d'accès rapide au démarrage
   */
  useEffect(() => {
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
   * Navigation
   */
  const handleQuickFolderClick = (folderPath: string) => {
    loadDirectory(folderPath);
    setSearchQuery("");
    setSearchResults([]);
  };

  const navigateUp = () => {
    if (currentPath) {
      const parent = currentPath.split("\\").slice(0, -1).join("\\");
      loadDirectory(parent || "C:\\");
    }
  };

  const handleItemClick = (item: FileItem) => {
    if (item.isDirectory) {
      loadDirectory(item.path);
      setSearchQuery("");
      setSearchResults([]);
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
          <Header onClose={onClose} />

          {/* === NAVBAR === */}
          <NavBar
            currentPath={currentPath}
            searchQuery={searchQuery}
            isSearching={isSearching}
            onNavigateUp={navigateUp}
            onNavigateHome={() => loadDirectory()}
            onSearchChange={setSearchQuery}
            onSearch={searchFiles}
          />

          {/* === CONTENU === */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {showQuickAccess ? (
              <QuickAccess
                folders={quickFolders}
                onFolderClick={handleQuickFolderClick}
              />
            ) : (
              <FileList
                items={displayItems}
                loading={loading}
                onItemClick={handleItemClick}
                emptyMessage={
                  searchResults.length === 0 && searchQuery
                    ? "Aucun résultat trouvé"
                    : "Aucun fichier"
                }
              />
            )}
          </div>

          {/* === FOOTER === */}
          <Footer items={displayItems} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
