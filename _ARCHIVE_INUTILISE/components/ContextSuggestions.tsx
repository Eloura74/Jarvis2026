/**
 * Composant ContextSuggestions - Suggestions contextuelles intelligentes
 *
 * Affiche des suggestions basées sur la dernière action/entité
 */

import React from "react";

interface Suggestion {
  label: string;
  command: string;
  icon?: string;
}

interface ContextSuggestionsProps {
  suggestions: Suggestion[];
  onSelect: (command: string) => void;
}

export const ContextSuggestions: React.FC<ContextSuggestionsProps> = ({
  suggestions,
  onSelect,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2 animate-slideInUp">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion.command)}
          className="group px-4 py-2 bg-blue-900/20 border border-blue-500/30 rounded-full text-sm text-blue-400 hover:bg-blue-800/40 hover:border-blue-400/50 hover:text-blue-300 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 font-mono"
        >
          {suggestion.icon && <span className="mr-2">{suggestion.icon}</span>}
          {suggestion.label}
        </button>
      ))}
    </div>
  );
};
