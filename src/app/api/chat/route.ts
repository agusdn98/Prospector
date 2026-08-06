import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { AGENT_TOOLS, executeAgentTool, isMutatingTool } from "@/lib/agent-tools";

const SYSTEM_PROMPT = `Sos el asistente de prospección de SnapTable (software de gestión de mesas y pedidos para bares y restaurantes).

Ayudás al equipo comercial a encontrar bares, restaurantes y negocios similares para prospectar, gestionar el pipeline (leads.ts) y hacer el primer contacto.

Reglas:
- Cuando te pidan buscar negocios en una zona, usá buscar_y_agregar_prospectos: se agregan directo al pipeline en la etapa "Nuevo", no hace falta confirmación extra.
- Para actuar sobre un lead puntual (cambiar etapa, mandar email, sincronizar) primero necesitás su ID: usá listar_leads para encontrarlo por nombre/ciudad si no lo tenés.
- Antes de mandar un email, redactá un asunto y cuerpo breves y concretos mencionando SnapTable, a menos que el usuario ya te haya dado el texto.
- Respondé siempre en español, corto y directo, contando qué hiciste (cuántos leads agregaste, a quién le mandaste el mail, etc.).`;

const MAX_TURNS = 8;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta ANTHROPIC_API_KEY en el servidor. Agregala en .env.local." },
      { status: 500 }
    );
  }

  const { messages } = (await req.json()) as { messages: ChatMessage[] };
  const anthropic = new Anthropic({ apiKey });

  const conversation: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let refresh = false;
  const toolLog: { name: string; input: unknown }[] = [];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    let response: Anthropic.Message;
    try {
      response = await anthropic.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        tools: AGENT_TOOLS,
        messages: conversation,
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Error llamando a Claude" },
        { status: 502 }
      );
    }

    conversation.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") {
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return NextResponse.json({ reply: text, refresh, toolLog });
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      toolLog.push({ name: block.name, input: block.input });
      try {
        const result = await executeAgentTool(block.name, block.input as Record<string, unknown>);
        if (isMutatingTool(block.name)) refresh = true;
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
      } catch (err) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: err instanceof Error ? err.message : "Error ejecutando la herramienta",
          is_error: true,
        });
      }
    }
    conversation.push({ role: "user", content: toolResults });
  }

  return NextResponse.json({
    reply: "Llegué al límite de pasos para esta consulta. Probá de nuevo con un pedido más simple.",
    refresh,
    toolLog,
  });
}
