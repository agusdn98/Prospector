"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Buscame bares en Gràcia, Barcelona",
  "Listame los leads en etapa Nuevo",
  "Mandale un email a los que tienen mejor rating",
];

export default function ChatPanel({ onClose, onUpdated }: { onClose: () => void; onUpdated: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hola, soy el asistente de prospección de SnapTable. Pedime que busque bares o restaurantes en una zona, que liste leads, o que le mande un email a alguno — voy actualizando el tablero mientras charlamos.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del asistente");
      setMessages([...next, { role: "assistant", content: data.reply || "(sin respuesta)" }]);
      if (data.refresh) onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error del asistente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Asistente de prospección</h2>
            <p className="text-xs text-gray-500">Claude + Composio</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg">
            ✕
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "self-end bg-gray-900 text-white"
                  : "self-start bg-gray-100 text-gray-800"
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="self-start bg-gray-100 text-gray-500 rounded-2xl px-4 py-2.5 text-sm">
              Pensando...
            </div>
          )}
          {error && <div className="self-start text-sm text-red-600 px-1">{error}</div>}
        </div>

        {messages.length <= 1 && (
          <div className="px-6 pb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="px-6 py-4 border-t border-gray-100 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribí acá..."
            className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white text-sm font-medium rounded-full px-4 py-2.5"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
