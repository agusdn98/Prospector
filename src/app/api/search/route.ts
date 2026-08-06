import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/composio";

export async function POST(req: NextRequest) {
  const { query, city } = await req.json();
  if (!query || !city) {
    return NextResponse.json({ error: "Falta rubro o zona" }, { status: 400 });
  }
  try {
    const places = await searchPlaces(String(query), String(city));
    return NextResponse.json({ places });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error buscando en Google Maps" },
      { status: 502 }
    );
  }
}
