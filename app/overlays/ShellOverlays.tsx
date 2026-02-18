import React from "react";
import { Toaster } from "react-hot-toast";

import { ImageOverlay } from "../../components/ImageOverlay";
import { HolographicStatusOverlay } from "../../components/HolographicStatusOverlay";
import TrafficPopup from "../../components/TrafficPopup";
import HolographicHUD from "../../components/HolographicHUD";
import { HolographicModal } from "../../components/ui/HolographicModal";
import { toasterConfig } from "../../utils/toasterConfig";
import { TechNotification, StatusOverlayData } from "../../types/app.types";

// Force Refresh
type VisualModeLike = { query: string | null; isVisible: boolean };

export default function ShellOverlays({
  visualMode,
  setVisualMode,
  statusOverlay,
  setStatusOverlay,
  hudNotifications,
}: {
  visualMode: VisualModeLike;
  setVisualMode: (query: string | null, isVisible: boolean) => void;
  statusOverlay: StatusOverlayData | null;
  setStatusOverlay: React.Dispatch<
    React.SetStateAction<StatusOverlayData | null>
  >;
  hudNotifications: TechNotification[];
}) {
  return (
    <>
      <ImageOverlay
        query={visualMode.query}
        isVisible={visualMode.isVisible}
        onClose={() => setVisualMode(null, false)}
      />

      {statusOverlay?.type === "traffic" ? (
        <HolographicModal
          isOpen={!!statusOverlay}
          onClose={() => setStatusOverlay(null)}
          title={statusOverlay.title}
          width="max-w-6xl"
          height="h-[600px]"
        >
          <TrafficPopup routeData={statusOverlay} />
        </HolographicModal>
      ) : (
        <HolographicStatusOverlay
          data={statusOverlay}
          isVisible={!!statusOverlay}
          onClose={() => setStatusOverlay(null)}
        />
      )}

      <div className="fixed bottom-4 left-4 z-[99999] opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={() => {
            console.log("🛠️ DEBUG: Forcing test overlay...");
            setStatusOverlay({
              id: "DEBUG-001",
              title: "DEBUG_TEST",
              type: "custom",
              stats: [{ label: "TEST_MODE", value: "ACTIVE", progress: 100 }],
              lastUpdate: new Date().toLocaleTimeString(),
            } as StatusOverlayData);
          }}
          className="bg-cyan-500/20 text-cyan-500 text-[10px] px-2 py-1 rounded border border-cyan-500/50"
        >
          DEBUG_UI
        </button>
      </div>

      <Toaster {...toasterConfig} />
      <HolographicHUD notifications={hudNotifications} />
    </>
  );
}
