import React from "react";

interface SceneButtonProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

export const SceneButton: React.FC<SceneButtonProps> = ({
  icon,
  label,
  color,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-900/10 transition-all group"
  >
    <div
      className={`mb-2 p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform ${color}`}
    >
      {icon}
    </div>
    <span className="text-[10px] font-bold text-gray-400 tracking-wider group-hover:text-white transition-colors">
      {label}
    </span>
  </button>
);
