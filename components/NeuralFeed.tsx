// fichier pour les messages de l'interface
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col font-mono text-sm relative overflow-hidden">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div
        className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 p-2"
        ref={scrollRef}
      >
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.sender === "user" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg backdrop-blur-md border ${
                  msg.sender === "user"
                    ? "bg-cyan-900/20 border-cyan-500/30 text-cyan-100"
                    : "bg-blue-900/20 border-blue-500/30 text-blue-100"
                }`}
                style={{
                  boxShadow:
                    msg.sender === "user"
                      ? "0 0 10px rgba(0, 229, 255, 0.1)"
                      : "0 0 10px rgba(60, 130, 246, 0.1)",
                }}
              >
                <div className="flex justify-between items-center mb-1 text-[10px] opacity-70 tracking-wider">
                  <span>{msg.sender === "user" ? "COMMAND" : "RESPONSE"}</span>
                  <span>
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
