import React from "react";

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export const TabButton: React.FC<TabButtonProps> = ({
  active,
  onClick,
  icon,
  label,
}) => (
  <button
    onClick={onClick}
    className={`relative group w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${
      active
        ? "bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.3)] border border-cyan-400/30"
        : "text-cyan-500/40 hover:text-cyan-300 hover:bg-white/5 border border-transparent"
    }`}
    title={label}
  >
    {icon}
    {active && (
      <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_5px_#00e5ff]" />
    )}
  </button>
);
