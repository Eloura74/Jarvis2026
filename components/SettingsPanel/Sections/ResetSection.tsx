import React from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { ThemeConfig } from "../types";

interface ResetSectionProps {
  onReset: () => void;
  themeConfig: ThemeConfig;
}

export const ResetSection: React.FC<ResetSectionProps> = ({
  onReset,
  themeConfig,
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      onClick={onReset}
      className={`
        w-full flex items-center justify-center gap-2
        px-4 py-3 rounded-lg border ${themeConfig.border}
        bg-red-500/10 hover:bg-red-500/20
        text-red-400 hover:text-red-300
        font-mono text-sm
        transition-all duration-200
        group
      `}
    >
      <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
      RÉINITIALISER PARAMÈTRES
    </motion.button>
  );
};
