import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { NeuralFeed } from "../NeuralFeed";
import { FingerprintScanner } from "../FingerprintScanner";

interface RightPanelProps {
  logs: Array<{
    source: string;
    message: string;
    type: "info" | "success" | "error" | "warning";
  }>;
  onCommand?: (command: string) => void;
  setIsAppPathsOpen: (isOpen: boolean) => void;
  setIsFileExplorerOpen: (isOpen: boolean) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  logs,
  onCommand,
  setIsAppPathsOpen,
  setIsFileExplorerOpen,
}) => {
  // TIME STATE
  const [time, setTime] = useState(new Date());

  // COMMAND INPUT STATE
  const [commandText, setCommandText] = useState("");

  const handleCommandSubmit = () => {
    const cmd = commandText.trim();
    if (!cmd || !onCommand) return;
    onCommand(cmd);
    setCommandText("");
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // FORMATS
  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");

  const dateStr = time
    .toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .toUpperCase();

  // Mock messages for Neural Feed demonstration (replace with real data later)
  const mockMessages = logs
    .map((log, i) => ({
      id: `msg-${i}`,
      text: log.message,
      sender: log.source === "USER" ? "user" : "jarvis",
      timestamp: new Date(), // En prod date réelle
    }))
    .filter((m) => m.sender === "user" || m.sender === "jarvis"); // Filter only chat-like messages

  return (
    <div
      className="flex flex-col gap-3 md:gap-4 pointer-events-auto 
                    md:h-[90vh] mt-0 md:mt-8 z-20 
                    order-2 md:order-3
                    xl:order-3"
    >
      {/* DATE & TIME PANEL - REFONTE */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="jarvis-panel-glass p-0 rounded-2xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl group hover:border-cyan-400/50 shadow-[0_0_20px_rgba(0,229,255,0.1)] relative overflow-hidden min-h-[140px] flex flex-col items-center justify-center"
      >
        {/* BACKGROUND */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1516110833967-0b5716ca1387?q=80&w=1000&auto=format&fit=crop"
            alt="Time Background"
            className="w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-cyan-900/20" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* DIGITAL CLOCK WITH SECONDS */}
          <div className="text-5xl font-light text-white mb-2 tracking-widest flex items-baseline gap-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] font-mono">
            <span className="font-bold">{hours}</span>
            <span className="animate-pulse text-cyan-400">:</span>
            <span className="font-bold">{minutes}</span>
            <span className="text-xl text-cyan-500/80 font-normal ml-1 w-8">
              {seconds}
            </span>
          </div>

          {/* DATE */}
          <div className="flex items-center gap-2">
            <div className="h-[1px] w-8 bg-cyan-500/50"></div>
            <div className="text-xs text-cyan-300 tracking-[0.3em] uppercase opacity-90 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
              {dateStr}
            </div>
            <div className="h-[1px] w-8 bg-cyan-500/50"></div>
          </div>

          {/* LOCATION (Static for now) */}
          <div className="absolute top-2 right-3 text-[8px] text-cyan-500/50 tracking-widest uppercase">
            LE LUC, FR
          </div>
        </div>
      </motion.div>

      {/* NEURAL FEED (Chat) */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="flex-1 jarvis-panel-glass rounded-2xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl overflow-hidden relative flex flex-col min-h-[400px] shadow-[0_0_20px_rgba(0,229,255,0.1)] group"
      >
        {/* BACKGROUND */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000&auto=format&fit=crop"
            alt="Neural Background"
            className="w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-blue-900/10" />
        </div>

        <div className="p-4 border-b border-cyan-400/30 bg-cyan-900/20 flex justify-between items-center relative z-10 backdrop-blur-sm">
          <h3 className="text-sm font-bold tracking-widest text-cyan-300 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
            NEURAL FEED
          </h3>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_5px_#00e5ff]" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/20" />
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-2 relative z-10">
          <NeuralFeed
            messages={
              mockMessages as {
                id: string;
                text: string;
                sender: "user" | "jarvis";
                timestamp: Date;
              }[]
            }
          />
        </div>

        {/* Command Input (clavier → JARVIS Brain) */}
        <div className="p-3 border-t border-cyan-400/30 bg-black/20 relative z-10">
          <div className="h-8 rounded border border-cyan-500/30 focus-within:border-cyan-400 focus-within:shadow-[0_0_10px_rgba(0,229,255,0.3)] flex items-center px-3 bg-black/40 transition-all">
            <input
              type="text"
              value={commandText}
              onChange={(e) => setCommandText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCommandSubmit();
              }}
              placeholder="Tapez une commande pour JARVIS..."
              className="flex-1 bg-transparent outline-none text-xs text-cyan-100 placeholder:text-cyan-400/50 placeholder:italic tracking-wider"
            />
            <button
              onClick={handleCommandSubmit}
              disabled={!commandText.trim()}
              className="text-cyan-400/70 hover:text-cyan-300 disabled:opacity-30 text-xs tracking-widest ml-2 transition-colors"
            >
              ▶
            </button>
          </div>
        </div>
      </motion.div>

      {/* FINGERPRINT COMPACT */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="flex flex-col items-center justify-center p-4 rounded-2xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl group hover:border-cyan-400/50 transition-all shadow-[0_0_20px_rgba(0,229,255,0.1)] relative overflow-hidden"
      >
        {/* BACKGROUND */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop"
            alt="Security Background"
            className="w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <FingerprintScanner size={80} isActive={true} />
          <div className="text-xs tracking-[0.3em] text-cyan-300 mt-2 opacity-90 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
            BIOMETRIC SCAN
          </div>
          <div className="text-[10px] tracking-widest text-green-400 mt-1 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
            ACCESS GRANTED
          </div>
        </div>
      </motion.div>

      <motion.button
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        onClick={() => setIsAppPathsOpen(true)}
        className="w-full py-3 border border-cyan-400/30 rounded text-sm tracking-widest hover:border-cyan-400 hover:text-cyan-100 transition-all bg-black/30 backdrop-blur-sm text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.1)] relative overflow-hidden group"
      >
        <div className="absolute inset-0 z-0 opacity-30 group-hover:opacity-70 transition-opacity">
          <img
            src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=1000&auto=format&fit=crop"
            alt="Config Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-cyan-900/50 mix-blend-multiply" />
        </div>
        <span className="relative z-10 drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]">
          CONFIG APPS
        </span>
      </motion.button>

      <motion.button
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        onClick={() => setIsFileExplorerOpen(true)}
        className="w-full py-3 border border-cyan-400/30 rounded text-sm tracking-widest hover:border-cyan-400 hover:text-cyan-100 transition-all bg-black/30 backdrop-blur-sm text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.1)] relative overflow-hidden group"
      >
        <div className="absolute inset-0 z-0 opacity-30 group-hover:opacity-70 transition-opacity">
          <img
            src="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1000&auto=format&fit=crop"
            alt="Files Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-blue-900/50 mix-blend-multiply" />
        </div>
        <span className="relative z-10 drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]">
          FICHIERS
        </span>
      </motion.button>
    </div>
  );
};
