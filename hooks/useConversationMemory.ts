/**
 * useConversationMemory - Gestionnaire de Mémoire Conversationnelle
 *
 * Persiste l'historique des échanges avec J.A.R.V.I.S. pour maintenir le contexte
 * entre les rechargements de page (F5).
 *
 * Fonctionnalités :
 * - Sauvegarde automatique dans localStorage
 * - Limitation de la taille de l'historique (ex: 50 derniers messages)
 * - Formatage pour injection dans le contexte Gemini
 */

import { useState, useCallback, useEffect } from "react";

/** Clé de stockage localStorage */
const STORAGE_KEY = "jarvis_conversation_history";

/** Nombre maximum de messages à conserver en mémoire */
const MAX_MESSAGES = 50;

/** Structure d'un message de conversation */
export interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

/**
 * Charge l'historique depuis localStorage
 * 
 * @returns Tableau de messages ou tableau vide si aucun historique
 */
const loadHistoryFromStorage = (): ChatMessage[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    
    // Reconvertir les timestamps string en Date
    return parsed.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  } catch (error) {
    console.error("Erreur chargement historique localStorage :", error);
    return [];
  }
};

/**
 * Sauvegarde l'historique dans localStorage
 * 
 * @param history - Tableau de messages à sauvegarder
 */
const saveHistoryToStorage = (history: ChatMessage[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Erreur sauvegarde historique localStorage :", error);
  }
};

/**
 * Hook de gestion de la mémoire conversationnelle
 * 
 * @returns Fonctions et données de l'historique
 */
export const useConversationMemory = () => {
  // Initialisation avec les données du localStorage
  const [history, setHistory] = useState<ChatMessage[]>(() => {
    return loadHistoryFromStorage();
  });

  /**
   * Sauvegarde automatique dans localStorage à chaque modification
   */
  useEffect(() => {
    saveHistoryToStorage(history);
  }, [history]);

  /**
   * Ajoute un message à l'historique
   * 
   * @param role - Rôle du message ("user" ou "model")
   * @param text - Contenu du message
   */
  const addMessage = useCallback((role: "user" | "model", text: string) => {
    const newMessage: ChatMessage = {
      role,
      text,
      timestamp: new Date(),
    };

    setHistory((prev) => {
      const updated = [...prev, newMessage];
      // Garder seulement les N derniers messages (rotation)
      return updated.slice(-MAX_MESSAGES);
    });
  }, []);

  /**
   * Réinitialise complètement l'historique
   * (supprime aussi de localStorage)
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * Génère le contexte formaté pour Gemini
   * 
   * @returns String formaté avec les derniers échanges
   */
  const getContext = useCallback(() => {
    // Garder seulement les 10 derniers messages pour le contexte Gemini
    // (éviter de dépasser les limites de tokens)
    const recentHistory = history.slice(-10);
    
    return recentHistory
      .map((msg) => `${msg.role === "user" ? "User" : "JARVIS"}: ${msg.text}`)
      .join("\n");
  }, [history]);

  /**
   * Exporte l'historique en JSON
   * 
   * @returns String JSON de l'historique complet
   */
  const exportHistory = useCallback(() => {
    return JSON.stringify(history, null, 2);
  }, [history]);

  /**
   * Importe un historique depuis JSON
   * 
   * @param jsonData - String JSON à importer
   * @returns true si succès, false sinon
   */
  const importHistory = useCallback((jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      
      // Validation basique
      if (!Array.isArray(parsed)) {
        throw new Error("Format invalide : doit être un tableau");
      }

      // Reconvertir les timestamps
      const imported = parsed.map((msg: any) => ({
        role: msg.role,
        text: msg.text,
        timestamp: new Date(msg.timestamp),
      }));

      setHistory(imported);
      return true;
    } catch (error) {
      console.error("Erreur import historique :", error);
      return false;
    }
  }, []);

  return {
    history,
    addMessage,
    clearHistory,
    getContext,
    exportHistory,
    importHistory,
  };
};
