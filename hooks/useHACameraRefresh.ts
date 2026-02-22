import { useEffect, useRef, useCallback } from "react";
import { fetchHAStates, HA_ENTITIES } from "../services/homeAssistantService";
import { StatusOverlayData } from "../types/app.types";

// Intervalle de rafraîchissement des données caméra/imprimante (en ms)
// 10s : bon compromis entre fraîcheur des données et charge réseau HA
const HA_REFRESH_INTERVAL_MS = 10_000;

interface UseHACameraRefreshProps {
  // L'overlay actuellement affiché (null = aucun overlay actif)
  currentOverlay: StatusOverlayData | null;
  // Callback pour mettre à jour l'overlay avec les nouvelles données HA
  setStatusOverlay: (data: StatusOverlayData | null) => void;
  // Si false, le polling est suspendu (économie de ressources)
  enabled?: boolean;
}

/**
 * Hook de rafraîchissement automatique des données Home Assistant pour les overlays.
 *
 * Fonctionnement :
 * - Surveille l'overlay actif (currentOverlay)
 * - Si l'overlay est de type "printer" ou "fleet", lance un polling HA toutes les 10s
 * - Met à jour les stats (températures, progression) sans recréer l'overlay entier
 * - S'arrête automatiquement quand l'overlay est fermé (currentOverlay = null)
 * - Nettoyage propre du timer à chaque démontage ou changement d'overlay
 *
 * @param props - Configuration du hook
 */
export function useHACameraRefresh({
  currentOverlay,
  setStatusOverlay,
  enabled = true,
}: UseHACameraRefreshProps) {
  // Ref pour accéder à la valeur courante de l'overlay sans déclencher de re-render
  const overlayRef = useRef(currentOverlay);
  const setOverlayRef = useRef(setStatusOverlay);

  // Synchroniser les refs à chaque render
  useEffect(() => {
    overlayRef.current = currentOverlay;
    setOverlayRef.current = setStatusOverlay;
  }, [currentOverlay, setStatusOverlay]);

  /**
   * Rafraîchit les données HA pour une imprimante unique.
   * Met à jour les stats de l'overlay sans changer l'ID ni le titre.
   */
  const refreshPrinterOverlay = useCallback(
    async (overlay: StatusOverlayData) => {
      try {
        const states = await fetchHAStates();
        const lastUpdate = new Date().toLocaleTimeString("fr-FR");

        // Trouver la config de l'imprimante correspondant à l'overlay
        const printer = HA_ENTITIES.PRINTERS.find(
          (p) => p.name.toLowerCase() === overlay.title.toLowerCase(),
        );
        if (!printer) return;

        const bed = states[printer.bed]?.state || "?";
        const ext = states[printer.ext]?.state || "?";
        const progValue = states[printer.progress]?.state;
        const prog = progValue ? parseFloat(progValue) : 0;

        // Mettre à jour l'overlay existant avec les nouvelles valeurs
        // On conserve l'ID, le titre et la webcamUrl pour éviter un flash visuel
        setOverlayRef.current({
          ...overlay,
          lastUpdate,
          stats: [
            {
              label: "PROGRESSION",
              value: `${prog}%`,
              progress: prog,
              status: "normal",
            },
            {
              label: "TEMP. PLATEAU",
              value: bed,
              unit: "°C",
              status: parseFloat(bed) > 90 ? "warning" : "normal",
            },
            {
              label: "TEMP. BUSE",
              value: ext,
              unit: "°C",
              status: parseFloat(ext) > 250 ? "warning" : "normal",
            },
            { label: "SYSTEM", value: "ONLINE", status: "normal" },
          ],
        });
      } catch (err) {
        // Erreur silencieuse : on ne veut pas fermer l'overlay si HA est temporairement indisponible
        console.warn("[HA Refresh] Erreur lors du rafraîchissement imprimante:", err);
      }
    },
    [],
  );

  /**
   * Rafraîchit les données HA pour la flotte complète d'imprimantes.
   * Met à jour chaque item de la flotte indépendamment.
   */
  const refreshFleetOverlay = useCallback(
    async (overlay: StatusOverlayData) => {
      try {
        const states = await fetchHAStates();
        const lastUpdate = new Date().toLocaleTimeString("fr-FR");

        // Reconstruire les items de la flotte avec les nouvelles données
        const updatedItems = HA_ENTITIES.PRINTERS.map((p) => {
          const bed = states[p.bed]?.state || "?";
          const ext = states[p.ext]?.state || "?";
          const progValue = states[p.progress]?.state;
          const prog = progValue ? parseFloat(progValue) : 0;

          // Retrouver l'item existant pour conserver webcamUrl, ip, etc.
          const existingItem = overlay.items?.find(
            (item) => item.title === p.name,
          );

          return {
            ...(existingItem || {}),
            id: `printer-${p.name}-${Date.now()}`,
            title: p.name,
            type: "printer" as const,
            ip: p.ip,
            webcamUrl: p.webcamUrl,
            image: p.webcamUrl || "/vzbot_330_render.png",
            lastUpdate,
            stats: [
              {
                label: "PROGRESSION",
                value: `${prog}%`,
                progress: prog,
                status: "normal" as const,
              },
              {
                label: "TEMP. PLATEAU",
                value: bed,
                unit: "°C",
                status: parseFloat(bed) > 90 ? ("warning" as const) : ("normal" as const),
              },
              {
                label: "TEMP. BUSE",
                value: ext,
                unit: "°C",
                status: parseFloat(ext) > 250 ? ("warning" as const) : ("normal" as const),
              },
              { label: "SYSTEM", value: "ONLINE", status: "normal" as const },
            ],
          } as StatusOverlayData;
        });

        setOverlayRef.current({
          ...overlay,
          lastUpdate,
          items: updatedItems,
        });
      } catch (err) {
        console.warn("[HA Refresh] Erreur lors du rafraîchissement flotte:", err);
      }
    },
    [],
  );

  useEffect(() => {
    // Ne démarrer le polling que si l'overlay est actif et de type imprimante/flotte
    const overlay = overlayRef.current;
    const isRefreshable =
      enabled &&
      overlay !== null &&
      (overlay.type === "printer" || overlay.type === "fleet");

    if (!isRefreshable) return;

    // Lancer le polling immédiatement puis toutes les 10s
    const doRefresh = () => {
      const current = overlayRef.current;
      if (!current) return;
      if (current.type === "printer") {
        refreshPrinterOverlay(current);
      } else if (current.type === "fleet") {
        refreshFleetOverlay(current);
      }
    };

    // Premier refresh immédiat (sans attendre le premier intervalle)
    doRefresh();

    const intervalId = setInterval(doRefresh, HA_REFRESH_INTERVAL_MS);

    // Nettoyage : arrêter le polling quand l'overlay change ou est fermé
    return () => {
      clearInterval(intervalId);
    };
  }, [
    // Redémarrer le polling si le type ou l'ID de l'overlay change
    currentOverlay?.id,
    currentOverlay?.type,
    enabled,
    refreshPrinterOverlay,
    refreshFleetOverlay,
  ]);
}
