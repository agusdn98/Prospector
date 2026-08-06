import { Prisma, Stage } from "@prisma/client";
import { prisma } from "./prisma";
import { appendLeadRow, PlaceResult, searchPlaces, sendProspectingEmail } from "./composio";

const UPDATABLE_FIELDS = [
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
] as const;

export async function listLeads(filter?: { stage?: string; city?: string; q?: string; limit?: number }) {
  const where: Prisma.LeadWhereInput = {};
  if (filter?.stage) where.stage = filter.stage as Stage;
  if (filter?.city) where.city = { contains: filter.city };
  if (filter?.q) {
    where.OR = [
      { name: { contains: filter.q } },
      { business: { contains: filter.q } },
      { city: { contains: filter.q } },
    ];
  }
  return prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filter?.limit ?? 50,
  });
}

export async function getLead(id: string) {
  return prisma.lead.findUnique({ where: { id }, include: { activities: { orderBy: { createdAt: "desc" } } } });
}

export async function createLeadsFromPlaces(places: PlaceResult[], category: string, city: string) {
  const created = [];
  let skipped = 0;
  for (const p of places) {
    try {
      const lead = await prisma.lead.create({
        data: {
          name: p.name,
          business: p.name,
          category,
          address: p.address,
          city,
          phone: p.phone,
          website: p.website,
          googleMapsUrl: p.mapsUrl,
          placeId: p.placeId,
          rating: p.rating,
          source: "google_maps",
        },
      });
      created.push(lead);
    } catch {
      skipped++;
    }
  }
  return { created, skipped };
}

export async function searchAndAddLeads(query: string, city: string) {
  const places = await searchPlaces(query, city);
  const { created, skipped } = await createLeadsFromPlaces(places, query, city);
  return { found: places.length, created, skipped };
}

export async function createManualLead(data: Record<string, unknown>) {
  return prisma.lead.create({
    data: {
      name: String(data.name ?? ""),
      business: String(data.business ?? ""),
      category: (data.category as string) ?? null,
      address: (data.address as string) ?? null,
      city: (data.city as string) ?? null,
      phone: (data.phone as string) ?? null,
      whatsapp: (data.whatsapp as string) ?? null,
      email: (data.email as string) ?? null,
      website: (data.website as string) ?? null,
      priority: (data.priority as "BAJA" | "MEDIA" | "ALTA") ?? "MEDIA",
      owner: (data.owner as string) ?? undefined,
      notes: (data.notes as string) ?? null,
      source: "manual",
    },
  });
}

export async function updateLeadFields(id: string, data: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (key in data) patch[key] = data[key];
  }
  if (data.stage) patch.lastContactAt = new Date();

  const lead = await prisma.lead.update({ where: { id }, data: patch });

  if (data.stage) {
    await prisma.activity.create({
      data: { leadId: id, type: "STAGE_CHANGE", note: `Movido a ${data.stage}` },
    });
  }
  if (data.note) {
    await prisma.activity.create({
      data: { leadId: id, type: "NOTE", note: String(data.note) },
    });
  }
  return lead;
}

export async function deleteLead(id: string) {
  await prisma.lead.delete({ where: { id } });
}

export async function emailLead(id: string, subject: string, body: string) {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) throw new Error("Lead no encontrado");
  if (!lead.email) throw new Error("Este lead no tiene email cargado");

  await sendProspectingEmail(lead.email, subject, body);

  await prisma.activity.create({ data: { leadId: id, type: "EMAIL", note: subject } });
  await prisma.lead.update({ where: { id }, data: { lastContactAt: new Date() } });
  return lead;
}

export async function syncLeadToSheet(id: string) {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) throw new Error("Lead no encontrado");

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings?.sheetId) {
    throw new Error("Configurá el ID de tu Google Sheet en /conexiones");
  }

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

  await prisma.lead.update({ where: { id }, data: { syncedToSheet: true } });
  return lead;
}
