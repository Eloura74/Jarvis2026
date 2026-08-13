/**
 * Hook useTimer — Timers vocaux J.A.R.V.I.S.
 *
 * Permet de créer des comptes à rebours vocaux via commande naturelle.
 * "Jarvis, mets un timer de 5 minutes" → Timer → TTS d'alerte à l'expiration.
 *
 * Fonctionnalités :
 * - Plusieurs timers simultanés (différenciés par nom)
 * - Notification vocale à l'expiration
 * - Affichage du temps restant sur demande
 */

import { useState, useRef, useCallback, useEffect } from "react";

export interface JarvisTimer {
  id: string;
  /** Nom/label du timer (ex: "cuisson", "réunion") */
  label: string;
  /** Timestamp de fin en ms */
  endsAt: number;
  /** Durée totale en secondes */
  durationSeconds: number;
  /** Timer est-il encore actif */
  active: boolean;
}

interface UseTimerReturn {
  timers: JarvisTimer[];
  /** Crée un timer et retourne un message de confirmation */
  createTimer: (durationSeconds: number, label?: string) => string;
  /** Annule un timer par label ou id */
  cancelTimer: (labelOrId: string) => string;
  /** Retourne les timers actifs avec le temps restant */
  getActiveTimersText: () => string;
}

/**
 * Formate une durée en secondes → texte français lisible
 */
function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0 seconde";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} heure${h > 1 ? "s" : ""}`);
  if (m > 0) parts.push(`${m} minute${m > 1 ? "s" : ""}`);
  if (s > 0) parts.push(`${s} seconde${s > 1 ? "s" : ""}`);
  return parts.join(" et ");
}

export function useTimer(
  speak: (text: string) => void,
): UseTimerReturn {
  const [timers, setTimers] = useState<JarvisTimer[]>([]);
  const intervalsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Nettoyage au démontage
  useEffect(() => {
    const refs = intervalsRef.current;
    return () => {
      refs.forEach((t) => clearTimeout(t));
      refs.clear();
    };
  }, []);

  const createTimer = useCallback(
    (durationSeconds: number, label = "timer"): string => {
      // Valider la durée
      if (durationSeconds <= 0 || durationSeconds > 86400) {
        return "Durée invalide. Je peux gérer des timers de 1 seconde à 24 heures.";
      }

      const id = `timer_${Date.now()}`;
      const endsAt = Date.now() + durationSeconds * 1000;
      const timer: JarvisTimer = { id, label, endsAt, durationSeconds, active: true };

      setTimers((prev) => [...prev, timer]);

      // Timeout pour la notification d'expiration
      const timeout = setTimeout(() => {
        speak(`Monsieur, votre timer "${label}" de ${formatDuration(durationSeconds)} est terminé.`);
        setTimers((prev) => prev.map((t) => (t.id === id ? { ...t, active: false } : t)));
        intervalsRef.current.delete(id);
      }, durationSeconds * 1000);

      intervalsRef.current.set(id, timeout);

      return `Timer "${label}" de ${formatDuration(durationSeconds)} démarré. Je vous alerterai à l'expiration, Monsieur.`;
    },
    [speak],
  );

  const cancelTimer = useCallback((labelOrId: string): string => {
    const lower = labelOrId.toLowerCase();
    let foundId: string | undefined;
    let foundLabel: string | undefined;

    setTimers((prev) => {
      const found = prev.find(
        (t) => t.active && (t.id === labelOrId || t.label.toLowerCase().includes(lower)),
      );
      if (!found) return prev;

      foundId = found.id;
      foundLabel = found.label;
      const timeout = intervalsRef.current.get(found.id);
      if (timeout) { clearTimeout(timeout); intervalsRef.current.delete(found.id); }
      return prev.map((t) => (t.id === found.id ? { ...t, active: false } : t));
    });

    return foundId
      ? `Timer "${foundLabel}" annulé.`
      : `Aucun timer actif correspondant à "${labelOrId}" trouvé.`;
  }, []);

  const getActiveTimersText = useCallback((): string => {
    const active = timers.filter((t) => t.active);
    if (active.length === 0) return "Aucun timer en cours, Monsieur.";

    const descriptions = active.map((t) => {
      const remaining = Math.max(0, Math.round((t.endsAt - Date.now()) / 1000));
      return `"${t.label}" : ${formatDuration(remaining)} restante${remaining > 1 ? "s" : ""}`;
    });

    return `${active.length} timer${active.length > 1 ? "s" : ""} actif${active.length > 1 ? "s" : ""} : ${descriptions.join(", ")}.`;
  }, [timers]);

  return { timers, createTimer, cancelTimer, getActiveTimersText };
}
