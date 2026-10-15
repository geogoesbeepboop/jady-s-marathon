import "server-only";
import { createSupabaseServerClient } from "@/core/access/supabase-server";

export type Coordinates = [number, number][]; // [lng, lat]

export type Runner = {
  personId: string;
  name: string;
  bib: string | null;
  corral: string | null;
  startsAt: string;
  paceSecondsPerMile: number;
  fadePercent: number;
  trackerUrl: string | null;
};

export type CheerSpot = {
  placeId: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  miles: number[];
  tip: string | null;
  claimedBy: { personId: string; name: string }[];
};

export type Race = {
  name: string;
  distanceMiles: number;
  course: Coordinates | null;
  trackerUrl: string | null;
  trackerNote: string | null;
  runners: Runner[];
  spots: CheerSpot[];
};

export async function hasRace(eventId: string) {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("marathon_races")
    .select("event_id", { count: "exact", head: true })
    .eq("event_id", eventId);
  return (count ?? 0) > 0;
}

export async function getRace(eventId: string): Promise<Race | null> {
  const supabase = await createSupabaseServerClient();
  const [race, runners, spots] = await Promise.all([
    supabase
      .from("marathon_races")
      .select("name, distance_miles, course, tracker_url, tracker_note")
      .eq("event_id", eventId)
      .maybeSingle(),
    supabase
      .from("marathon_runners")
      .select("person_id, bib, corral, starts_at, pace_seconds_per_mile, fade_percent, tracker_url, person:people(display_name)")
      .eq("event_id", eventId)
      .order("starts_at"),
    supabase
      .from("marathon_cheer_spots")
      .select(
        "place_id, miles, tip, place:places(name, address, lat, lng, notes), claims:marathon_cheer_claims(created_at, person:people(id, display_name))",
      )
      .eq("event_id", eventId),
  ]);
  for (const result of [race, runners, spots]) {
    if (result.error) throw new Error(`race lookup failed: ${result.error.message}`);
  }
  if (!race.data) return null;

  const course = race.data.course as { coordinates?: Coordinates } | null;
  return {
    name: race.data.name,
    distanceMiles: Number(race.data.distance_miles),
    course: course?.coordinates ?? null,
    trackerUrl: race.data.tracker_url,
    trackerNote: race.data.tracker_note,
    runners: (runners.data ?? []).map((r) => ({
      personId: r.person_id,
      name: r.person.display_name,
      bib: r.bib,
      corral: r.corral,
      startsAt: r.starts_at,
      paceSecondsPerMile: r.pace_seconds_per_mile,
      fadePercent: Number(r.fade_percent),
      trackerUrl: r.tracker_url,
    })),
    spots: (spots.data ?? [])
      .map((s) => ({
        placeId: s.place_id,
        name: s.place.name,
        address: s.place.address,
        lat: s.place.lat,
        lng: s.place.lng,
        notes: s.place.notes,
        miles: s.miles.map(Number).sort((a, b) => a - b),
        tip: s.tip,
        claimedBy: [...s.claims]
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((c) => ({ personId: c.person.id, name: c.person.display_name })),
      }))
      .sort((a, b) => a.miles[0] - b.miles[0]),
  };
}
