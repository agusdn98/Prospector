import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {
      sheetId: body.sheetId ?? undefined,
      sheetName: body.sheetName ?? undefined,
    },
    create: {
      id: "singleton",
      sheetId: body.sheetId ?? null,
      sheetName: body.sheetName ?? "Leads",
    },
  });
  return NextResponse.json(settings);
}
