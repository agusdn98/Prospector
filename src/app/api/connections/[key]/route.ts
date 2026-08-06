import { NextRequest, NextResponse } from "next/server";
import { connectToolkit, ToolkitKey } from "@/lib/composio";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!["maps", "gmail", "sheets"].includes(key)) {
    return NextResponse.json({ error: "Toolkit desconocido" }, { status: 400 });
  }
  try {
    const result = await connectToolkit(key as ToolkitKey);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error iniciando la conexión" },
      { status: 502 }
    );
  }
}
