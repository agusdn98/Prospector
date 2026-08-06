import type { Stage } from "@prisma/client";

export const STAGES: { key: Stage; label: string; dot: string; border: string }[] = [
  { key: "NUEVO", label: "Nuevo", dot: "bg-indigo-500", border: "border-l-indigo-500" },
  { key: "PRIMER_CONTACTO", label: "Primer contacto", dot: "bg-teal-500", border: "border-l-teal-500" },
  { key: "SEGUNDO_CONTACTO", label: "Segundo contacto", dot: "bg-violet-500", border: "border-l-violet-500" },
  { key: "TERCER_CONTACTO", label: "Tercer contacto", dot: "bg-red-500", border: "border-l-red-500" },
  { key: "CUALIFICADO", label: "Cualificado", dot: "bg-emerald-500", border: "border-l-emerald-500" },
  { key: "GANADO", label: "Ganado", dot: "bg-green-600", border: "border-l-green-600" },
  { key: "PERDIDO", label: "Perdido", dot: "bg-gray-400", border: "border-l-gray-400" },
];

export const PRIORITY_LABEL: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
};

export const PRIORITY_STYLE: Record<string, string> = {
  BAJA: "bg-gray-100 text-gray-600",
  MEDIA: "bg-amber-100 text-amber-700",
  ALTA: "bg-red-100 text-red-700",
};

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h`;
  const days = Math.floor(hr / 24);
  return `${days} d`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
