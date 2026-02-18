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
    <div className="w-[60px] flex flex-col items-center py-2 gap-2 bg-black/40 border-r border-cyan-400/10 z-10 shrink-0 overflow-y-auto no-scrollbar">
      <TabButton
        active={activeTab === "LIGHTS"}
        onClick={() => onTabChange("LIGHTS")}
        icon={<Lightbulb size={18} />}
        label="LIGHTS"
      />
      <TabButton
        active={activeTab === "SENSORS"}
        onClick={() => onTabChange("SENSORS")}
        icon={<Thermometer size={18} />}
        label="SENSORS"
      />
      <TabButton
        active={activeTab === "ENERGY"}
        onClick={() => onTabChange("ENERGY")}
        icon={<Zap size={18} />}
        label="ENERGY"
      />
      <TabButton
        active={activeTab === "PRINTERS"}
        onClick={() => onTabChange("PRINTERS")}
        icon={<Printer size={18} />}
        label="PRINTERS"
      />
      <TabButton
        active={activeTab === "DOORS"}
        onClick={() => onTabChange("DOORS")}
        icon={<DoorOpen size={18} />}
        label="DOORS"
      />
    </div>
  );
};
