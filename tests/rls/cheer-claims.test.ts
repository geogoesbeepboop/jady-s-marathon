import { createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/core/db/database.types";
import { seedEventWithModules } from "@/seed";
import { testEvent } from "../fixtures/test-event";

// Cheer claims are the first thing guests write. A guest may only claim or drop spots as
// themselves, in their own event.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient<Database>(url, process.env.SUPABASE_SECRET_KEY!, noSession);

const SLUG = "claims-weekend";
const OTHER = "claims-other-weekend";
let tokens: Record<string, string>;
let otherTokens: Record<string, string>;

async function issue(slug: string) {
  const seed = testEvent(slug);
  const { issued } = await seedEventWithModules(admin, seed, { rotate: seed.people.map((p) => p.key) });
  return Object.fromEntries(issued.map((l) => [l.personKey, l.token]));
}

async function guest(token: string) {
  const client = createClient<Database>(url, publishable, noSession);
  const { error } = await client.auth.signInAnonymously();
  if (error) throw error;
  const { error: redeemError } = await client.rpc("redeem_join_token", { p_token: token });
  if (redeemError) throw redeemError;
  return client;
}

async function ids(slug: string) {
  const { data } = await admin
    .from("people")
    .select("id, key, event_id, event:events!inner(slug)")
    .eq("event.slug", slug);
  const eventId = data![0].event_id;
  const { data: spots } = await admin.from("marathon_cheer_spots").select("place_id, place:places!inner(key)").eq("event_id", eventId);
  return {
    eventId,
    person: Object.fromEntries(data!.map((p) => [p.key, p.id])),
    spot: Object.fromEntries(spots!.map((s) => [s.place.key, s.place_id])),
  };
}

async function claimsAt(placeId: string) {
  const { data, error } = await admin.from("marathon_cheer_claims").select("person:people!inner(key)").eq("place_id", placeId);
  if (error) throw error;
  return data.map((c) => c.person.key).sort();
}

beforeAll(async () => {
  tokens = await issue(SLUG);
  otherTokens = await issue(OTHER);
  await admin.from("marathon_cheer_claims").delete().in("event_id", [(await ids(SLUG)).eventId, (await ids(OTHER)).eventId]);
});

describe("cheer claims", () => {
  it("lets a guest claim and drop a spot as themselves", async () => {
    const { eventId, person, spot } = await ids(SLUG);
    const sam = await guest(tokens.sam);

    const insert = await sam.from("marathon_cheer_claims").insert({ place_id: spot.bridge, person_id: person.sam, event_id: eventId });
    expect(insert.error).toBeNull();
    expect(await claimsAt(spot.bridge)).toEqual(["sam"]);

    const remove = await sam.from("marathon_cheer_claims").delete().match({ place_id: spot.bridge, person_id: person.sam });
    expect(remove.error).toBeNull();
    expect(await claimsAt(spot.bridge)).toEqual([]);
  });

  it("refuses a claim made in someone else's name", async () => {
    const { eventId, person, spot } = await ids(SLUG);
    const sam = await guest(tokens.sam);
    const { error } = await sam.from("marathon_cheer_claims").insert({ place_id: spot.park, person_id: person.rae, event_id: eventId });
    expect(error?.code).toBe("42501");
  });

  it("cannot drop someone else's claim", async () => {
    const { eventId, person, spot } = await ids(SLUG);
    await admin.from("marathon_cheer_claims").insert({ place_id: spot.park, person_id: person.rae, event_id: eventId });
    const sam = await guest(tokens.sam);
    await sam.from("marathon_cheer_claims").delete().match({ place_id: spot.park, person_id: person.rae });
    expect(await claimsAt(spot.park)).toEqual(["rae"]);
  });

  it("cannot claim in an event they never joined", async () => {
    const theirs = await ids(OTHER);
    const sam = await guest(tokens.sam);
    const { error } = await sam
      .from("marathon_cheer_claims")
      .insert({ place_id: theirs.spot.park, person_id: theirs.person.sam, event_id: theirs.eventId });
    expect(error?.code).toBe("42501");
    expect(otherTokens.sam).toBeTruthy();
  });

  it("shows members who is at each spot, and nothing to outsiders", async () => {
    const { spot } = await ids(SLUG);
    const sam = await guest(tokens.sam);
    const { data } = await sam.from("marathon_cheer_claims").select("place_id, person:people(display_name)");
    expect(data).toEqual([{ place_id: spot.park, person: { display_name: "Rae" } }]);

    const outsider = await guest(otherTokens.rae);
    expect((await outsider.from("marathon_cheer_claims").select("place_id").eq("place_id", spot.park)).data).toEqual([]);
  });

  it("keeps claims when the event is re-seeded", async () => {
    const { spot } = await ids(SLUG);
    await seedEventWithModules(admin, testEvent(SLUG));
    expect(await claimsAt(spot.park)).toEqual(["rae"]);
  });

  it("keeps seeding the race admin-only", async () => {
    const sam = await guest(tokens.sam);
    const { error } = await sam.rpc("seed_marathon", { p_slug: SLUG, p_data: null });
    expect(error?.code).toBe("42501");
  });
});
