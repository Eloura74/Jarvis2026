import React from "react";

export const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left group ${
      active
        ? "bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.1)]"
        : "text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 hover:pl-5"
    }`}
  >
    <div
      className={`${active ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-400"} transition-colors`}
    >
      {icon}
    </div>
    <span className="font-medium">{label}</span>
    {active && (
      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(0,229,255,0.8)]" />
    )}
  </button>
);
