import "server-only";
import { createSupabaseServerClient } from "../access/supabase-server";

export type AgendaItem = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  details: string | null;
  dressCode: string | null;
  place: { name: string; address: string | null; lat: number | null; lng: number | null; notes: string | null } | null;
  /** Names of the audiences this item is limited to; empty means everyone. */
  audiences: string[];
};

/** RLS does the filtering: the query asks for everything and gets only what this viewer may see. */
export async function getVisibleAgenda(eventId: string): Promise<AgendaItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("agenda_items")
    .select(
      "id, title, starts_at, ends_at, details, dress_code, place:places(name, address, lat, lng, notes), audiences:agenda_item_audiences(audience:audiences(name))",
    )
    .eq("event_id", eventId)
    .order("starts_at");
  if (error) throw new Error(`agenda lookup failed: ${error.message}`);

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    details: row.details,
    dressCode: row.dress_code,
    place: row.place,
    audiences: row.audiences.map((a) => a.audience.name),
  }));
}
