/**
 * SettingsTab — Paramètres Généraux de J.A.R.V.I.S.
 *
 * Regroupe : Wake Word, Voix TTS complète (remplace l'onglet "Voix avancée"),
 * Langue STT, Thème, Features.
 * Persistance 100% backend via useAppSettings.
 * Style aligné sur VoiceSettingsTab (cards slate-800/50, border cyan-400/20).
 */

import React, { useState, useEffect } from "react";
import {
  Mic,
  Volume2,
  Globe,
  Palette,
  Zap,
  Play,
  StopCircle,
  Save,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import { useAppSettings } from "../../../hooks/useAppSettings";
import { JarvisSettings } from "../../../services/configService";

// ─── Composant principal ──────────────────────────────────────────────────────
export const SettingsTab: React.FC = () => {
  const { settings, isLoaded, updateSettings, resetToDefaults } =
    useAppSettings();

  // État local pour les modifications non encore sauvegardées
  const [draft, setDraft] = useState<JarvisSettings>(settings);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Voix disponibles pour le sélecteur TTS
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  // Sync one-shot : quand le backend répond, on écrase le draft (defaults) par les vraies valeurs
  useEffect(() => {
    if (isLoaded && !hasInitialized) {
      setDraft(settings);
      setHasInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // Charger les voix système
  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      v.sort((a, b) => a.lang.localeCompare(b.lang));
      setVoices(v);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Mise à jour du draft local
  const patch = (p: Partial<JarvisSettings>) => {
    setDraft((prev) => ({ ...prev, ...p }));
    setIsDirty(true);
    setSaveSuccess(false);
  };

  // Sauvegarde backend
  const handleSave = async () => {
    setIsSaving(true);
    await updateSettings(draft);
    setIsSaving(false);
    setIsDirty(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Reset aux defaults
  const handleReset = async () => {
    if (!confirm("Remettre tous les paramètres aux valeurs par défaut ?"))
      return;
    await resetToDefaults();
    setIsDirty(false);
    setSaveSuccess(false);
  };

  // Test voix
  const handleTestVoice = () => {
    if (isTesting) {
      window.speechSynthesis.cancel();
      setIsTesting(false);
      return;
    }
    const utt = new SpeechSynthesisUtterance(
      "Bonjour Monsieur. Les systèmes sont opérationnels.",
    );
    if (draft.voiceURI) {
      const v = voices.find((x) => x.voiceURI === draft.voiceURI);
      if (v) utt.voice = v;
    }
    utt.pitch = draft.voicePitch;
    utt.rate = draft.voiceRate;
    utt.volume = draft.voiceVolume;
    utt.onstart = () => setIsTesting(true);
    utt.onend = () => setIsTesting(false);
    utt.onerror = () => setIsTesting(false);
    window.speechSynthesis.speak(utt);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-48 text-cyan-500/50 text-sm font-mono animate-pulse">
        Chargement des paramètres...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-4 mb-6">
        <Mic className="text-cyan-400" size={32} />
        <div>
          <h2 className="text-2xl font-bold text-cyan-300">
            Paramètres Système
          </h2>
          <p className="text-gray-400 text-sm">
            Wake Word, voix, apparence et fonctionnalités
          </p>
        </div>
      </div>

      {/* ── LIGNE 1 : Wake Word + Langue & Thème ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Wake Word */}
        <div className="bg-slate-800/50 border border-cyan-400/20 rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-medium text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Mic size={16} /> Wake Word
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">
                Écoute continue "JARVIS"
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Détection vocale permanente en arrière-plan
              </p>
            </div>
            <button
              onClick={() => patch({ wakeWordEnabled: !draft.wakeWordEnabled })}
              className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ml-4 ${draft.wakeWordEnabled ? "bg-cyan-500" : "bg-slate-600"}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${draft.wakeWordEnabled ? "translate-x-6" : "translate-x-0"}`}
              />
            </button>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-cyan-400 uppercase tracking-wider">
                Sensibilité
              </label>
              <span className="text-xs text-cyan-300 font-mono bg-cyan-900/40 px-2 py-0.5 rounded">
                {Math.round(draft.wakeWordThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={draft.wakeWordThreshold}
              onChange={(e) =>
                patch({ wakeWordThreshold: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between mt-1 text-[10px] text-gray-500">
              <span>Permissif</span>
              <span>Strict</span>
            </div>
          </div>
        </div>

        {/* Langue STT + Thème */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-cyan-400/20 rounded-xl p-6">
            <h3 className="text-sm font-medium text-cyan-400 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Globe size={16} /> Langue de reconnaissance
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: "fr-FR", label: "🇫🇷 Français" },
                  { value: "en-US", label: "🇺🇸 English US" },
                  { value: "en-GB", label: "🇬🇧 English UK" },
                ] as const
              ).map((lang) => (
                <button
                  key={lang.value}
                  onClick={() =>
                    patch({
                      voiceLanguage:
                        lang.value as JarvisSettings["voiceLanguage"],
                    })
                  }
                  className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all ${
                    draft.voiceLanguage === lang.value
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                      : "bg-slate-700/50 border-slate-600 text-gray-400 hover:border-slate-500"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 border border-cyan-400/20 rounded-xl p-6">
            <h3 className="text-sm font-medium text-cyan-400 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Palette size={16} /> Thème
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  {
                    value: "ironman",
                    label: "Iron Man",
                    color: "text-yellow-400",
                    border: "border-yellow-500/50",
                    bg: "bg-yellow-500/10",
                  },
                  {
                    value: "classic",
                    label: "Classic",
                    color: "text-cyan-400",
                    border: "border-cyan-500/50",
                    bg: "bg-cyan-500/10",
                  },
                  {
                    value: "matrix",
                    label: "Matrix",
                    color: "text-green-400",
                    border: "border-green-500/50",
                    bg: "bg-green-500/10",
                  },
                ] as const
              ).map((t) => (
                <button
                  key={t.value}
                  onClick={() =>
                    patch({ theme: t.value as JarvisSettings["theme"] })
                  }
                  className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    draft.theme === t.value
                      ? `${t.border} ${t.bg}`
                      : "border-slate-700 bg-slate-800/50"
                  }`}
                >
                  <p className={`font-mono text-xs ${t.color}`}>{t.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── LIGNE 2 : Voix TTS (même layout que VoiceSettingsTab) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sélecteur voix + Zone test */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-cyan-400/20 rounded-xl p-6">
            <label className="block text-sm font-medium text-cyan-400 mb-3 uppercase tracking-wider">
              Voix du Système
            </label>
            <select
              value={draft.voiceURI || ""}
              onChange={(e) => patch({ voiceURI: e.target.value || null })}
              className="w-full px-4 py-3 bg-black/40 border border-cyan-400/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-colors"
            >
              <option value="">-- Automatique (Français par défaut) --</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              * Dépend des voix installées sur Windows.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-cyan-400/20 rounded-xl p-6">
            <h3 className="text-sm font-medium text-cyan-400 mb-4 uppercase tracking-wider">
              Zone de Test
            </h3>
            <button
              onClick={handleTestVoice}
              className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${
                isTesting
                  ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                  : "bg-cyan-500/20 text-cyan-300 border border-cyan-400 hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(0,229,255,0.3)]"
              }`}
            >
              {isTesting ? (
                <>
                  <StopCircle size={18} /> Arrêter le test
                </>
              ) : (
                <>
                  <Play size={18} /> Tester la voix
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sliders + Préréglages */}
        <div className="bg-slate-800/50 border border-cyan-400/20 rounded-xl p-6 space-y-8">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-cyan-400 uppercase tracking-wider">
                Vitesse (Rate)
              </label>
              <span className="text-xs text-cyan-300 font-mono bg-cyan-900/40 px-2 py-0.5 rounded">
                x{draft.voiceRate.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={draft.voiceRate}
              onChange={(e) => patch({ voiceRate: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between mt-1 text-[10px] text-gray-500">
              <span>Lent</span>
              <span>Normal</span>
              <span>Rapide</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-cyan-400 uppercase tracking-wider">
                Hauteur (Pitch)
              </label>
              <span className="text-xs text-cyan-300 font-mono bg-cyan-900/40 px-2 py-0.5 rounded">
                {draft.voicePitch.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={2.0}
              step={0.1}
              value={draft.voicePitch}
              onChange={(e) =>
                patch({ voicePitch: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between mt-1 text-[10px] text-gray-500">
              <span>Grave</span>
              <span>Normal</span>
              <span>Aigu</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Volume2 size={16} /> Volume
              </label>
              <span className="text-xs text-cyan-300 font-mono bg-cyan-900/40 px-2 py-0.5 rounded">
                {Math.round(draft.voiceVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={draft.voiceVolume}
              onChange={(e) =>
                patch({ voiceVolume: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="pt-4 border-t border-gray-700/50">
            <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
              Préréglages JARVIS
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Standard", pitch: 1.0, rate: 1.0 },
                { label: "Grave / Rapide", pitch: 0.8, rate: 1.1 },
                { label: "Doux / Lent", pitch: 1.1, rate: 0.9 },
                { label: "Dynamique", pitch: 1.2, rate: 1.2 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() =>
                    patch({ voicePitch: p.pitch, voiceRate: p.rate })
                  }
                  className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded text-xs text-gray-300 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── FONCTIONNALITÉS ── */}
      <div className="bg-slate-800/50 border border-cyan-400/20 rounded-xl p-6">
        <h3 className="text-sm font-medium text-cyan-400 uppercase tracking-wider flex items-center gap-2 mb-4">
          <Zap size={16} /> Fonctionnalités
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              key: "ghostModeEnabled" as const,
              label: "Mode Fantôme",
              desc: "Masque les indicateurs visuels d'activité",
            },
            {
              key: "psychProfileEnabled" as const,
              label: "Profil Psychologique",
              desc: "Adapte le ton selon le sentiment détecté",
            },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 bg-slate-900/40 rounded-lg border border-slate-700/30"
            >
              <div>
                <p className="text-sm text-white font-medium">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <button
                onClick={() => patch({ [key]: !draft[key] })}
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ml-4 ${draft[key] ? "bg-cyan-500" : "bg-slate-600"}`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${draft[key] ? "translate-x-6" : "translate-x-0"}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── BARRE D'ACTIONS ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all border ${
            saveSuccess
              ? "bg-green-500/20 border-green-400/40 text-green-300"
              : isDirty
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                : "bg-slate-800/30 border-slate-700/30 text-slate-500 cursor-not-allowed"
          }`}
        >
          {saveSuccess ? (
            <>
              <CheckCircle size={16} /> Sauvegardé
            </>
          ) : isSaving ? (
            "Sauvegarde..."
          ) : (
            <>
              <Save size={16} /> Sauvegarder les paramètres
            </>
          )}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-3 rounded-lg border border-red-500/20 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition-all flex items-center gap-2 text-sm"
        >
          <RotateCcw size={14} /> Défauts
        </button>
      </div>
    </div>
  );
};
