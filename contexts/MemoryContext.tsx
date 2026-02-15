import React, { createContext, useContext, useState, useEffect } from "react";

// Types
interface MemoryFile {
  path: string;
  name: string;
  preview: string;
}

interface IndexingStatus {
  isIndexing: boolean;
  lastIndexedPath: string | null;
  lastIndexedCount: number;
}

interface MemoryContextType {
  status: IndexingStatus;
  searchResults: MemoryFile[];
  searchMemory: (query: string) => Promise<void>;
  scanDirectory: (path: string) => Promise<void>;
  clearResults: () => void;
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

export const MemoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState<IndexingStatus>({
    isIndexing: false,
    lastIndexedPath: null,
    lastIndexedCount: 0,
  });

  const [searchResults, setSearchResults] = useState<MemoryFile[]>([]);

  // 1. Scanner un dossier
  const scanDirectory = async (path: string) => {
    setStatus((prev) => ({ ...prev, isIndexing: true }));
    try {
      const response = await fetch("http://localhost:3001/api/memory/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) throw new Error("Scan failed");

      const data = await response.json();

      setStatus({
        isIndexing: false,
        lastIndexedPath: path,
        lastIndexedCount: data.count,
      });
    } catch (error) {
      console.error("Memory scan error:", error);
      setStatus((prev) => ({ ...prev, isIndexing: false }));
    }
  };

  // 2. Rechercher
  const searchMemory = async (query: string) => {
    if (!query || query.length < 2) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/memory/search?q=${encodeURIComponent(query)}`,
      );
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Memory search error:", error);
      setSearchResults([]);
    }
  };

  const clearResults = () => setSearchResults([]);

  return (
    <MemoryContext.Provider
      value={{
        status,
        searchResults,
        searchMemory,
        scanDirectory,
        clearResults,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
};

export const useMemory = () => {
  const context = useContext(MemoryContext);
  if (!context)
    throw new Error("useMemory must be used within a MemoryProvider");
  return context;
};
