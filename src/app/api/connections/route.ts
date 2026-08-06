import { NextResponse } from "next/server";
import { getConnectionStatuses } from "@/lib/composio";

export async function GET() {
  try {
    const statuses = await getConnectionStatuses();
    return NextResponse.json(statuses);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error consultando conexiones" },
      { status: 502 }
    );
  }
}
