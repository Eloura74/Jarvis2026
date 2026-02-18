import React from "react";
import { motion } from "framer-motion";
import { Radio } from "lucide-react";
import { THEME } from "./theme";

export const LiveBadge: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        position: "absolute",
        top: 10,
        right: 60,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: `linear-gradient(135deg, ${THEME.cyanDim}, rgba(0, 243, 255, 0.05))`,
        padding: "5px 10px",
        borderRadius: "6px",
        border: `1.5px solid ${THEME.cyan}`,
        boxShadow: `0 0 15px ${THEME.cyanGlow}, inset 0 0 10px rgba(0, 243, 255, 0.1)`,
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Radio size={11} color={THEME.cyan} strokeWidth={3} />
      </motion.div>
      <span
        style={{
          color: THEME.cyan,
          fontSize: "9px",
          fontWeight: 700,
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: "0.5px",
          textShadow: `0 0 8px ${THEME.cyanGlow}`,
        }}
      >
        LIVE LINK ACTIVE
      </span>
    </motion.div>
  );
};
