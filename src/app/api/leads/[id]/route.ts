import { NextRequest, NextResponse } from "next/server";
import { deleteLead, getLead, updateLeadFields } from "@/lib/leads";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const lead = await updateLeadFields(id, body);
  return NextResponse.json(lead);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteLead(id);
  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(lead);
}
