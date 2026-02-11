/**
 * TerminalLogs - Logs style terminal avec glassmorphism
 * Affichage logs avec auto-scroll et animations
 */

import React, { useEffect, useRef } from "react";

interface LogEntry {
  source: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
  timestamp?: number;
}

interface TerminalLogsProps {
  logs: LogEntry[];
  maxHeight?: string;
}

export const TerminalLogs: React.FC<TerminalLogsProps> = ({
  logs,
  maxHeight = "300px",
}) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getTypeColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      default:
        return "text-cyan-400";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source.toUpperCase()) {
      case "SYSTEM":
        return "text-blue-400";
      case "OMNI":
        return "text-purple-400";
      case "USER":
        return "text-green-400";
      default:
        return "text-cyan-400";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6">
      <div className="relative backdrop-blur-lg bg-gradient-to-br from-black/60 to-slate-900/40 border border-cyan-500/20 rounded-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 glow-pulse" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-cyan-500/60 uppercase tracking-wider font-mono">
            Terminal Logs
          </span>
        </div>

        {/* Logs container */}
        <div
          className="overflow-y-auto font-mono text-sm space-y-1.5 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent"
          style={{ maxHeight }}
        >
          {logs.map((log, index) => (
            <div
              key={index}
              className="flex gap-3 animate-slideInUp hover:bg-cyan-500/5 px-2 py-1 rounded transition-colors duration-200"
            >
              {/* Source */}
              <span
                className={`${getSourceColor(log.source)} font-bold min-w-[80px]`}
              >
                [{log.source}]
              </span>

              {/* Message */}
              <span className={getTypeColor(log.type)}>{log.message}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

        {/* Empty state */}
        {logs.length === 0 && (
          <div className="text-center text-cyan-500/40 py-8 font-mono text-sm">
            Waiting for commands...
          </div>
        )}
      </div>
    </div>
  );
};
