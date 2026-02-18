/**
 * Hook personnalisé pour la gestion de la mémoire applicative
 *
 * Gère le stockage et la récupération des informations sur les applications
 * lancées par l'utilisateur (fréquence d'utilisation, chemins, dernière utilisation).
 *
 * Les données sont persistées dans localStorage pour survivre aux rechargements.
 *
 * @returns Objet contenant la mémoire et les méthodes de manipulation
 *
 * @example
 * ```typescript
 * const { memory, updateMemory, clearMemory, getMostUsedApps } = useAppMemory();
 *
 * // Enregistrer un lancement d'app
 * updateMemory('vscode', 'C:\\Program Files\\VSCode\\Code.exe');
 *
 * // Récupérer les apps les plus utilisées
 * const topApps = getMostUsedApps(5);
 * ```
 */

import { useState, useCallback } from "react";
import { AppMemory } from "../types";

// Clé de stockage dans localStorage
const STORAGE_KEY = "jarvis_app_memory";

/**
 * Charge la mémoire depuis localStorage
 *
 * @returns Tableau de mémoires applicatives (vide si aucune donnée)
 */
function loadMemoryFromStorage(): AppMemory[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);

    // Validation basique du format
    if (!Array.isArray(parsed)) {
      console.warn("⚠️ Format mémoire invalide, réinitialisation");
      return [];
    }

    // console.log(`📚 Mémoire chargée: ${parsed.length} application(s)`);
    return parsed;
  } catch (error) {
    console.error("❌ Erreur chargement mémoire:", error);
    return [];
  }
}

/**
 * Sauvegarde la mémoire dans localStorage
 *
 * @param memory - Tableau de mémoires applicatives à sauvegarder
 */
function saveMemoryToStorage(memory: AppMemory[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    console.log(`💾 Mémoire sauvegardée: ${memory.length} application(s)`);
  } catch (error) {
    console.error("❌ Erreur sauvegarde mémoire:", error);

    // Si l'erreur est due à un quota dépassé, on tente de nettoyer
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("⚠️ Quota localStorage dépassé, nettoyage...");
      // On garde seulement les 50 apps les plus récentes
      const cleaned = memory
        .sort(
          (a, b) =>
            new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime(),
        )
        .slice(0, 50);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        console.log("✅ Mémoire nettoyée et sauvegardée");
      } catch {
        console.error("❌ Impossible de sauvegarder même après nettoyage");
      }
    }
  }
}

export function useAppMemory() {
  // État : chargement initial depuis localStorage
  const [memory, setMemory] = useState<AppMemory[]>(loadMemoryFromStorage);

  /**
   * Met à jour la mémoire pour une application lancée
   *
   * Si l'application existe déjà, incrémente son compteur et met à jour lastUsed.
   * Sinon, crée une nouvelle entrée.
   *
   * @param appName - Nom de l'application (ex: "vscode", "chrome")
   * @param path - Chemin complet de l'exécutable
   */
  const updateMemory = useCallback((appName: string, path: string) => {
    setMemory((prev) => {
      // Recherche d'une entrée existante
      const existing = prev.find(
        (m) => m.appName.toLowerCase() === appName.toLowerCase(),
      );

      let updated: AppMemory[];

      if (existing) {
        // Mise à jour d'une app existante
        updated = prev.map((m) =>
          m.appName.toLowerCase() === appName.toLowerCase()
            ? {
                ...m,
                launchCount: m.launchCount + 1,
                lastUsed: new Date().toISOString(),
                lastPath: path, // Mise à jour du chemin au cas où il aurait changé
              }
            : m,
        );
        console.log(`📈 ${appName}: ${existing.launchCount + 1} lancements`);
      } else {
        // Ajout d'une nouvelle application
        updated = [
          ...prev,
          {
            appName,
            launchCount: 1,
            lastPath: path,
            lastUsed: new Date().toISOString(),
          },
        ];
        console.log(`✨ Nouvelle app mémorisée: ${appName}`);
      }

      // Sauvegarde automatique dans localStorage
      saveMemoryToStorage(updated);
      return updated;
    });
  }, []);

  /**
   * Efface toute la mémoire applicative
   *
   * ATTENTION : Cette action est irréversible !
   */
  const clearMemory = useCallback(() => {
    setMemory([]);
    localStorage.removeItem(STORAGE_KEY);
    console.log("🗑️ Mémoire applicative effacée");
  }, []);

  /**
   * Récupère les applications les plus utilisées
   *
   * @param limit - Nombre maximum d'apps à retourner (défaut: 5)
   * @returns Tableau des apps triées par fréquence d'utilisation
   */
  const getMostUsedApps = useCallback(
    (limit: number = 5): AppMemory[] => {
      return [...memory]
        .sort((a, b) => b.launchCount - a.launchCount)
        .slice(0, limit);
    },
    [memory],
  );

  /**
   * Récupère les applications utilisées récemment
   *
   * @param limit - Nombre maximum d'apps à retourner (défaut: 5)
   * @returns Tableau des apps triées par date de dernière utilisation
   */
  const getRecentApps = useCallback(
    (limit: number = 5): AppMemory[] => {
      return [...memory]
        .sort(
          (a, b) =>
            new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime(),
        )
        .slice(0, limit);
    },
    [memory],
  );

  /**
   * Recherche une application dans la mémoire
   *
   * @param appName - Nom de l'application à rechercher
   * @returns Mémoire de l'app si trouvée, undefined sinon
   */
  const findApp = useCallback(
    (appName: string): AppMemory | undefined => {
      return memory.find(
        (m) => m.appName.toLowerCase() === appName.toLowerCase(),
      );
    },
    [memory],
  );

  return {
    memory,
    updateMemory,
    clearMemory,
    getMostUsedApps,
    getRecentApps,
    findApp,
  };
}
