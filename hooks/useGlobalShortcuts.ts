/**
 * Hook pour gérer les raccourcis clavier globaux
 * 
 * Permet d'activer J.A.R.V.I.S. avec des raccourcis comme Ctrl+Space
 */

import { useEffect } from "react";

export interface GlobalShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

interface UseGlobalShortcutsProps {
  shortcuts: GlobalShortcut[];
  enabled?: boolean;
}

/**
 * Hook principal pour les raccourcis globaux
 */
export const useGlobalShortcuts = ({
  shortcuts,
  enabled = true,
}: UseGlobalShortcutsProps) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorer si l'utilisateur tape dans un input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Vérifier chaque raccourci
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shortcuts, enabled]);
};

/**
 * Raccourci pré-configuré : Ctrl+Space pour activer l'écoute
 */
export const createListenShortcut = (onActivate: () => void): GlobalShortcut => ({
  key: " ", // Space
  ctrl: true,
  description: "Activer l'écoute vocale",
  action: onActivate,
});

/**
 * Raccourci pré-configuré : Ctrl+Shift+J pour toggle J.A.R.V.I.S.
 */
export const createToggleShortcut = (onToggle: () => void): GlobalShortcut => ({
  key: "j",
  ctrl: true,
  shift: true,
  description: "Ouvrir/Fermer J.A.R.V.I.S.",
  action: onToggle,
});
