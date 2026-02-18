import React from "react";
import { THEME } from "./theme";
import { Corner } from "./Corner";

interface HolographicContainerProps {
  children: React.ReactNode;
}

export const HolographicContainer: React.FC<HolographicContainerProps> = ({
  children,
}) => {
  return (
    <div
      style={{
        width: "550px",
        maxWidth: "95vw",
        backgroundColor: THEME.bg,
        border: `1px solid ${THEME.cyanDim}`,
        boxShadow: `0 20px 50px rgba(0,0,0,0.8), inset 0 0 30px ${THEME.cyanDim}`,
        padding: "20px",
        position: "relative",
        overflow: "hidden",
        fontFamily: '"Rajdhani", sans-serif',
        color: "#fff",
      }}
    >
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 0.4; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes flicker {
          0% { opacity: 0.97; }
          5% { opacity: 0.92; }
          10% { opacity: 0.98; }
          15% { opacity: 0.95; }
          20% { opacity: 0.99; }
          100% { opacity: 1; }
        }
        .holo-scanline {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: ${THEME.cyan};
          opacity: 0.15;
          box-shadow: 0 0 15px ${THEME.cyan};
          animation: scanline 4s linear infinite;
          pointer-events: none;
          z-index: 10;
        }
        .holo-flicker {
          position: absolute; inset: 0; pointer-events: none; z-index: 5;
          animation: flicker 0.1s infinite;
          background: rgba(0, 243, 255, 0.01);
        }
        .holo-grid-overlay {
          position: absolute; inset: 0; pointer-events: none; z-index: 2;
          background-image: linear-gradient(${THEME.cyanDim} 1px, transparent 1px),
                            linear-gradient(90deg, ${THEME.cyanDim} 1px, transparent 1px);
          background-size: 25px 25px;
          opacity: 0.1;
        }
      `}</style>

      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />

      {/* Effets de fond globaux */}
      <div className="holo-scanline" />
      <div className="holo-flicker" />

      {children}
    </div>
  );
};
