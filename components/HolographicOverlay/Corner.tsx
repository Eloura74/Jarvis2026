import React from "react";
import { THEME } from "./theme";

interface CornerProps {
  pos: "tl" | "tr" | "bl" | "br";
}

export const Corner: React.FC<CornerProps> = ({ pos }) => {
  const base: React.CSSProperties = {
    position: "absolute",
    width: "12px",
    height: "12px",
    borderColor: THEME.cyan,
    borderStyle: "solid",
    opacity: 0.6,
  };

  if (pos === "tl") {
    base.top = 0;
    base.left = 0;
    base.borderWidth = "2px 0 0 2px";
  }
  if (pos === "tr") {
    base.top = 0;
    base.right = 0;
    base.borderWidth = "2px 2px 0 0";
  }
  if (pos === "bl") {
    base.bottom = 0;
    base.left = 0;
    base.borderWidth = "0 0 2px 2px";
  }
  if (pos === "br") {
    base.bottom = 0;
    base.right = 0;
    base.borderWidth = "0 2px 2px 0";
  }

  return <div style={base} />;
};
