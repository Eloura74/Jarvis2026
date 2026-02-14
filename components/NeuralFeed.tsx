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

  // Auto-scroll intelligent vers le bas
  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      // Vérifier si l'utilisateur est déjà proche du bas (seuil de 150px)
      // Ou si le dernier message vient d'être ajouté et qu'on veut forcer la vue
      const isNearBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 150;

      if (isNearBottom) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
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
                    ? "bg-cyan-900/10 border-cyan-400/40 text-cyan-50 shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                    : "bg-blue-900/10 border-blue-400/40 text-blue-50 shadow-[0_0_10px_rgba(60,130,246,0.2)]"
                }`}
                style={{
                  boxShadow:
                    msg.sender === "user"
                      ? "0 0 15px rgba(0, 229, 255, 0.15)"
                      : "0 0 15px rgba(60, 130, 246, 0.15)",
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
