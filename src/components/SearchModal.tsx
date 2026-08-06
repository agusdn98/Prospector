"use client";

import { useState } from "react";
import { PlaceResult } from "@/lib/types";

const CATEGORIES = ["Bar", "Restaurante", "Cafetería", "Pub", "Coctelería", "Otro"];

export default function SearchModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [category, setCategory] = useState("Bar");
  const [customCategory, setCustomCategory] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const query = category === "Otro" ? customCategory : category;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query || !city) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setSelected(new Set());
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, city }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error en la búsqueda");
      setResults(data.places);
      if (data.places.length === 0) setError("No encontramos resultados. Probá con otra zona o rubro.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error en la búsqueda");
    } finally {
      setLoading(false);
    }
  }

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleAdd() {
    const chosen = results.filter((r) => selected.has(r.placeId ?? r.name));
    if (chosen.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leads: chosen.map((p) => ({
            name: p.name,
            business: p.name,
            category: query,
            address: p.address,
            city,
            phone: p.phone,
            website: p.website,
            mapsUrl: p.mapsUrl,
            placeId: p.placeId,
            rating: p.rating,
          })),
        }),
      });
      if (!res.ok) throw new Error("Error al guardar los leads");
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Buscar prospectos en Google Maps</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSearch} className="px-6 py-4 flex flex-wrap gap-3 border-b border-gray-100">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {category === "Otro" && (
            <input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Rubro"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-32"
            />
          )}
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ciudad o zona, ej. Barcelona"
            className="flex-1 min-w-[180px] rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !query || !city}
            className="bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white text-sm font-medium rounded-lg px-4 py-2"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          {results.length > 0 && (
            <div className="flex flex-col gap-2">
              {results.map((p) => {
                const key = p.placeId ?? p.name;
                return (
                  <label
                    key={key}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer ${
                      selected.has(key) ? "border-gray-900 bg-gray-50" : "border-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(key)}
                      onChange={() => toggle(key)}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900">{p.name}</p>
                      {p.address && <p className="text-xs text-gray-500">{p.address}</p>}
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        {p.phone && <span>{p.phone}</span>}
                        {p.rating && <span>★ {p.rating}</span>}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">{selected.size} seleccionados</span>
            <button
              onClick={handleAdd}
              disabled={selected.size === 0 || saving}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg px-4 py-2"
            >
              {saving ? "Guardando..." : "Agregar como leads"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
