import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendProspectingEmail } from "@/lib/composio";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { subject, body } = await req.json();

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!lead.email) {
    return NextResponse.json({ error: "Este lead no tiene email cargado" }, { status: 400 });
  }

  try {
    await sendProspectingEmail(lead.email, subject, body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error enviando el email" },
      { status: 502 }
    );
  }

  await prisma.activity.create({
    data: { leadId: id, type: "EMAIL", note: subject },
  });
  await prisma.lead.update({ where: { id }, data: { lastContactAt: new Date() } });

  return NextResponse.json({ ok: true });
}
