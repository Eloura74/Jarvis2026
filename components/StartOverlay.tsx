import React, { useState } from "react";

interface StartOverlayProps {
  onStart: () => void;
}

export const StartOverlay: React.FC<StartOverlayProps> = ({ onStart }) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleStart = () => {
    setVisible(false);
    onStart();
  };

  return (
    <div
      onClick={handleStart}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(5px)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        color: "white",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div className="animate-pulse flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-4 text-cyan-400">J.A.R.V.I.S.</h1>
        <p className="text-xl mb-8">Système en attente d'initialisation</p>
        <button className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(8,145,178,0.5)]">
          INITIALISER LE SYSTÈME
        </button>
        <p className="mt-4 text-sm text-gray-400">
          Cliquez n'importe où pour démarrer
        </p>
      </div>
    </div>
  );
};
