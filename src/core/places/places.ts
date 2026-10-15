import "server-only";
import { createSupabaseServerClient } from "../access/supabase-server";

export type Place = {
  id: string;
  key: string;
  name: string;
  kind: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
};

export async function getPlaces(eventId: string, kind?: string): Promise<Place[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("places")
    .select("id, key, name, kind, address, lat, lng, notes")
    .eq("event_id", eventId)
    .order("key");
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  if (error) throw new Error(`places lookup failed: ${error.message}`);
  return data;
}
