"use client";

import { Lead } from "@/lib/types";
import { STAGES, formatDate, timeAgo, initials, PRIORITY_STYLE } from "@/lib/stages";

export default function LeadCard({
  lead,
  onOpen,
  onDragStart,
}: {
  lead: Lead;
  onOpen: (lead: Lead) => void;
  onDragStart: (e: React.DragEvent, lead: Lead) => void;
}) {
  const stageInfo = STAGES.find((s) => s.key === lead.stage)!;
  const hasPotential = lead.potentialMin != null || lead.potentialMax != null;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${stageInfo.border} p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow`}
    >
      {hasPotential && (
        <div className="mb-2 inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          {lead.potentialMin ?? 0}-{lead.potentialMax ?? lead.potentialMin}€/mes
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-[15px] text-gray-900 truncate">{lead.name || lead.business}</p>
          <p className="text-sm text-gray-500 truncate">{lead.business}</p>
        </div>
        {lead.priority === "ALTA" && (
          <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${PRIORITY_STYLE[lead.priority]}`}>
            Alta
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
        <CalendarIcon />
        <span>Creado {formatDate(lead.createdAt)}</span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${stageInfo.dot}`} />
          <span className="text-gray-500">
            {lead.lastContactAt ? "En seguimiento" : "Sin contactar"} ·{" "}
            {timeAgo(lead.lastContactAt ?? lead.createdAt)}
          </span>
        </div>
        <div className="w-6 h-6 rounded-full bg-gray-800 text-white text-[10px] font-semibold flex items-center justify-center">
          {initials(lead.owner)}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => onOpen(lead)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg py-2"
        >
          <FicheIcon />
          Ver ficha
        </button>
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
            title="Llamar"
          >
            <PhoneIcon />
          </a>
        )}
        {lead.whatsapp && (
          <a
            href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
            title="WhatsApp"
          >
            <WhatsAppIcon />
          </a>
        )}
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function FicheIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.85.5 3.58 1.36 5.07L2 22l5.19-1.44a9.9 9.9 0 0 0 4.85 1.24h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.13-2.9-7C17.19 3.03 14.7 2 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.11.86.83-3.03-.2-.31a8.18 8.18 0 0 1-1.26-4.42c0-4.53 3.7-8.22 8.24-8.22 2.2 0 4.27.86 5.83 2.42a8.16 8.16 0 0 1 2.41 5.81c0 4.53-3.7 8.22-8.24 8.22zm4.51-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.81-.78.97-.14.17-.29.19-.53.06-.25-.12-1.04-.38-1.99-1.22-.73-.66-1.23-1.46-1.37-1.71-.14-.24-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.24-.87.85-.87 2.08 0 1.23.89 2.41 1.02 2.58.12.17 1.75 2.67 4.24 3.74.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.23-.17-.48-.29z" />
    </svg>
  );
}
