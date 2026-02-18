import { useEffect, useRef } from "react";

type InteractionLike = { speak: (msg: string) => void };
type SystemStatsLike = { cpuUsage?: number | null };

export function useGreeting({
  enabled,
  systemStats,
  interaction,
}: {
  enabled: boolean;
  systemStats: SystemStatsLike;
  interaction: InteractionLike;
}) {
  const hasGreeted = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (hasGreeted.current) return;
    if (!systemStats.cpuUsage) return;

    hasGreeted.current = true;

    const hour = new Date().getHours();
    let greeting = "Bonjour";
    if (hour >= 18) greeting = "Bonsoir";
    else if (hour < 5) greeting = "Salutations nocturnes";

    const cpu = Math.round(systemStats.cpuUsage);

    const messages = [
      `${greeting} Monsieur.`,
      "Initialisation des protocoles terminée.",
      `CPU stable à ${cpu} pourcents.`,
      "Tous les systèmes sont opérationnels.",
      "Je suis à votre service.",
    ];

    let delay = 500;
    messages.forEach((msg) => {
      setTimeout(() => interaction.speak(msg), delay);
      delay += msg.length * 60 + 1000;
    });
  }, [enabled, systemStats.cpuUsage, interaction]);
}
