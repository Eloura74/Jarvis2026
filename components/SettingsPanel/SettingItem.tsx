import React from "react";
import { motion } from "framer-motion";
import { ThemeConfig } from "./types";

interface SettingItemProps {
  children: React.ReactNode;
  themeConfig: ThemeConfig;
  delay?: number;
}

export const SettingItem: React.FC<SettingItemProps> = ({
  children,
  themeConfig,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`p-4 rounded-lg border ${themeConfig.border} ${themeConfig.bg}`}
    >
      {children}
    </motion.div>
  );
};
