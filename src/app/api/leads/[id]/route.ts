import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  const allowed = [
    "name",
    "business",
    "category",
    "address",
    "city",
    "phone",
    "whatsapp",
    "email",
    "website",
    "stage",
    "priority",
    "channel",
    "owner",
    "potentialMin",
    "potentialMax",
    "notes",
  ];
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }
  if (body.stage) {
    data.lastContactAt = new Date();
  }

  const lead = await prisma.lead.update({ where: { id }, data });

  if (body.stage) {
    await prisma.activity.create({
      data: { leadId: id, type: "STAGE_CHANGE", note: `Movido a ${body.stage}` },
    });
  }
  if (body.note) {
    await prisma.activity.create({
      data: { leadId: id, type: "NOTE", note: String(body.note) },
    });
  }

  return NextResponse.json(lead);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { activities: { orderBy: { createdAt: "desc" } } },
  });
  if (!lead) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(lead);
}
