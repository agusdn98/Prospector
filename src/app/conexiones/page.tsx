"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ConnStatus = { key: string; toolkit: string; connected: boolean; status: string | null };

const LABELS: Record<string, { name: string; desc: string }> = {
  maps: { name: "Google Maps", desc: "Buscar bares y restaurantes por zona" },
  gmail: { name: "Gmail", desc: "Enviar emails de prospección" },
  sheets: { name: "Google Sheets", desc: "Sincronizar leads a una planilla" },
};

export default function ConexionesPage() {
  const [statuses, setStatuses] = useState<ConnStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState("");
  const [sheetName, setSheetName] = useState("Leads");
  const [savingSettings, setSavingSettings] = useState(false);

  async function loadStatuses() {
    setError(null);
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatuses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error consultando Composio");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadStatuses();
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        setSheetId(s.sheetId ?? "");
        setSheetName(s.sheetName ?? "Leads");
      });
  }, []);

  async function connect(key: string) {
    setConnecting(key);
    try {
      const res = await fetch(`/api/connections/${key}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.redirectUrl) {
        window.open(data.redirectUrl, "_blank");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error iniciando la conexión");
    } finally {
      setConnecting(null);
      setTimeout(loadStatuses, 3000);
    }
  }

  async function saveSettings() {
    setSavingSettings(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetId, sheetName }),
    });
    setSavingSettings(false);
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">
        ← Volver al pipeline
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-3">Conexiones de Composio</h1>
      <p className="text-sm text-gray-500 mt-1">
        Workspace{" "}
        <a
          href="https://dashboard.composio.dev/agusdn98_workspace/~/connect"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          agusdn98_workspace
        </a>
        . Al conectar se abre una pestaña nueva de Composio para autorizar tu cuenta.
      </p>

      {error && (
        <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {(statuses ?? Object.keys(LABELS).map((key) => ({ key, toolkit: key, connected: false, status: null }))).map(
          (s) => (
            <div
              key={s.key}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3"
            >
              <div>
                <p className="font-medium text-gray-900">{LABELS[s.key]?.name ?? s.toolkit}</p>
                <p className="text-xs text-gray-500">{LABELS[s.key]?.desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    s.connected ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {s.connected ? "Conectado" : s.status ?? "Sin conectar"}
                </span>
                <button
                  onClick={() => connect(s.key)}
                  disabled={connecting === s.key}
                  className="text-sm font-medium bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white rounded-lg px-3 py-1.5"
                >
                  {connecting === s.key ? "Abriendo..." : s.connected ? "Reconectar" : "Conectar"}
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <button onClick={loadStatuses} className="mt-4 text-sm text-gray-500 hover:text-gray-800 underline">
        Actualizar estado
      </button>

      <div className="mt-10 border-t border-gray-200 pt-6">
        <h2 className="font-semibold text-gray-900">Google Sheet de destino</h2>
        <p className="text-sm text-gray-500 mt-1">
          El ID está en la URL de tu planilla: docs.google.com/spreadsheets/d/<b>ID</b>/edit
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <input
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
            placeholder="ID de la Google Sheet"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            placeholder="Nombre de la hoja (pestaña)"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            onClick={saveSettings}
            disabled={savingSettings}
            className="self-start bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg px-4 py-2"
          >
            {savingSettings ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </main>
  );
}
