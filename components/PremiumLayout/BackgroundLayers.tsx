import React from "react";
import { JarvisCinematicBackground } from "../JarvisCinematicBackground";

export const BackgroundLayers: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0">
      <img
        src="/bg-wires3.png"
        alt="Background"
        className="fixed inset-0 w-full h-full object-cover opacity-50 z-0"
      />
      <JarvisCinematicBackground />
      {/* 
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80" />
        <div className="jarvis-scanlines opacity-20" />
        <div className="jarvis-vignette opacity-50" />
        */}
    </div>
  );
};
