import { NextRequest, NextResponse } from "next/server";
import { syncLeadToSheet } from "@/lib/leads";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await syncLeadToSheet(id);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error sincronizando con Sheets" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
