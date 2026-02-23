import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Hexagon } from "lucide-react";

interface HolographicModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
  height?: string;
}

export const HolographicModal: React.FC<HolographicModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = "max-w-4xl",
  height = "max-h-[80vh]",
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              onClose();
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full ${width} ${height} flex flex-col bg-black/90 border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,229,255,0.15)] group`}
          >
            {/* Holographic Border Effects */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-cyan-500 to-transparent opacity-30" />
            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-cyan-500 to-transparent opacity-30" />

            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 to-transparent shrink-0">
              <div className="flex items-center gap-3">
                <Hexagon className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h2 className="text-lg font-bold text-white tracking-widest uppercase drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-red-500/20 text-cyan-500 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Content - Auto Scroll */}
            <div className="flex-1 overflow-auto custom-scrollbar p-1 relative">
              {/* Scanlines Effect */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
