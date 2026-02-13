import React from "react";
import { motion } from "framer-motion";

interface DraggablePanelProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  title,
  children,
  onClose,
  initialPosition = { x: 0, y: 0 },
}) => {
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{
        opacity: 0,
        scale: 0.8,
        x: initialPosition.x,
        y: initialPosition.y,
      }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      className="fixed z-[9999] flex flex-col overflow-hidden rounded-lg shadow-[0_0_30px_rgba(0,255,255,0.2)]"
      style={{
        width: "600px",
        height: "auto",
        minWidth: "300px",
        minHeight: "200px",
        resize: "both",
        backgroundColor: "rgba(10, 15, 20, 0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(34, 211, 238, 0.5)",
      }}
    >
      {/* Header / Handle */}
      <div className="flex items-center justify-between px-4 py-2 bg-cyan-950/50 border-b border-cyan-500/20 cursor-move select-none group">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400 group-hover:text-cyan-300 transition-colors">
            {title}
          </span>
        </div>

        <button
          onClick={onClose}
          className="text-cyan-600 hover:text-red-400 transition-colors text-lg leading-none px-2"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-4 relative">
        {/* Decorative corner lines */}
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50 rounded-br opacity-50" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50 rounded-bl opacity-50" />

        {children}
      </div>
    </motion.div>
  );
};
