import React from "react";

import { OrbitalMenu } from "../../components/OrbitalMenu";
import { HolographicModal } from "../../components/ui/HolographicModal";

import { HomeControlWidget } from "../../components/HomeControlWidget";
import PrinterFleetDashboard from "../../components/PrinterFleetDashboard";
import GhostModePanel from "../../components/GhostModePanel";
import WorkflowPanel from "../../components/WorkflowPanel";
import PsychProfileWidget from "../../components/PsychProfileWidget";
import { SystemLogsPanel } from "../../components/SystemLogsPanel";

export default function ShellPanels({
  activeOverlay,
  setActiveOverlay,
  onToggleGemini,
}: {
  activeOverlay: string | null;
  setActiveOverlay: React.Dispatch<React.SetStateAction<string | null>>;
  onToggleGemini: () => void;
}) {
  return (
    <>
      <OrbitalMenu
        onToggleHome={() =>
          setActiveOverlay(activeOverlay === "HOME" ? null : "HOME")
        }
        onTogglePsych={() =>
          setActiveOverlay(activeOverlay === "PSYCH" ? null : "PSYCH")
        }
        onToggleGhost={() =>
          setActiveOverlay(activeOverlay === "GHOST" ? null : "GHOST")
        }
        onToggleWorkflow={() =>
          setActiveOverlay(activeOverlay === "WORKFLOW" ? null : "WORKFLOW")
        }
        onTogglePrinter={() =>
          setActiveOverlay(activeOverlay === "PRINTER" ? null : "PRINTER")
        }
        onToggleGemini={onToggleGemini}
      />

      <HolographicModal
        isOpen={activeOverlay === "HOME"}
        onClose={() => setActiveOverlay(null)}
        title="DOMOTIQUE & ACCÈS"
        width="max-w-5xl"
        height="h-[700px]"
      >
        <HomeControlWidget />
      </HolographicModal>

      <HolographicModal
        isOpen={activeOverlay === "PRINTER"}
        onClose={() => setActiveOverlay(null)}
        title="FLOTTE IMPRIMANTES"
        width="max-w-6xl"
        height="h-[700px]"
      >
        <PrinterFleetDashboard />
      </HolographicModal>

      <HolographicModal
        isOpen={activeOverlay === "GHOST"}
        onClose={() => setActiveOverlay(null)}
        title="GHOST VISION"
        width="max-w-2xl"
        height="max-h-[800px]"
      >
        <GhostModePanel />
      </HolographicModal>

      <HolographicModal
        isOpen={activeOverlay === "WORKFLOW"}
        onClose={() => setActiveOverlay(null)}
        title="AUTOMATISATION"
        width="max-w-4xl"
        height="h-[600px]"
      >
        <WorkflowPanel />
      </HolographicModal>

      <HolographicModal
        isOpen={activeOverlay === "PSYCH"}
        onClose={() => setActiveOverlay(null)}
        title="PROFIL NEURAL"
        width="max-w-3xl"
      >
        <PsychProfileWidget />
      </HolographicModal>

      <HolographicModal
        isOpen={activeOverlay === "LOGS"}
        onClose={() => setActiveOverlay(null)}
        title="JOURNAL SYSTÈME"
        width="max-w-5xl"
        height="h-[800px]"
      >
        <SystemLogsPanel />
      </HolographicModal>
    </>
  );
}
