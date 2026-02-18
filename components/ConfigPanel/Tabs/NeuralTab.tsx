import React from "react";
import { Brain } from "lucide-react";

export const NeuralTab: React.FC<{
  tokenUsage?: {
    totalTokens: number;
    promptTokens: number;
    candidatesTokens: number;
  };
}> = ({ tokenUsage }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-cyan-400/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-cyan-300 mb-4 flex items-center gap-2">
          <Brain className="text-cyan-400" />
          Activité Neuronale (Gemini 2.0)
        </h3>

        {!tokenUsage ? (
          <div className="text-center py-8 text-cyan-500/50 italic">
            Aucune donnée de session disponible.
            <br />
            Lancez une commande pour voir les métriques.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/40 p-4 rounded-lg border border-cyan-500/10">
              <div className="text-xs uppercase text-cyan-500 mb-1">
                Total Tokens
              </div>
              <div className="text-3xl font-bold text-cyan-300">
                {tokenUsage.totalTokens.toLocaleString()}
              </div>
            </div>
            <div className="bg-black/40 p-4 rounded-lg border border-cyan-500/10">
              <div className="text-xs uppercase text-gray-500 mb-1">
                Prompt (Input)
              </div>
              <div className="text-2xl font-bold text-gray-300">
                {tokenUsage.promptTokens.toLocaleString()}
              </div>
            </div>
            <div className="bg-black/40 p-4 rounded-lg border border-cyan-500/10">
              <div className="text-xs uppercase text-purple-400 mb-1">
                Response (Output)
              </div>
              <div className="text-2xl font-bold text-purple-300">
                {tokenUsage.candidatesTokens.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-800/30 border border-cyan-400/10 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-cyan-200 mb-2">
          À propos des Tokens
        </h4>
        <p className="text-sm text-gray-400 leading-relaxed">
          Les tokens sont les unités de base que l'IA utilise pour traiter
          l'information. 1000 tokens correspondent environ à 750 mots. Le modèle
          Gemini 2.0 Flash est optimisé pour la rapidité et l'efficacité à
          faible coût.
        </p>
      </div>
    </div>
  );
};
