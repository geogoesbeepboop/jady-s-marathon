import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";
import { eventSeedSchema, type EventSeedInput } from "./schema";

// Runs from scripts and tests with the service-role key, never from the app.

export function newJoinToken() {
  return randomBytes(24).toString("base64url");
}

/** Must match encode(sha256(convert_to(token, 'UTF8')), 'hex') in the migrations. */
export function hashJoinToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export type IssuedLink = { personKey: string; displayName: string; token: string };

export async function seedEvent(
  db: SupabaseClient<Database>,
  input: EventSeedInput,
  options: { rotate?: string[] } = {},
): Promise<{ slug: string; issued: IssuedLink[] }> {
  const seed = eventSeedSchema.parse(input);

  const candidates = new Map(seed.people.map((p) => [p.key, newJoinToken()]));
  const hashes = Object.fromEntries([...candidates].map(([k, t]) => [k, hashJoinToken(t)]));

  const { data, error } = await db.rpc("seed_event", {
    p_seed: { ...seed, modules: undefined }, // module blocks are applied by their modules
    p_token_hashes: hashes,
    p_rotate: options.rotate ?? [],
  });
  if (error) throw new Error(`seed_event failed: ${error.message}`);

  const names = new Map(seed.people.map((p) => [p.key, p.displayName]));
  return {
    slug: seed.slug,
    issued: (data ?? []).map(({ person_key }) => ({
      personKey: person_key,
      displayName: names.get(person_key) ?? person_key,
      token: candidates.get(person_key)!,
    })),
  };
}
