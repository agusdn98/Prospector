import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appendLeadRow } from "@/lib/composio";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings?.sheetId) {
    return NextResponse.json(
      { error: "Configurá el ID de tu Google Sheet en /conexiones" },
      { status: 400 }
    );
  }

  try {
    await appendLeadRow(settings.sheetId, settings.sheetName, [
      lead.name,
      lead.business,
      lead.category ?? "",
      lead.address ?? "",
      lead.phone ?? "",
      lead.email ?? "",
      lead.website ?? "",
      lead.stage,
      lead.owner,
      lead.createdAt.toISOString(),
    ]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error sincronizando con Sheets" },
      { status: 502 }
    );
  }

  await prisma.lead.update({ where: { id }, data: { syncedToSheet: true } });
  return NextResponse.json({ ok: true });
}
