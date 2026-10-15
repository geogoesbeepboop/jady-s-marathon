import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/core/db/database.types";
import { seedEvent } from "@/core/seed/seed";
import { testEvent } from "../fixtures/test-event";

// Runs against the local Supabase stack as real anonymous guests, so these are the access rules
// the app actually gets: the app never filters visibility itself.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

const admin = createClient<Database>(url, process.env.SUPABASE_SECRET_KEY!, noSession);
const SLUG = "rls-weekend";
const OTHER = "rls-other-weekend";
let tokens: Record<string, string>;
let otherTokens: Record<string, string>;

async function issue(slug: string) {
  const seed = testEvent(slug);
  const { issued } = await seedEvent(admin, seed, { rotate: seed.people.map((p) => p.key) });
  return Object.fromEntries(issued.map((l) => [l.personKey, l.token]));
}

async function guest(token?: string) {
  const client = createClient<Database>(url, publishable, noSession);
  const { error } = await client.auth.signInAnonymously();
  if (error) throw error;
  if (token) {
    const { error: redeemError } = await client.rpc("redeem_join_token", { p_token: token });
    if (redeemError) throw redeemError;
  }
  return client;
}

async function agendaKeys(client: SupabaseClient<Database>) {
  const { data, error } = await client.from("agenda_items").select("key").order("starts_at");
  if (error) throw error;
  return data.map((row) => row.key);
}

beforeAll(async () => {
  if (!url || !publishable) throw new Error("run pnpm db:start && pnpm db:env first");
  tokens = await issue(SLUG);
  otherTokens = await issue(OTHER);
});

describe("agenda visibility", () => {
  it("shows a runner the shared items plus runners-only ones", async () => {
    expect(await agendaKeys(await guest(tokens.rae))).toEqual(["shakeout", "dinner", "race"]);
  });

  it("shows a supporter the shared items plus supporters-only ones", async () => {
    expect(await agendaKeys(await guest(tokens.sam))).toEqual(["signs", "dinner", "race"]);
  });

  it("shows nothing to a signed-in device that never redeemed a link", async () => {
    const stranger = await guest();
    expect(await agendaKeys(stranger)).toEqual([]);
    expect((await stranger.from("events").select("slug")).data).toEqual([]);
    expect((await stranger.from("people").select("key")).data).toEqual([]);
  });

  it("never leaks another event to a member", async () => {
    const rae = await guest(tokens.rae);
    expect((await rae.from("events").select("slug")).data).toEqual([{ slug: SLUG }]);
    const { data: people } = await rae.from("people").select("event:events(slug)");
    expect(new Set(people!.map((p) => p.event.slug))).toEqual(new Set([SLUG]));
  });
});

describe("join links", () => {
  it("rejects an unknown token", async () => {
    const client = await guest();
    const { error } = await client.rpc("redeem_join_token", { p_token: "not-a-real-token" });
    expect(error?.message).toBe("invalid join link");
  });

  it("previews only the link holder's name for anyone holding the link", async () => {
    const anon = createClient<Database>(url, publishable, noSession);
    const { data } = await anon.rpc("preview_join_token", { p_token: tokens.rae });
    expect(data?.map((d) => d.display_name)).toEqual(["Rae"]);
  });

  it("switches identity when a device redeems someone else's link in the same event", async () => {
    const device = await guest(tokens.rae);
    await device.rpc("redeem_join_token", { p_token: tokens.sam });
    expect(await agendaKeys(device)).toEqual(["signs", "dinner", "race"]);
  });

  it("can be a member of two events at once", async () => {
    const device = await guest(tokens.rae);
    await device.rpc("redeem_join_token", { p_token: otherTokens.sam });
    const { data } = await device.from("events").select("slug").order("slug");
    expect(data).toEqual([{ slug: OTHER }, { slug: SLUG }]);
  });

  it("signs out a person's devices when their link is rotated", async () => {
    const before = await guest(tokens.rae);
    expect(await agendaKeys(before)).not.toEqual([]);
    tokens = { ...tokens, ...(await seedEvent(admin, testEvent(SLUG), { rotate: ["rae"] }).then(({ issued }) =>
      Object.fromEntries(issued.map((l) => [l.personKey, l.token])),
    )) };
    expect(await agendaKeys(before)).toEqual([]);
    expect(await agendaKeys(await guest(tokens.rae))).toEqual(["shakeout", "dinner", "race"]);
  });
});

describe("write and secret protection", () => {
  it("keeps token hashes and other devices unreadable", async () => {
    const rae = await guest(tokens.rae);
    const { error } = await rae.from("join_tokens").select("token_hash");
    expect(error?.code).toBe("42501"); // permission denied
    const { data: devices } = await rae.from("person_devices").select("person_id");
    expect(devices).toHaveLength(1);
  });

  it("refuses guest writes", async () => {
    const rae = await guest(tokens.rae);
    const { data: event } = await rae.from("events").select("id").single();
    const { error } = await rae
      .from("agenda_items")
      .insert({ event_id: event!.id, key: "sneaky", title: "x", starts_at: new Date().toISOString() });
    expect(error?.code).toBe("42501");
  });

  it("refuses the anon key outright and keeps seeding admin-only", async () => {
    const anon = createClient<Database>(url, publishable, noSession);
    expect((await anon.from("agenda_items").select("key")).error?.code).toBe("42501");
    const rae = await guest(tokens.rae);
    const { error } = await rae.rpc("seed_event", { p_seed: {}, p_token_hashes: {} });
    expect(error?.code).toBe("42501");
  });
});

describe("seeding", () => {
  it("converts local times in the event timezone across the DST change", async () => {
    const { data } = await admin
      .from("agenda_items")
      .select("key, starts_at, event:events!inner(slug)")
      .eq("event.slug", SLUG)
      .in("key", ["shakeout", "race"])
      .order("starts_at");
    // 2026-10-31 is still EDT (-4); race morning 2026-11-01 is EST (-5).
    expect(data!.map((r) => [r.key, new Date(r.starts_at).toISOString()])).toEqual([
      ["shakeout", "2026-10-31T12:00:00.000Z"],
      ["race", "2026-11-01T13:00:00.000Z"],
    ]);
  });

  it("is idempotent and only issues links to new people", async () => {
    const seed = testEvent(SLUG);
    expect((await seedEvent(admin, seed)).issued).toEqual([]);
    seed.people.push({ key: "kim", displayName: "Kim", role: "supporter" });
    expect((await seedEvent(admin, seed)).issued.map((l) => l.personKey)).toEqual(["kim"]);
    expect((await seedEvent(admin, testEvent(SLUG))).issued).toEqual([]); // kim removed again
    const { count } = await admin
      .from("people")
      .select("id, event:events!inner(slug)", { count: "exact", head: true })
      .eq("event.slug", SLUG);
    expect(count).toBe(2);
  });
});
