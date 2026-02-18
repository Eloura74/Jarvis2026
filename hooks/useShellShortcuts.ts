import { useGlobalShortcuts, createListenShortcut } from "./useGlobalShortcuts";
import { SystemStatus } from "../types";

type InteractionLike = { handleMicrophoneClick: () => void };

export function useShellShortcuts({
  enabled,
  status,
  interaction,
}: {
  enabled: boolean;
  status: SystemStatus;
  interaction: InteractionLike;
}) {
  useGlobalShortcuts({
    shortcuts: [
      createListenShortcut(() => {
        if (status === SystemStatus.IDLE) {
          interaction.handleMicrophoneClick();
        }
      }),
    ],
    enabled,
  });
}
