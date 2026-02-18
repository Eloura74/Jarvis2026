import React from "react";
import { motion } from "framer-motion";
import { Thermometer, Gauge, Cpu, Shield } from "lucide-react";
import { THEME } from "./theme";
import { StatusStat } from "../../types/app.types";

interface StatCardProps {
  stat: StatusStat;
  index: number;
}

const getAutoIcon = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes("temp")) return <Thermometer size={12} opacity={0.5} />;
  if (l.includes("prog")) return <Gauge size={12} opacity={0.5} />;
  if (l.includes("sys")) return <Cpu size={12} opacity={0.5} />;
  return <Shield size={12} opacity={0.5} />;
};

export const StatCard: React.FC<StatCardProps> = ({ stat, index }) => {
  const getStatusColor = () => {
    if (stat.status === "critical") return THEME.alert;
    if (stat.status === "warning") return THEME.warning;
    return THEME.cyan;
  };

  const color = getStatusColor();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: `1px solid rgba(0, 243, 255, 0.08)`,
        borderLeft: `3px solid ${color}`,
        padding: "12px",
        position: "relative",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          color: "rgba(255,255,255,0.4)",
          marginBottom: "6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {stat.label}
        {stat.icon || getAutoIcon(stat.label)}
      </div>

      <div
        style={{
          fontSize: "22px",
          fontWeight: 700,
          color: color,
          textShadow: `0 0 10px ${color}50`,
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        {stat.value}{" "}
        <span style={{ fontSize: "12px", opacity: 0.6, fontWeight: 400 }}>
          {stat.unit}
        </span>
      </div>

      {stat.progress !== undefined && (
        <div
          style={{
            width: "100%",
            height: "3px",
            background: "rgba(0,0,0,0.4)",
            marginTop: "10px",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stat.progress}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              height: "100%",
              background: color,
              boxShadow: `0 0 10px ${color}`,
            }}
          />
        </div>
      )}
    </motion.div>
  );
};
