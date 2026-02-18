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
 *
 * Mises à jour :
 * - Ordre inversé (plus récent en haut)
 * - Visibilité accrue
 */
export const NeuralFeed: React.FC<NeuralFeedProps> = ({ messages }) => {
  // On inverse l'ordre des messages pour afficher le plus récent en haut (comme un feed social/news)
  // Ou on garde le scroll en bas classique ? La demande était "Afficher le dernier log plutôt que le 1er"
  // Si c'est une liste scrollable, le dernier est en bas. Si c'est "plutôt que le 1er" qui est visible par défaut,
  // ça veut dire qu'il faut scroller en bas par défaut. Je l'avais déjà fait, mais peut-être que l'user veut le dernier EN HAUT.
  // "Afficher le dernier log plutôt que le 1er" -> stack inverse (Newest Top).

  const reversedMessages = [...messages].reverse();

  return (
    <div className="h-full flex flex-col font-mono text-sm relative overflow-hidden bg-black/60 rounded-xl border border-cyan-500/30 backdrop-blur-md">
      {/* SCANLINES OVERLAY EFFECT */}
      <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,.06),rgba(0,255,0,.02),rgba(0,0,255,.06))] bg-[length:100%_2px,3px_100%]" />

      {/* HEADER DECORATION */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-cyan-500/30 bg-cyan-900/20 relative z-10 box-shadow-lg">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-cyan-400" />
          <span className="text-[11px] font-black tracking-[0.2em] text-cyan-300 uppercase glow-text">
            Neural Link V2
          </span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-1.5 h-3 bg-cyan-500/50 rounded-full animate-pulse" />
          <div className="w-1.5 h-3 bg-cyan-500/80 rounded-full" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 p-4 relative z-10">
        <AnimatePresence initial={false}>
          {reversedMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              className="h-full flex flex-col items-center justify-center text-cyan-500/40 italic mt-10"
            >
              <Cpu size={32} className="mb-2 opacity-30" />
              <p className="text-xs tracking-widest font-bold">
                SYSTEM STANDBY...
              </p>
            </motion.div>
          ) : (
            reversedMessages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                {/* MESSAGE METADATA */}
                <div
                  className={`flex items-center gap-2 mb-1 px-1 text-[10px] font-bold tracking-tight uppercase ${
                    msg.sender === "user" ? "text-cyan-300" : "text-blue-300"
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
                      <span>JARVIS_CORE</span>
                    </>
                  )}
                  <span className="opacity-40">•</span>
                  <span className="font-mono opacity-60">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>

                {/* MESSAGE BUBBLE - Contraste Augmenté */}
                <div
                  className={`relative group max-w-[95%] p-3.5 rounded-sm border-l-2 transition-all duration-300 shadow-md ${
                    msg.sender === "user"
                      ? "bg-cyan-900/20 border-cyan-400 text-cyan-50 rounded-tr-xl rounded-bl-xl"
                      : "bg-blue-900/10 border-blue-400 text-blue-50 rounded-tl-xl rounded-br-xl"
                  }`}
                >
                  <div className="relative z-10 leading-relaxed font-mono text-[13px] whitespace-pre-wrap font-medium">
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
