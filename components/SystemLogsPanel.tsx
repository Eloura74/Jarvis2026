import React, { useState, useMemo } from "react";
import {
  Search,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useKernel } from "../hooks/useKernel";

export const SystemLogsPanel: React.FC = () => {
  const { logs } = useKernel();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "ALL" | "INFO" | "SUCCESS" | "WARNING" | "ERROR"
  >("ALL");

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterType === "ALL" ? true : log.type.toUpperCase() === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [logs, searchTerm, filterType]);

  const getIcon = (type: string) => {
    switch (type) {
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-cyan-500" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-400 border-red-500/30 bg-red-950/20";
      case "warning":
        return "text-yellow-400 border-yellow-500/30 bg-yellow-950/20";
      case "success":
        return "text-green-400 border-green-500/30 bg-green-950/20";
      default:
        return "text-cyan-400 border-cyan-500/30 bg-cyan-950/20";
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-6 text-cyan-300 font-mono">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
          <input
            type="text"
            placeholder="Rechercher dans les logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-cyan-500/30 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,229,255,0.2)] placeholder-cyan-700 transition-all"
          />
        </div>
        <div className="flex gap-2 shrink-0 overflow-x-auto pb-1 custom-scrollbar">
          {(["ALL", "INFO", "SUCCESS", "WARNING", "ERROR"] as const).map(
            (type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                  filterType === type
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-100 shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                    : "bg-black/30 border-cyan-900/50 text-cyan-600 hover:border-cyan-500/50 hover:text-cyan-400"
                }`}
              >
                {type}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-cyan-900 italic mt-10">
            Aucune entrée correspondante dans le journal système.
          </div>
        ) : (
          filteredLogs
            .slice()
            .reverse()
            .map((log, index) => (
              <div
                key={log.timestamp + index}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all hover:bg-white/5 ${getColor(
                  log.type,
                )}`}
              >
                <div className="mt-0.5 shrink-0">{getIcon(log.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-xs tracking-wider opacity-80">
                      [{log.source}]
                    </span>
                    <span className="text-[10px] opacity-60">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm break-words leading-relaxed select-text">
                    {log.message}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-3 border-t border-cyan-500/20 flex justify-between text-[10px] text-cyan-500/50 uppercase tracking-widest shrink-0">
        <div>Total Entries: {logs.length}</div>
        <div>Filtered: {filteredLogs.length}</div>
        <div className="flex items-center gap-2">
          System Status:{" "}
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]" />{" "}
          Online
        </div>
      </div>
    </div>
  );
};
