import React from "react";
import { Lightbulb, Thermometer, Printer, DoorOpen, Zap } from "lucide-react";
import { TabButton } from "./TabButton";

export type Tab = "LIGHTS" | "SENSORS" | "PRINTERS" | "DOORS" | "ENERGY";

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-[80px] flex flex-col items-center py-6 gap-4 bg-black/40 border-r border-cyan-400/10 z-10 shrink-0">
      <TabButton
        active={activeTab === "LIGHTS"}
        onClick={() => onTabChange("LIGHTS")}
        icon={<Lightbulb size={24} />}
        label="LIGHTS"
      />
      <TabButton
        active={activeTab === "SENSORS"}
        onClick={() => onTabChange("SENSORS")}
        icon={<Thermometer size={24} />}
        label="SENSORS"
      />
      <TabButton
        active={activeTab === "ENERGY"}
        onClick={() => onTabChange("ENERGY")}
        icon={<Zap size={24} />}
        label="ENERGY"
      />
      <TabButton
        active={activeTab === "PRINTERS"}
        onClick={() => onTabChange("PRINTERS")}
        icon={<Printer size={24} />}
        label="PRINTERS"
      />
      <TabButton
        active={activeTab === "DOORS"}
        onClick={() => onTabChange("DOORS")}
        icon={<DoorOpen size={24} />}
        label="DOORS"
      />
    </div>
  );
};
