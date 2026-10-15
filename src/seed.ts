import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/core/db/database.types";
import { eventSeedSchema, type EventSeedInput } from "@/core/seed/schema";
import { seedEvent } from "@/core/seed/seed";
import { parseMarathonSeed, seedMarathon } from "@/modules/marathon/seed";

// Composes the core seed with each module's block. Lives outside core so core never learns
// which modules exist. A module missing from an event's seed has its data removed.

export function validateEvent(input: EventSeedInput) {
  const core = eventSeedSchema.parse(input);
  const unknown = Object.keys(core.modules).filter((name) => name !== "marathon");
  if (unknown.length) throw new Error(`unknown modules: ${unknown.join(", ")}`);
  const marathon = core.modules.marathon === undefined ? null : parseMarathonSeed(core.modules.marathon, core);
  return { core, marathon };
}

export async function seedEventWithModules(
  db: SupabaseClient<Database>,
  input: EventSeedInput,
  options: { rotate?: string[] } = {},
) {
  const { core, marathon } = validateEvent(input);
  const result = await seedEvent(db, input, options);
  await seedMarathon(db, core.slug, marathon);
  return result;
}
