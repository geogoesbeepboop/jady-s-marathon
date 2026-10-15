import { mkdir, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/core/db/database.types";
import { seedEventWithModules as seedEvent } from "@/seed";
import { testEvent } from "../fixtures/test-event";

export const E2E_SLUG = "e2e-weekend";
export const TOKENS_FILE = "tests/e2e/.auth/tokens.json";

export default async function globalSetup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("run pnpm db:start && pnpm db:env first");

  const db = createClient<Database>(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const seed = testEvent(E2E_SLUG);
  const { issued } = await seedEvent(db, seed, { rotate: seed.people.map((p) => p.key) });
  const { data: event } = await db.from("events").select("id").eq("slug", E2E_SLUG).single();
  await db.from("marathon_cheer_claims").delete().eq("event_id", event!.id); // start each run unclaimed

  await mkdir("tests/e2e/.auth", { recursive: true });
  await writeFile(TOKENS_FILE, JSON.stringify(Object.fromEntries(issued.map((l) => [l.personKey, l.token]))));
}
