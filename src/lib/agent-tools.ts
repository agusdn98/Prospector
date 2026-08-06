import Anthropic from "@anthropic-ai/sdk";
import { emailLead, listLeads, searchAndAddLeads, syncLeadToSheet, updateLeadFields } from "./leads";

const STAGE_ENUM = [
  "NUEVO",
  "PRIMER_CONTACTO",
  "SEGUNDO_CONTACTO",
  "TERCER_CONTACTO",
  "CUALIFICADO",
  "GANADO",
  "PERDIDO",
];

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "buscar_y_agregar_prospectos",
    description:
      "Busca negocios (bares, restaurantes, cafeterías, etc.) en Google Maps por rubro y zona, y los agrega directamente al pipeline como leads nuevos.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Rubro a buscar, ej. 'bar', 'restaurante', 'cafetería'" },
        city: { type: "string", description: "Ciudad o zona, ej. 'Barcelona' o 'Gràcia, Barcelona'" },
      },
      required: ["query", "city"],
    },
  },
  {
    name: "listar_leads",
    description: "Lista los leads existentes en el pipeline, opcionalmente filtrados por etapa, ciudad o texto libre.",
    input_schema: {
      type: "object",
      properties: {
        stage: { type: "string", enum: STAGE_ENUM, description: "Filtrar por etapa del pipeline" },
        city: { type: "string", description: "Filtrar por ciudad (coincidencia parcial)" },
        q: { type: "string", description: "Buscar por nombre o negocio (coincidencia parcial)" },
        limit: { type: "number", description: "Máximo de resultados, default 50" },
      },
    },
  },
  {
    name: "actualizar_lead",
    description: "Cambia la etapa/prioridad de un lead y/o le agrega una nota de seguimiento.",
    input_schema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "ID del lead (sacalo de listar_leads)" },
        stage: { type: "string", enum: STAGE_ENUM },
        priority: { type: "string", enum: ["BAJA", "MEDIA", "ALTA"] },
        note: { type: "string", description: "Nota de actividad a agregar, ej. resumen de una llamada" },
      },
      required: ["leadId"],
    },
  },
  {
    name: "enviar_email",
    description: "Manda un email de prospección a un lead usando Gmail (requiere que el lead tenga email cargado).",
    input_schema: {
      type: "object",
      properties: {
        leadId: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["leadId", "subject", "body"],
    },
  },
  {
    name: "sincronizar_sheet",
    description: "Sincroniza un lead a la Google Sheet configurada en /conexiones.",
    input_schema: {
      type: "object",
      properties: {
        leadId: { type: "string" },
      },
      required: ["leadId"],
    },
  },
];

const MUTATING_TOOLS = new Set([
  "buscar_y_agregar_prospectos",
  "actualizar_lead",
  "enviar_email",
  "sincronizar_sheet",
]);

export function isMutatingTool(name: string): boolean {
  return MUTATING_TOOLS.has(name);
}

export async function executeAgentTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "buscar_y_agregar_prospectos": {
      const { found, created, skipped } = await searchAndAddLeads(String(input.query), String(input.city));
      return {
        encontrados: found,
        agregados: created.length,
        omitidos_duplicados: skipped,
        leads: created.map((l) => ({ id: l.id, name: l.name, address: l.address, phone: l.phone })),
      };
    }
    case "listar_leads": {
      const leads = await listLeads({
        stage: input.stage as string | undefined,
        city: input.city as string | undefined,
        q: input.q as string | undefined,
        limit: input.limit as number | undefined,
      });
      return leads.map((l) => ({
        id: l.id,
        name: l.name,
        business: l.business,
        city: l.city,
        stage: l.stage,
        priority: l.priority,
        phone: l.phone,
        email: l.email,
        rating: l.rating,
      }));
    }
    case "actualizar_lead": {
      const { leadId, ...rest } = input;
      const lead = await updateLeadFields(String(leadId), rest);
      return { id: lead.id, stage: lead.stage, priority: lead.priority };
    }
    case "enviar_email": {
      await emailLead(String(input.leadId), String(input.subject), String(input.body));
      return { ok: true };
    }
    case "sincronizar_sheet": {
      await syncLeadToSheet(String(input.leadId));
      return { ok: true };
    }
    default:
      throw new Error(`Tool desconocida: ${name}`);
  }
}
