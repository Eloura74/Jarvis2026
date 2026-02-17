import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  Search,
  MapPin,
  Navigation,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface LocationsMap {
  [alias: string]: string;
}

export const ConfigLocations: React.FC = () => {
  const [locations, setLocations] = useState<LocationsMap>({});
  const [viewMode, setViewMode] = useState<"list" | "edit" | "add">("list");
  const [searchQuery, setSearchQuery] = useState("");

  // Form
  const [formAlias, setFormAlias] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [originalAlias, setOriginalAlias] = useState<string | null>(null);

  // Charger les settings
  const loadSettings = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/config/settings"); // URL Absolue
      const data = await res.json();
      setLocations(data.savedLocations || {});
    } catch (error) {
      console.error("Erreur chargement settings:", error);
      toast.error("Impossible de charger les destinations.");
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Sauvegarder
  const handleSave = async () => {
    if (!formAlias || !formAddress) return;

    try {
      const newLocations = { ...locations };

      // Si on édite et qu'on a changé le nom de l'alias, supprimer l'ancien
      if (originalAlias && originalAlias !== formAlias) {
        delete newLocations[originalAlias];
      }

      newLocations[formAlias] = formAddress;

      const response = await fetch(
        "http://localhost:3001/api/config/settings", // URL Absolue
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ savedLocations: newLocations }),
        },
      );

      if (response.ok) {
        toast.success(`Destination "${formAlias}" enregistrée.`);
        setLocations(newLocations);
        setViewMode("list");
        resetForm();
      } else {
        throw new Error("Erreur sauvegarde");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la sauvegarde.");
    }
  };

  // Supprimer
  const handleDelete = async (alias: string) => {
    if (!confirm(`Supprimer la destination "${alias}" ?`)) return;

    try {
      const newLocations = { ...locations };
      delete newLocations[alias];

      const response = await fetch(
        "http://localhost:3001/api/config/settings", // URL Absolue
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ savedLocations: newLocations }),
        },
      );

      if (response.ok) {
        toast.success("Destination supprimée.");
        setLocations(newLocations);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression.");
    }
  };

  // Reset
  const resetForm = () => {
    setFormAlias("");
    setFormAddress("");
    setOriginalAlias(null);
  };

  // Filtrer
  const filteredLocations = Object.entries(locations).filter(
    ([alias, address]) =>
      alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {viewMode === "list" ? (
        <>
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Rechercher une destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-cyan-400/30 rounded-lg text-white"
              />
            </div>
            <button
              onClick={() => {
                resetForm();
                setViewMode("add");
              }}
              className="px-6 py-3 bg-cyan-500/20 border border-cyan-400 rounded-lg text-cyan-300 flex items-center gap-2 hover:bg-cyan-500/30 transition-colors"
            >
              <Plus size={20} /> Ajouter
            </button>
          </div>

          <div className="grid gap-3">
            <div className="p-4 bg-cyan-900/20 border border-cyan-500/20 rounded-lg flex items-center gap-3 text-cyan-200/80 text-sm">
              <Navigation size={18} />
              <div>
                Ces destinations peuvent être utilisées vocalement. Exemple :{" "}
                <em>
                  "Temps de trajet pour le <strong>travail</strong>"
                </em>
                .
              </div>
            </div>

            {filteredLocations.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                Aucune destination enregistrée.
              </div>
            )}

            {filteredLocations.map(([alias, address]) => (
              <div
                key={alias}
                className="bg-slate-800/50 border border-cyan-400/20 rounded-lg p-4 flex justify-between items-center group hover:border-cyan-400/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/10 rounded-full text-cyan-400">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="text-cyan-300 font-bold text-lg capitalize">
                      {alias}
                    </h3>
                    <p className="text-sm text-gray-400">{address}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFormAlias(alias);
                      setFormAddress(address);
                      setOriginalAlias(alias);
                      setViewMode("edit");
                    }}
                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded"
                    title="Modifier"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(alias)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="max-w-xl mx-auto bg-slate-800/80 border border-cyan-500/30 rounded-xl p-8 shadow-2xl">
          <h3 className="text-2xl font-bold text-cyan-300 mb-6 flex items-center gap-3">
            {viewMode === "add" ? <Plus /> : <Edit />}
            {viewMode === "add"
              ? "Nouvelle Destination"
              : "Modifier la Destination"}
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Nom (Alias Vocal)
              </label>
              <input
                type="text"
                placeholder="Ex: travail, maison, salle de sport..."
                value={formAlias}
                onChange={(e) => setFormAlias(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-cyan-400/30 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ce nom sera utilisé pour les commandes vocales.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-400 mb-2">
                Adresse Complète
              </label>
              <input
                type="text"
                placeholder="Ex: 123 Avenue des Champs-Élysées, Paris"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-cyan-400/30 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSave}
                disabled={!formAlias || !formAddress}
                className="flex-1 py-3 bg-cyan-500/80 hover:bg-cyan-500 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Sauvegarder
              </button>
              <button
                onClick={() => {
                  setViewMode("list");
                  resetForm();
                }}
                className="px-6 py-3 border border-slate-600 rounded-lg text-gray-400 hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
