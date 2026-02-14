import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Cpu, MessageSquare, ShieldCheck } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "jarvis";
  timestamp: Date;
}

interface NeuralFeedProps {
  messages: Message[];
}

/**
 * NeuralFeed - Affichage des logs et conversations style "Neural Link"
 * Design professionnel, fluide et hautement esthétique.
 */
export const NeuralFeed: React.FC<NeuralFeedProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll intelligent vers le bas
  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 200;

      if (isNearBottom) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col font-mono text-sm relative overflow-hidden bg-black/40 rounded-xl border border-cyan-500/20 backdrop-blur-md">
      {/* SCANLINES OVERLAY EFFECT */}
      <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,.06),rgba(0,255,0,.02),rgba(0,0,255,.06))] bg-[length:100%_2px,3px_100%]" />

      {/* HEADER DECORATION */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-cyan-500/20 bg-cyan-500/5 relative z-10">
        <div className="flex items-center gap-2">
          <Terminal size={12} className="text-cyan-400" />
          <span className="text-[10px] font-black tracking-[0.2em] text-cyan-400 uppercase">
            Neural link established
          </span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-1 h-3 bg-cyan-500/30 rounded-full animate-pulse" />
          <div className="w-1 h-3 bg-cyan-500/60 rounded-full" />
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 p-4 relative z-10"
        ref={scrollRef}
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              className="h-full flex flex-col items-center justify-center text-cyan-500/40 italic"
            >
              <Cpu size={32} className="mb-2 opacity-20" />
              <p className="text-xs tracking-widest">
                AWAITING NEURAL INPUT...
              </p>
            </motion.div>
          ) : (
            messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                {/* MESSAGE METADATA */}
                <div
                  className={`flex items-center gap-2 mb-1 px-1 text-[9px] font-bold tracking-tighter uppercase ${
                    msg.sender === "user"
                      ? "text-cyan-400/70"
                      : "text-blue-400/70"
                  }`}
                >
                  {msg.sender === "user" ? (
                    <>
                      <span>USER_CMD</span>
                      <ShieldCheck size={10} />
                    </>
                  ) : (
                    <>
                      <MessageSquare size={10} />
                      <span>JARVIS_RES</span>
                    </>
                  )}
                  <span className="opacity-40">•</span>
                  <span className="font-mono opacity-50">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>

                {/* MESSAGE BUBBLE */}
                <div
                  className={`relative group max-w-[90%] p-3 rounded-tr-none rounded-bl-none rounded-xl border transition-all duration-300 ${
                    msg.sender === "user"
                      ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-50 hover:border-cyan-400/80"
                      : "bg-blue-600/5 border-blue-400/30 text-blue-100 hover:border-blue-400/70"
                  }`}
                  style={{
                    boxShadow:
                      msg.sender === "user"
                        ? "inset 0 0 20px rgba(0, 229, 255, 0.05)"
                        : "inset 0 0 20px rgba(60, 130, 246, 0.05)",
                  }}
                >
                  {/* GLOW EFFECT ON HOVER */}
                  <div
                    className={`absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 blur-[4px] transition-opacity duration-500 pointer-events-none ${
                      msg.sender === "user"
                        ? "bg-cyan-400/20"
                        : "bg-blue-400/20"
                    }`}
                  />

                  {/* DECORATIVE CORNER BRACKET */}
                  <div
                    className={`absolute -top-[1px] -right-[1px] w-2 h-2 border-t border-r rounded-tr-sm transition-colors ${
                      msg.sender === "user"
                        ? "border-cyan-400"
                        : "border-blue-400"
                    }`}
                  />

                  <div className="relative z-10 leading-relaxed font-mono text-[13px] whitespace-pre-wrap">
                    {msg.text}
                  </div>
                </div>

                {/* VISUAL SEPARATOR FOR LAST MESSAGE */}
                {index === messages.length - 1 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "20%" }}
                    className={`h-[1px] mt-2 ${msg.sender === "user" ? "bg-cyan-500/40" : "bg-blue-500/40"}`}
                  />
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER STATUS */}
      <div className="px-4 py-1.5 border-t border-cyan-500/10 bg-black/40 text-[9px] text-cyan-500/50 flex justify-between items-center italic">
        <span className="animate-pulse">ENCRYPTION: AES-256-GCM</span>
        <span>CORE V4.2.0</span>
      </div>
    </div>
  );
};
