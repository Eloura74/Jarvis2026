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

const STORAGE_KEY = "jarvis_conversation_history";
const MAX_HISTORY_LENGTH = 50;

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp: number;
}

export function useConversationMemory() {
  const [history, setHistory] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load conversation history", e);
      return [];
    }
  });

  // Sauvegarde automatique à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn("Failed to save conversation history (quota exceeded?)", e);
    }
  }, [history]);

  const addMessage = useCallback((role: "user" | "model", text: string) => {
    setHistory((prev) => {
      const newMessage: ChatMessage = {
        role,
        text,
        timestamp: Date.now(),
      };
      // Garder seulement les N derniers messages
      const newHistory = [...prev, newMessage].slice(-MAX_HISTORY_LENGTH);
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * Formate l'historique pour le prompt système Gemini
   * Transforme le tableau en string lisible par l'IA
   */
  const getContextForPrompt = useCallback(() => {
    if (history.length === 0) return "";

    return history
      .map(
        (msg) =>
          `${msg.role === "user" ? "User" : "J.A.R.V.I.S."}: ${msg.text}`,
      )
      .join("\n");
  }, [history]);

  return {
    history,
    addMessage,
    clearHistory,
    getContextForPrompt,
  };
}
