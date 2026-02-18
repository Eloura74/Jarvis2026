import { useContext } from "react";
import { MemoryContext } from "../contexts/MemoryContextDefinition";

export const useMemory = () => {
  const context = useContext(MemoryContext);
  if (!context)
    throw new Error("useMemory must be used within a MemoryProvider");
  return context;
};
