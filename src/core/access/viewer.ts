import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "./supabase-server";

export type Viewer = {
  personId: string;
  displayName: string;
  role: string;
  event: {
    id: string;
    slug: string;
    name: string;
    timezone: string;
    startsOn: string;
    endsOn: string;
    theme: unknown;
  };
};

/** The person this device is bound to in the given event, or null if it never redeemed a link. */
export const getViewer = cache(async (slug: string): Promise<Viewer | null> => {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return null;

  const { data, error } = await supabase
    .from("person_devices")
    .select(
      "person:people!inner(id, display_name, role), event:events!inner(id, slug, name, timezone, starts_on, ends_on, theme)",
    )
    .eq("event.slug", slug)
    .maybeSingle();
  if (error) throw new Error(`viewer lookup failed: ${error.message}`);
  if (!data) return null;

  return {
    personId: data.person.id,
    displayName: data.person.display_name,
    role: data.person.role,
    event: {
      id: data.event.id,
      slug: data.event.slug,
      name: data.event.name,
      timezone: data.event.timezone,
      startsOn: data.event.starts_on,
      endsOn: data.event.ends_on,
      theme: data.event.theme,
    },
  };
});

/** Slugs of every event this device has joined, newest first. */
export async function getJoinedEventSlugs(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return [];
  const { data, error } = await supabase
    .from("person_devices")
    .select("bound_at, event:events!inner(slug)")
    .order("bound_at", { ascending: false });
  if (error) throw new Error(`membership lookup failed: ${error.message}`);
  return data.map((row) => row.event.slug);
}
