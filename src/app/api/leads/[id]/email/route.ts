import { NextRequest, NextResponse } from "next/server";
import { emailLead } from "@/lib/leads";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { subject, body } = await req.json();

  try {
    await emailLead(id, subject, body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error enviando el email" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
