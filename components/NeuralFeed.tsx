import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Cpu, ChevronRight } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "jarvis";
  timestamp: Date;
}

interface NeuralFeedProps {
  messages: Message[];
}

export const NeuralFeed: React.FC<NeuralFeedProps> = ({ messages }) => {
  // PID stable généré une seule fois au montage
  const [pid] = useState(() => Math.floor(Math.random() * 9000) + 1000);

  // Ordre inversé : Le plus récent en haut (Log Stream)
  const reversedMessages = [...messages].reverse();

  return (
    <div className="h-full flex flex-col font-mono text-sm relative overflow-hidden bg-[#050505] rounded-xl border border-cyan-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      {/* BACKGROUND GRID & SCANLINES */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent z-0 pointer-events-none animate-[scan_4s_linear_infinite]" />

      {/* HEADER: SYSTEM MONITOR STYLE */}
      <div className="flex justify-between items-center px-3 py-2 border-b border-cyan-500/20 bg-cyan-950/30 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-cyan-500/10 rounded border border-cyan-500/30">
            <Terminal size={12} className="text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-cyan-300 tracking-[0.2em] uppercase">
              NEURAL_IO_STREAM
            </span>
            <span className="text-[8px] text-cyan-600 font-mono">
              PID: {pid} // ACTIVE
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-cyan-500/50 animate-pulse">
            LIVE
          </span>
          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_5px_#00e5ff]" />
        </div>
      </div>

      {/* TERMINAL CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 relative z-10 font-mono space-y-1">
        <AnimatePresence initial={false}>
          {reversedMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              className="h-full flex flex-col items-center justify-center text-cyan-900/40"
            >
              <Cpu size={24} className="mb-2 opacity-50" />
              <p className="text-[10px] tracking-widest uppercase font-bold">
                AWAITING INPUT_
              </p>
            </motion.div>
          ) : (
            reversedMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`group flex items-start gap-2 text-[11px] md:text-[12px] p-1.5 rounded hover:bg-white/5 transition-colors border-l-2 ${
                  msg.sender === "user"
                    ? "border-cyan-500/50 bg-cyan-950/10"
                    : "border-transparent"
                }`}
              >
                {/* TIMESTAMP */}
                <span className="text-cyan-700/70 text-[9px] tracking-tighter shrink-0 pt-0.5 select-none">
                  [
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                  ]
                </span>

                {/* SENDER MARKER */}
                <div
                  className={`shrink-0 pt-0.5 ${msg.sender === "user" ? "text-cyan-400" : "text-gray-500"}`}
                >
                  <ChevronRight size={10} strokeWidth={3} />
                </div>

                {/* CONTENT */}
                <div className="flex flex-col w-full">
                  {/* Prefix Line for System vs User */}
                  <div className="flex items-center gap-2 mb-0.5 opacity-50">
                    <span
                      className={`text-[8px] font-bold uppercase tracking-wider ${msg.sender === "user" ? "text-cyan-300" : "text-gray-400"}`}
                    >
                      {msg.sender === "user" ? "USR_CMD" : "SYS_RES"}
                    </span>
                    <div className="h-px bg-white/10 flex-1" />
                  </div>

                  {/* The Message */}
                  <span
                    className={`leading-snug break-words ${msg.sender === "user" ? "text-cyan-100 font-bold" : "text-gray-300"}`}
                  >
                    {msg.text}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {/* Terminal Input Cursor Effect (Fake) */}
        <div className="h-4 w-2 bg-cyan-500/50 animate-pulse mt-2" />
      </div>
    </div>
  );
};
