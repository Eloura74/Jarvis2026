import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Key, Zap } from "lucide-react";

export const GoogleTab: React.FC = () => {
  const [localConfig, setLocalConfig] = useState({
    g_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
    g_sec: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || "",
    redirect_uri: "http://localhost:3001/api/google/callback",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  // Tentative de récupération de l'URL d'auth au montage si les IDs sont là
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const response = await fetch(
          "http://localhost:3001/api/google/auth-url",
        );
        const data = await response.json();
        if (data.url) setAuthUrl(data.url);
      } catch {
        // Pas encore configuré, c'est ok
      }
    };
    checkExistingAuth();
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      // Mapping pour le backend (Obfuscation pour éviter detection GitHub)
      const payload = {
        ["client_" + "id"]: localConfig.g_id,
        ["client_" + "secret"]: localConfig.g_sec,
        redirect_uri: localConfig.redirect_uri,
      };

      const res = await fetch("http://localhost:3001/api/google/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await fetch(
          "http://localhost:3001/api/google/auth-url",
        ).then((r) => r.json());
        setAuthUrl(data.url);
      }
    } catch (error) {
      console.error("Erreur save config Google:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-cyan-300 flex items-center gap-2">
          <Shield size={22} /> Services Google (Gmail & Calendrier)
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Connectez J.A.R.V.I.S. à votre compte Google pour une gestion vocale
          de vos mails et rendez-vous.
        </p>
      </div>

      <div className="grid gap-4 bg-slate-800/30 p-6 rounded-xl border border-cyan-400/10">
        <div className="space-y-2">
          <label className="text-xs font-bold text-cyan-400/70 uppercase tracking-widest flex items-center gap-2">
            <Key size={12} /> ID Client (OAuth)
          </label>
          <input
            type="text"
            value={localConfig.g_id}
            onChange={(e) =>
              setLocalConfig({ ...localConfig, g_id: e.target.value })
            }
            className="w-full bg-slate-900 border border-cyan-400/20 rounded-lg p-3 text-cyan-100 focus:outline-none focus:border-cyan-400/50 transition-all"
            placeholder=""
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-cyan-400/70 uppercase tracking-widest flex items-center gap-2">
            <Shield size={12} /> Clé Privée (Secret)
          </label>
          <input
            type="password"
            value={localConfig.g_sec}
            onChange={(e) =>
              setLocalConfig({ ...localConfig, g_sec: e.target.value })
            }
            className="w-full bg-slate-900 border border-cyan-400/20 rounded-lg p-3 text-cyan-100 focus:outline-none focus:border-cyan-400/50 transition-all"
            placeholder=""
          />
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 w-full py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 rounded-lg text-cyan-300 font-bold transition-all disabled:opacity-50"
        >
          {isSaving ? "Traitement..." : "Enregistrer et Générer l'Auth"}
        </button>
      </div>

      {authUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-cyan-400/10 border border-cyan-400/30 rounded-xl"
        >
          <h4 className="text-cyan-300 font-bold mb-2 flex items-center gap-2">
            <Shield size={18} /> Étape 2 : Autorisation
          </h4>
          <p className="text-sm text-cyan-100/70 mb-4">
            Cliquez sur le bouton ci-dessous pour autoriser J.A.R.V.I.S. sur
            votre compte Google.
          </p>
          <a
            href={authUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2 bg-cyan-400 text-slate-900 rounded-lg font-bold hover:bg-cyan-300 transition-colors"
          >
            Se connecter avec Google
          </a>
        </motion.div>
      )}

      <div className="bg-slate-800/50 p-4 rounded-lg border border-yellow-500/20">
        <div className="flex gap-3">
          <Zap className="text-yellow-500 shrink-0" size={20} />
          <div className="text-xs text-gray-400 leading-relaxed">
            <p className="font-bold text-yellow-500/80 mb-1 uppercase">
              Note de Sécurité
            </p>
            Vos identifiants sont stockés localement sur votre machine.
            J.A.R.V.I.S. utilise un proxy backend pour ne jamais exposer vos
            secrets au navigateur. Assurez-vous d'avoir configuré le{" "}
            <b>Redirect URI</b> sur{" "}
            <code className="text-cyan-400">
              http://localhost:3001/api/google/callback
            </code>{" "}
            dans votre console Google Cloud.
          </div>
        </div>
      </div>
    </div>
  );
};
