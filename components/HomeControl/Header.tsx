import React from "react";

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => (
  <h3 className="text-cyan-300 font-bold tracking-[0.2em] text-xs mb-5 flex items-center gap-2 after:content-[''] after:h-[1px] after:bg-gradient-to-r after:from-cyan-500/50 after:to-transparent after:flex-1 drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
    {title}
  </h3>
);
