import React, { useState, useEffect } from "react";
import { useKernel } from "../contexts/KernelContext";
import { Play, Volume2, Mic, Activity } from "lucide-react";

export const VoiceSettingsTab: React.FC = () => {
  const { voiceSettings, setVoiceSettings } = useKernel();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testText, setTestText] = useState(
    "Bonjour monsieur, je suis JARVIS. Les systèmes sont opérationnels.",
  );
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Charger les voix disponibles
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      // Filtrer pour ne garder que les voix intéressantes (optionnel, ici on garde tout ou on trie)
      availableVoices.sort((a, b) => {
        if (a.lang < b.lang) return -1;
        if (a.lang > b.lang) return 1;
        return 0;
      });
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Tester la voix
  const handleTestVoice = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(testText);

    // Appliquer les réglages
    if (voiceSettings.voiceURI) {
      const voice = voices.find((v) => v.voiceURI === voiceSettings.voiceURI);
      if (voice) utterance.voice = voice;
    }

    utterance.pitch = voiceSettings.pitch;
    utterance.rate = voiceSettings.rate;
    utterance.volume = voiceSettings.volume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleChange = (key: keyof typeof voiceSettings, value: any) => {
    setVoiceSettings({
      ...voiceSettings,
      [key]: value,
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Mic className="text-cyan-400" size={32} />
        <div>
          <h2 className="text-2xl font-bold text-cyan-300">
            Configuration Vocale
          </h2>
          <p className="text-gray-400 text-sm">
            Personnalisez la voix et la diction de J.A.R.V.I.S.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* COLONNE GAUCHE : SÉLECTION VOIX */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-cyan-400/20 rounded-xl p-6">
            <label className="block text-sm font-medium text-cyan-400 mb-3 uppercase tracking-wider">
              Voix du Système
            </label>
            <select
              value={voiceSettings.voiceURI || ""}
              onChange={(e) => handleChange("voiceURI", e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors custom-scrollbar"
              style={{ maxHeight: "300px" }}
            >
              <option value="">-- Automatique (Français par défaut) --</option>
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-gray-500">
              * La liste dépend des voix installées sur votre système Windows.
            </div>
          </div>

          <div className="bg-slate-800/50 border border-cyan-400/20 rounded-xl p-6">
            <h3 className="text-sm font-medium text-cyan-400 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} /> Zone de Test
            </h3>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-cyan-400/30 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 min-h-[100px] mb-4 text-sm"
            />
            <button
              onClick={handleTestVoice}
              className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${
                isSpeaking
                  ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                  : "bg-cyan-500/20 text-cyan-300 border border-cyan-400 hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(0,229,255,0.3)]"
              }`}
            >
              {isSpeaking ? (
                <>Arrêter le test</>
              ) : (
                <>
                  <Play size={18} /> Tester la voix
                </>
              )}
            </button>
          </div>
        </div>

        {/* COLONNE DROITE : PARAMÈTRES */}
        <div className="bg-slate-800/50 border border-cyan-400/20 rounded-xl p-6 space-y-8">
          {/* VITESSE */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-cyan-400 uppercase tracking-wider">
                Vitesse (Rate)
              </label>
              <span className="text-xs text-cyan-300 font-mono bg-cyan-900/40 px-2 py-0.5 rounded">
                x{voiceSettings.rate.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={voiceSettings.rate}
              onChange={(e) => handleChange("rate", parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between mt-1 text-[10px] text-gray-500">
              <span>Lent</span>
              <span>Normal</span>
              <span>Rapide</span>
            </div>
          </div>

          {/* HAUTEUR */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-cyan-400 uppercase tracking-wider">
                Hauteur (Pitch)
              </label>
              <span className="text-xs text-cyan-300 font-mono bg-cyan-900/40 px-2 py-0.5 rounded">
                {voiceSettings.pitch.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={voiceSettings.pitch}
              onChange={(e) =>
                handleChange("pitch", parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between mt-1 text-[10px] text-gray-500">
              <span>Grave</span>
              <span>Normal</span>
              <span>Aigu</span>
            </div>
          </div>

          {/* VOLUME */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Volume2 size={16} /> Volume
              </label>
              <span className="text-xs text-cyan-300 font-mono bg-cyan-900/40 px-2 py-0.5 rounded">
                {Math.round(voiceSettings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceSettings.volume}
              onChange={(e) =>
                handleChange("volume", parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* PRÉSETS RAPIDES */}
          <div className="pt-4 border-t border-gray-700/50">
            <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
              Préréglages JARVIS
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  setVoiceSettings({ ...voiceSettings, pitch: 1.0, rate: 1.0 })
                }
                className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded text-xs text-gray-300 transition-colors"
              >
                Standard
              </button>
              <button
                onClick={() =>
                  setVoiceSettings({ ...voiceSettings, pitch: 0.8, rate: 1.1 })
                }
                className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded text-xs text-gray-300 transition-colors"
              >
                Cinétique (Grave/Rapide)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
