"use client";

import { Lead } from "@/lib/types";

export type Filters = {
  q: string;
  sort: "recent" | "oldest" | "name";
  priority: string;
  channel: string;
  owner: string;
  potential: string;
};

export const EMPTY_FILTERS: Filters = {
  q: "",
  sort: "recent",
  priority: "TODOS",
  channel: "TODOS",
  owner: "TODOS",
  potential: "TODOS",
};

function Select({
  label,
  value,
  options,
  onChange,
  active,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm ${
        active ? "border-orange-300 bg-orange-50 text-orange-700" : "border-gray-200 bg-white text-gray-700"
      }`}
    >
      <span className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none font-medium text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "TODOS" ? "Todos" : o}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function FilterBar({
  leads,
  filters,
  onChange,
  onOpenSearch,
  onOpenSettings,
}: {
  leads: Lead[];
  filters: Filters;
  onChange: (f: Filters) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}) {
  const owners = Array.from(new Set(leads.map((l) => l.owner)));
  const channels = Array.from(new Set(leads.map((l) => l.channel)));
  const isFiltered =
    filters.q ||
    filters.priority !== "TODOS" ||
    filters.channel !== "TODOS" ||
    filters.owner !== "TODOS" ||
    filters.potential !== "TODOS";

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 py-4 bg-[#f5f1ea]/95 backdrop-blur sticky top-0 z-10 border-b border-black/5">
      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm w-64">
        <SearchIcon />
        <input
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Nombre, negocio o zona"
          className="outline-none w-full text-sm placeholder:text-gray-400"
        />
      </div>

      <Select
        label="Orden"
        value={filters.sort}
        options={["recent", "oldest", "name"]}
        onChange={(v) => onChange({ ...filters, sort: v as Filters["sort"] })}
      />
      <Select
        label="Prioridad"
        value={filters.priority}
        options={["TODOS", "BAJA", "MEDIA", "ALTA"]}
        onChange={(v) => onChange({ ...filters, priority: v })}
        active={filters.priority !== "TODOS"}
      />
      <Select
        label="Canal"
        value={filters.channel}
        options={["TODOS", ...channels]}
        onChange={(v) => onChange({ ...filters, channel: v })}
        active={filters.channel !== "TODOS"}
      />
      <Select
        label="Propietario"
        value={filters.owner}
        options={["TODOS", ...owners]}
        onChange={(v) => onChange({ ...filters, owner: v })}
        active={filters.owner !== "TODOS"}
      />

      {isFiltered && (
        <button
          onClick={() => onChange(EMPTY_FILTERS)}
          className="text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          Limpiar filtros
        </button>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-gray-800"
          title="Conexiones"
        >
          <GearIcon />
        </button>
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-full px-4 py-2.5"
        >
          <PlusIcon />
          Buscar prospectos
        </button>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
