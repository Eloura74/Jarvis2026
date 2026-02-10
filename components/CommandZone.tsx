/**
 * CommandZone - Zone de commande principale premium
 * Input glassmorphism + bouton micro + suggestions
 */

import React, { useState } from "react";
import { ContextSuggestions } from "./ContextSuggestions";

interface CommandZoneProps {
  onCommand: (command: string) => void;
  onMicrophoneClick: () => void;
  isListening: boolean;
  suggestions?: Array<{ label: string; command: string; icon?: string }>;
}

export const CommandZone: React.FC<CommandZoneProps> = ({
  onCommand,
  onMicrophoneClick,
  isListening,
  suggestions = [],
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onCommand(inputValue);
      setInputValue("");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-6">
      {/* Container principal */}
      <div className="relative backdrop-blur-xl bg-gradient-to-br from-slate-900/70 to-slate-800/50 border border-cyan-500/30 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_8px_32px_rgba(6,182,212,0.2)]">
        {/* Scanlines effect */}
        <div className="absolute inset-0 scanlines rounded-2xl pointer-events-none opacity-30" />

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="relative z-10 flex items-center gap-4"
        >
          {/* Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Demandez quelque chose à JARVIS..."
            className="flex-1 bg-black/50 text-cyan-100 placeholder-cyan-700/50 border-2 border-cyan-500/20 rounded-xl px-6 py-4 font-mono text-lg focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] focus:bg-cyan-950/20 transition-all duration-300"
          />

          {/* Bouton Micro */}
          <button
            type="button"
            onClick={onMicrophoneClick}
            className={`relative overflow-hidden group w-16 h-16 rounded-xl border-2 transition-all duration-300 ${
              isListening
                ? "border-green-400 bg-green-500/20 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                : "border-cyan-500/30 bg-cyan-900/20 hover:border-cyan-400 hover:bg-cyan-800/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            }`}
          >
            {/* Gradient background hover */}
            <span className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Icon */}
            <svg
              className={`relative z-10 w-8 h-8 mx-auto ${isListening ? "text-green-400 animate-pulse" : "text-cyan-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>

            {/* Pulse effect si listening */}
            {isListening && (
              <div className="absolute inset-0 border-2 border-green-400/50 rounded-xl animate-ping" />
            )}
          </button>
        </form>

        {/* Suggestions contextuelles */}
        {suggestions.length > 0 && (
          <div className="relative z-10 mt-4">
            <ContextSuggestions
              suggestions={suggestions}
              onSelect={onCommand}
            />
          </div>
        )}
      </div>

      {/* Barre décorative dessous */}
      <div className="h-1 w-full mt-2 rounded-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
    </div>
  );
};
