import { Composio } from "@composio/core";

export const TOOLKITS = {
  maps: "google_maps",
  gmail: "gmail",
  sheets: "googlesheets",
} as const;

export type ToolkitKey = keyof typeof TOOLKITS;

export const COMPOSIO_USER_ID = process.env.COMPOSIO_USER_ID || "default";

let _composio: Composio | null = null;

export function getComposio(): Composio {
  if (!_composio) {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Falta COMPOSIO_API_KEY. Configuralo en .env.local con la key de https://dashboard.composio.dev/agusdn98_workspace/~/connect"
      );
    }
    _composio = new Composio({ apiKey });
  }
  return _composio;
}

type ComposioTool = {
  slug: string;
  name?: string;
  description?: string;
  inputParameters?: { properties?: Record<string, unknown> };
};

const toolCache = new Map<string, ComposioTool[]>();

async function getToolkitTools(toolkitSlug: string): Promise<ComposioTool[]> {
  if (toolCache.has(toolkitSlug)) return toolCache.get(toolkitSlug)!;
  const composio = getComposio();
  const items = await composio.tools.getRawComposioTools({ toolkits: [toolkitSlug], limit: 60 });
  toolCache.set(toolkitSlug, items);
  return items;
}

/**
 * Composio's exact action slugs vary by toolkit version, and this environment can't reach
 * backend.composio.dev to verify them ahead of time, so tools are resolved at runtime by
 * scoring each toolkit's real actions against keyword sets (most specific first) instead of
 * hardcoding a guess.
 */
async function resolveTool(toolkitSlug: string, keywordSets: string[][]): Promise<ComposioTool> {
  const tools = await getToolkitTools(toolkitSlug);
  if (tools.length === 0) {
    throw new Error(
      `No encontramos acciones para el toolkit "${toolkitSlug}". Verificá que esté conectado en Composio.`
    );
  }
  for (const keywords of keywordSets) {
    const match = tools.find((t) => {
      const haystack = `${t.slug} ${t.name ?? ""}`.toUpperCase();
      return keywords.every((k) => haystack.includes(k.toUpperCase()));
    });
    if (match) return match;
  }
  return tools[0];
}

function propertyNames(tool: ComposioTool): string[] {
  return Object.keys(tool.inputParameters?.properties ?? {});
}

function mapArguments(tool: ComposioTool, intents: Record<string, unknown>): Record<string, unknown> {
  const props = propertyNames(tool);
  const args: Record<string, unknown> = {};
  for (const [intent, value] of Object.entries(intents)) {
    if (value === undefined) continue;
    const candidates = INTENT_ALIASES[intent] ?? [intent];
    const propMatch =
      props.find((p) => candidates.includes(p.toLowerCase())) ??
      props.find((p) => candidates.some((c) => p.toLowerCase().includes(c)));
    args[propMatch ?? intent] = value;
  }
  return args;
}

const INTENT_ALIASES: Record<string, string[]> = {
  query: ["query", "textquery", "text_query", "text", "q", "search"],
  location: ["location", "region", "near", "locationbias", "location_bias"],
  to: ["recipient_email", "to", "recipient", "email"],
  subject: ["subject"],
  body: ["body", "message", "content"],
  spreadsheetId: ["spreadsheet_id", "spreadsheetid"],
  sheetName: ["sheet_name", "sheetname", "range"],
  values: ["values", "rows", "data"],
};

export type PlaceResult = {
  placeId: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  mapsUrl: string | null;
};

function findPlacesArray(node: unknown, depth = 0): unknown[] | null {
  if (depth > 5 || node == null) return null;
  if (Array.isArray(node)) {
    const looksLikePlaces = node.some(
      (item) =>
        item &&
        typeof item === "object" &&
        ("name" in item || "displayName" in item || "title" in item)
    );
    if (looksLikePlaces) return node;
    for (const item of node) {
      const found = findPlacesArray(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof node === "object") {
    for (const value of Object.values(node as Record<string, unknown>)) {
      const found = findPlacesArray(value, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return null;
}

function normalizePlace(raw: unknown): PlaceResult | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const nameField = pick(o, ["name", "title"]);
  const displayName = o["displayName"];
  const name =
    typeof nameField === "string"
      ? nameField
      : displayName && typeof displayName === "object"
        ? String((displayName as Record<string, unknown>)["text"] ?? "")
        : String(nameField ?? "");
  if (!name) return null;
  return {
    placeId: (pick(o, ["place_id", "placeId", "id"]) as string) ?? null,
    name,
    address: (pick(o, ["formatted_address", "formattedAddress", "address", "vicinity"]) as string) ?? null,
    phone:
      (pick(o, [
        "formatted_phone_number",
        "internationalPhoneNumber",
        "nationalPhoneNumber",
        "phone",
        "phone_number",
      ]) as string) ?? null,
    website: (pick(o, ["website", "websiteUri", "website_uri"]) as string) ?? null,
    rating: (pick(o, ["rating"]) as number) ?? null,
    mapsUrl: (pick(o, ["googleMapsUri", "google_maps_uri", "url", "maps_url"]) as string) ?? null,
  };
}

export async function searchPlaces(query: string, city: string): Promise<PlaceResult[]> {
  const composio = getComposio();
  const tool = await resolveTool(TOOLKITS.maps, [
    ["TEXT", "SEARCH"],
    ["SEARCH", "PLACES"],
    ["SEARCH"],
  ]);
  const args = mapArguments(tool, { query: `${query} en ${city}`, location: city });
  const result = await composio.tools.execute(tool.slug, {
    userId: COMPOSIO_USER_ID,
    arguments: args,
    dangerouslySkipVersionCheck: true,
  });
  if (!result.successful) {
    throw new Error(result.error || "Falló la búsqueda en Google Maps");
  }
  const placesRaw = findPlacesArray(result.data) ?? [];
  return placesRaw.map(normalizePlace).filter((p): p is PlaceResult => p !== null);
}

export async function sendProspectingEmail(to: string, subject: string, body: string) {
  const composio = getComposio();
  const tool = await resolveTool(TOOLKITS.gmail, [
    ["SEND", "EMAIL"],
    ["SEND"],
  ]);
  const args = mapArguments(tool, { to, subject, body });
  const result = await composio.tools.execute(tool.slug, {
    userId: COMPOSIO_USER_ID,
    arguments: args,
    dangerouslySkipVersionCheck: true,
  });
  if (!result.successful) {
    throw new Error(result.error || "Falló el envío del email");
  }
  return result.data;
}

export async function appendLeadRow(
  spreadsheetId: string,
  sheetName: string,
  row: (string | number)[]
) {
  const composio = getComposio();
  const tool = await resolveTool(TOOLKITS.sheets, [
    ["APPEND", "VALUE"],
    ["APPEND", "ROW"],
    ["APPEND"],
    ["UPDATE", "VALUE"],
  ]);
  const args = mapArguments(tool, {
    spreadsheetId,
    sheetName,
    values: [row],
  });
  const result = await composio.tools.execute(tool.slug, {
    userId: COMPOSIO_USER_ID,
    arguments: args,
    dangerouslySkipVersionCheck: true,
  });
  if (!result.successful) {
    throw new Error(result.error || "Falló la sincronización con Google Sheets");
  }
  return result.data;
}

export type ConnectionStatus = {
  key: ToolkitKey;
  toolkit: string;
  connected: boolean;
  status: string | null;
};

export async function getConnectionStatuses(): Promise<ConnectionStatus[]> {
  const composio = getComposio();
  const entries = Object.entries(TOOLKITS) as [ToolkitKey, string][];
  return Promise.all(
    entries.map(async ([key, toolkit]) => {
      try {
        const accounts = await composio.connectedAccounts.list({
          userIds: [COMPOSIO_USER_ID],
          toolkitSlugs: [toolkit],
        });
        const items = accounts.items ?? [];
        const active = items.find((a) => a.status === "ACTIVE");
        return {
          key,
          toolkit,
          connected: Boolean(active),
          status: active?.status ?? items[0]?.status ?? null,
        };
      } catch (err) {
        console.error(`[composio] No se pudo consultar la conexión de ${toolkit}:`, err);
        return { key, toolkit, connected: false, status: null };
      }
    })
  );
}

export async function connectToolkit(key: ToolkitKey) {
  const composio = getComposio();
  const toolkit = TOOLKITS[key];
  const connectionRequest = await composio.toolkits.authorize(COMPOSIO_USER_ID, toolkit);
  return {
    id: connectionRequest.id,
    redirectUrl: connectionRequest.redirectUrl,
  };
}
