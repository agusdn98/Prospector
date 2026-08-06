import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (Array.isArray(body.leads)) {
    const created = [];
    let skipped = 0;
    for (const l of body.leads as Record<string, unknown>[]) {
      try {
        const lead = await prisma.lead.create({
          data: {
            name: String(l.name ?? l.business ?? "Sin nombre"),
            business: String(l.business ?? l.name ?? ""),
            category: (l.category as string) ?? null,
            address: (l.address as string) ?? null,
            city: (l.city as string) ?? null,
            phone: (l.phone as string) ?? null,
            website: (l.website as string) ?? null,
            googleMapsUrl: (l.mapsUrl as string) ?? null,
            placeId: (l.placeId as string) ?? null,
            rating: (l.rating as number) ?? null,
            source: "google_maps",
          },
        });
        created.push(lead);
      } catch {
        skipped++;
      }
    }
    return NextResponse.json({ created, skipped }, { status: 201 });
  }

  const lead = await prisma.lead.create({
    data: {
      name: String(body.name ?? ""),
      business: String(body.business ?? ""),
      category: body.category ?? null,
      address: body.address ?? null,
      city: body.city ?? null,
      phone: body.phone ?? null,
      whatsapp: body.whatsapp ?? null,
      email: body.email ?? null,
      website: body.website ?? null,
      priority: body.priority ?? "MEDIA",
      owner: body.owner ?? undefined,
      notes: body.notes ?? null,
      source: "manual",
    },
  });
  return NextResponse.json(lead, { status: 201 });
}
