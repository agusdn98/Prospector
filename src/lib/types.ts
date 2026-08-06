export type Stage =
  | "NUEVO"
  | "PRIMER_CONTACTO"
  | "SEGUNDO_CONTACTO"
  | "TERCER_CONTACTO"
  | "CUALIFICADO"
  | "GANADO"
  | "PERDIDO";

export type Priority = "BAJA" | "MEDIA" | "ALTA";

export type Lead = {
  id: string;
  name: string;
  business: string;
  category: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  googleMapsUrl: string | null;
  placeId: string | null;
  rating: number | null;
  stage: Stage;
  priority: Priority;
  channel: string;
  owner: string;
  potentialMin: number | null;
  potentialMax: number | null;
  notes: string | null;
  source: string;
  lastContactAt: string | null;
  syncedToSheet: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Activity = {
  id: string;
  leadId: string;
  type: string;
  note: string | null;
  createdAt: string;
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
