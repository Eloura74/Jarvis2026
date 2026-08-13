import { useState, useEffect } from "react";
import { UserCheck, UserX, Lightbulb, Clock, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

interface PresenceData {
  status: "PRESENT" | "ABSENT";
  inactivitySeconds: number;
  timeoutMinutes: number;
  targetLightEntity: string;
}

export default function PresenceWidget() {
  const [data, setData] = useState<PresenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeoutInput, setTimeoutInput] = useState<number>(3);

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/presence/status");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setTimeoutInput(json.timeoutMinutes || 3);
      }
    } catch {
      // API non dispo
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleStatus = async (targetStatus: "PRESENT" | "ABSENT") => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/presence/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        toast.success(
          targetStatus === "PRESENT"
            ? "Présence confirmée (Lumières On)"
            : "Absence simulée (Lumières Off)",
        );
      }
    } catch {
      toast.error("Erreur mise à jour présence");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTimeout = async (mins: number) => {
    setTimeoutInput(mins);
    try {
      await fetch("http://localhost:3001/api/presence/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeoutMinutes: mins }),
      });
      toast.success(`Délai d'inactivité fixé à ${mins} minute(s)`);
      fetchStatus();
    } catch {
      toast.error("Erreur sauvegarde config");
    }
  };

  const isPresent = data?.status === "PRESENT";

  return (
    <div className="p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full animate-ping ${isPresent ? "bg-green-400" : "bg-amber-500"}`}
          />
          <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">
            Présence & Lumières Bureau
          </h3>
        </div>
        <button
          onClick={fetchStatus}
          className="p-1 text-gray-400 hover:text-cyan-300 transition-colors"
          title="Rafraîchir"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div
          className={`p-3 rounded-lg border flex items-center gap-3 ${isPresent ? "bg-green-950/30 border-green-500/30 text-green-300" : "bg-amber-950/30 border-amber-500/30 text-amber-300"}`}
        >
          {isPresent ? <UserCheck size={20} /> : <UserX size={20} />}
          <div>
            <div className="text-[10px] uppercase font-bold opacity-70">
              Statut Actuel
            </div>
            <div className="text-xs font-bold">
              {isPresent ? "PRÉSENT AU BUREAU" : "ABSENT / INACTIF"}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-black/30 border border-white/5 flex items-center gap-3 text-cyan-200">
          <Lightbulb size={20} className={isPresent ? "text-yellow-400 animate-pulse" : "text-gray-500"} />
          <div>
            <div className="text-[10px] uppercase font-bold opacity-70 text-gray-400">
              Lumières HA
            </div>
            <div className="text-xs font-bold truncate max-w-[120px]">
              {data?.targetLightEntity || "light.bureau"}
            </div>
          </div>
        </div>
      </div>

      {/* Extinction auto timeout config */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-gray-300 font-mono">
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-cyan-400" /> Délai d'extinction automatique :
          </span>
          <span className="font-bold text-cyan-300">{timeoutInput} min</span>
        </div>
        <div className="flex gap-2">
          {[1, 3, 5, 10].map((m) => (
            <button
              key={m}
              onClick={() => handleUpdateTimeout(m)}
              className={`flex-1 py-1 rounded text-xs font-bold transition-all border ${timeoutInput === m ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.2)]" : "bg-black/40 border-white/10 text-gray-400 hover:border-cyan-500/30"}`}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>

      {/* Manual Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => handleToggleStatus("PRESENT")}
          disabled={loading}
          className="flex-1 py-1.5 rounded bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-300 text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5"
        >
          <UserCheck size={14} /> Simuler Présence
        </button>
        <button
          onClick={() => handleToggleStatus("ABSENT")}
          disabled={loading}
          className="flex-1 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5"
        >
          <UserX size={14} /> Simuler Absence
        </button>
      </div>
    </div>
  );
}
