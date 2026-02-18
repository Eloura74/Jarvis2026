import { createContext } from "react";

// Types
export interface MemoryFile {
  path: string;
  name: string;
  preview: string;
}

export interface IndexingStatus {
  isIndexing: boolean;
  lastIndexedPath: string | null;
  lastIndexedCount: number;
}

export interface MemoryContextType {
  status: IndexingStatus;
  searchResults: MemoryFile[];
  searchMemory: (query: string) => Promise<void>;
  scanDirectory: (path: string) => Promise<void>;
  clearResults: () => void;
}

export const MemoryContext = createContext<MemoryContextType | undefined>(
  undefined,
);
