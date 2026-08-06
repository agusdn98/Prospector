"use client";

import { useState } from "react";
import { Lead, Stage } from "@/lib/types";
import LeadCard from "./LeadCard";

export default function Column({
  stage,
  label,
  dot,
  leads,
  onOpen,
  onDrop,
}: {
  stage: Stage;
  label: string;
  dot: string;
  leads: Lead[];
  onOpen: (lead: Lead) => void;
  onDrop: (leadId: string, stage: Stage) => void;
}) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const leadId = e.dataTransfer.getData("text/lead-id");
        if (leadId) onDrop(leadId, stage);
      }}
      className={`shrink-0 w-[300px] rounded-2xl transition-colors ${isOver ? "bg-black/5" : ""}`}
    >
      <div className="flex items-center gap-2 px-1 py-2 sticky top-0">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <h3 className="text-xs font-bold tracking-wide text-gray-700 uppercase">{label}</h3>
        <span className="ml-auto text-xs font-semibold text-gray-400 bg-white/70 rounded-full w-6 h-6 flex items-center justify-center">
          {leads.length}
        </span>
      </div>
      <div className="flex flex-col gap-3 min-h-[120px] pb-4">
        {leads.length === 0 ? (
          <p className="text-sm text-gray-400 px-2 py-6 text-center">Sin leads</p>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onOpen={onOpen}
              onDragStart={(e) => e.dataTransfer.setData("text/lead-id", lead.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
