"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lead, Stage } from "@/lib/types";
import { STAGES } from "@/lib/stages";
import Column from "./Column";
import FilterBar, { EMPTY_FILTERS, Filters } from "./FilterBar";
import SearchModal from "./SearchModal";
import LeadDrawer from "./LeadDrawer";

export default function Board() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  async function loadLeads() {
    const res = await fetch("/api/leads");
    const data = await res.json();
    setLeads(data);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadLeads();
  }, []);

  const filtered = useMemo(() => {
    let list = [...leads];
    if (filters.q) {
      const q = filters.q.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.business.toLowerCase().includes(q) ||
          (l.city ?? "").toLowerCase().includes(q)
      );
    }
    if (filters.priority !== "TODOS") list = list.filter((l) => l.priority === filters.priority);
    if (filters.channel !== "TODOS") list = list.filter((l) => l.channel === filters.channel);
    if (filters.owner !== "TODOS") list = list.filter((l) => l.owner === filters.owner);

    list.sort((a, b) => {
      if (filters.sort === "name") return a.name.localeCompare(b.name);
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return filters.sort === "oldest" ? da - db : db - da;
    });
    return list;
  }, [leads, filters]);

  async function moveLead(leadId: string, stage: Stage) {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage } : l)));
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Prospector · SnapTable</h1>
          <p className="text-sm text-gray-500">Pipeline de prospección de bares y restaurantes</p>
        </div>
        <Link href="/conexiones" className="text-sm font-medium text-gray-500 hover:text-gray-800">
          Conexiones →
        </Link>
      </div>

      <FilterBar
        leads={leads}
        filters={filters}
        onChange={setFilters}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenSettings={() => router.push("/conexiones")}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">Cargando...</div>
      ) : (
        <div className="flex-1 overflow-x-auto px-6 py-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.map((s) => (
              <Column
                key={s.key}
                stage={s.key}
                label={s.label}
                dot={s.dot}
                leads={filtered.filter((l) => l.stage === s.key)}
                onOpen={setActiveLead}
                onDrop={moveLead}
              />
            ))}
          </div>
        </div>
      )}

      {searchOpen && (
        <SearchModal onClose={() => setSearchOpen(false)} onAdded={loadLeads} />
      )}
      {activeLead && (
        <LeadDrawer
          lead={leads.find((l) => l.id === activeLead.id) ?? activeLead}
          onClose={() => setActiveLead(null)}
          onUpdated={loadLeads}
        />
      )}
    </div>
  );
}
