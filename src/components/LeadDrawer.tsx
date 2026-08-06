"use client";

import { useEffect, useState } from "react";
import { Activity, Lead, Stage } from "@/lib/types";
import { STAGES, formatDate } from "@/lib/stages";

export default function LeadDrawer({
  lead,
  onClose,
  onUpdated,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [subject, setSubject] = useState(`SnapTable para ${lead.business}`);
  const [body, setBody] = useState(
    `Hola,\n\nSoy del equipo de SnapTable. Ayudamos a bares y restaurantes como ${lead.business} a gestionar mesas y pedidos de forma más simple.\n\n¿Tenés unos minutos esta semana para una demo rápida?\n\nUn saludo.`
  );
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "error">("idle");

  useEffect(() => {
    fetch(`/api/leads/${lead.id}`)
      .then((r) => r.json())
      .then((data) => setActivities(data.activities ?? []));
  }, [lead.id]);

  async function updateLead(data: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    onUpdated();
  }

  async function handleAddNote() {
    if (!note.trim()) return;
    await updateLead({ note });
    setNote("");
    const res = await fetch(`/api/leads/${lead.id}`);
    const data = await res.json();
    setActivities(data.activities ?? []);
  }

  async function handleSendEmail() {
    setSendState("sending");
    setSendError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error enviando el email");
      setSendState("sent");
      onUpdated();
    } catch (err) {
      setSendState("error");
      setSendError(err instanceof Error ? err.message : "Error enviando el email");
    }
  }

  async function handleSync() {
    setSyncState("syncing");
    try {
      const res = await fetch(`/api/leads/${lead.id}/sync-sheet`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSyncState("idle");
      onUpdated();
    } catch {
      setSyncState("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">{lead.name || lead.business}</h2>
            <p className="text-sm text-gray-500">{lead.business}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg">
            ✕
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Etapa">
              <select
                defaultValue={lead.stage}
                onChange={(e) => updateLead({ stage: e.target.value as Stage })}
                disabled={saving}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
              >
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Prioridad">
              <select
                defaultValue={lead.priority}
                onChange={(e) => updateLead({ priority: e.target.value })}
                disabled={saving}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
              >
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm">
            <InfoRow label="Dirección" value={lead.address} />
            <InfoRow label="Ciudad" value={lead.city} />
            <InfoRow label="Teléfono" value={lead.phone} />
            <InfoRow label="Email" value={lead.email} />
            <InfoRow label="Web" value={lead.website} link={lead.website ?? undefined} />
            <InfoRow label="Google Maps" value={lead.googleMapsUrl ? "Ver en Maps" : null} link={lead.googleMapsUrl ?? undefined} />
            <InfoRow label="Rubro" value={lead.category} />
            <InfoRow label="Creado" value={formatDate(lead.createdAt)} />
          </div>

          <div>
            <button
              onClick={handleSync}
              disabled={syncState === "syncing"}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-2 w-full"
            >
              {lead.syncedToSheet
                ? "Sincronizado con Sheets ✓ (volver a enviar)"
                : syncState === "syncing"
                  ? "Sincronizando..."
                  : "Sincronizar con Google Sheets"}
            </button>
            {syncState === "error" && (
              <p className="text-xs text-red-600 mt-1">
                No se pudo sincronizar. Revisá la conexión en /conexiones.
              </p>
            )}
          </div>

          <div className="border border-gray-200 rounded-xl">
            <button
              onClick={() => setEmailOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-800"
            >
              Enviar email de prospección (Gmail)
              <span>{emailOpen ? "−" : "+"}</span>
            </button>
            {emailOpen && (
              <div className="px-4 pb-4 flex flex-col gap-2">
                {!lead.email && (
                  <p className="text-xs text-amber-600">
                    Este lead no tiene email cargado. Agregalo antes de enviar.
                  </p>
                )}
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Asunto"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <button
                  onClick={handleSendEmail}
                  disabled={!lead.email || sendState === "sending"}
                  className="bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white text-sm font-medium rounded-lg px-4 py-2"
                >
                  {sendState === "sending" ? "Enviando..." : sendState === "sent" ? "Enviado ✓" : "Enviar email"}
                </button>
                {sendState === "error" && <p className="text-xs text-red-600">{sendError}</p>}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Notas y actividad</h3>
            <div className="flex gap-2 mb-3">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Agregar una nota..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              />
              <button
                onClick={handleAddNote}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg px-3 py-2"
              >
                Agregar
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {activities.map((a) => (
                <div key={a.id} className="text-sm border-l-2 border-gray-200 pl-3 py-0.5">
                  <p className="text-gray-700">{a.note}</p>
                  <p className="text-xs text-gray-400">{formatDate(a.createdAt)}</p>
                </div>
              ))}
              {activities.length === 0 && <p className="text-sm text-gray-400">Sin actividad todavía.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase mb-1">{label}</p>
      {children}
    </div>
  );
}

function InfoRow({ label, value, link }: { label: string; value: string | null; link?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400">{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" className="text-gray-800 font-medium truncate hover:underline">
          {value}
        </a>
      ) : (
        <span className="text-gray-800 font-medium truncate">{value}</span>
      )}
    </div>
  );
}
