import { useContext } from "react";
import { KernelContext } from "../contexts/KernelContextDefinition";

export const useKernel = () => {
  const context = useContext(KernelContext);
  if (context === undefined) {
    throw new Error("useKernel must be used within a KernelProvider");
  }
  return context;
};
