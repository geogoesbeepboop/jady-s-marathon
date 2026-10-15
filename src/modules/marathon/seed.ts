import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/core/db/database.types";
import type { EventSeed } from "@/core/seed/schema";

// The `modules.marathon` block of an event seed. References people and places by their core keys.

const key = z.string().regex(/^[a-z0-9-]+$/);
const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'local time as "YYYY-MM-DDTHH:mm"');
const pace = z
  .string()
  .regex(/^\d{1,2}:\d{2}$/, 'pace per mile as "m:ss"')
  .transform((s) => {
    const [m, sec] = s.split(":").map(Number);
    return m * 60 + sec;
  });

const lineString = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
});

export const marathonSeedSchema = z.object({
  name: z.string().min(1),
  distanceMiles: z.number().positive().default(26.2),
  course: lineString.optional(),
  trackerUrl: z.url().optional(),
  trackerNote: z.string().optional(),
  runners: z.array(
    z.object({
      person: key,
      bib: z.string().optional(),
      corral: z.string().optional(),
      startsAt: localDateTime,
      pace,
      fadePercent: z.number().min(0).max(50).default(0),
      trackerUrl: z.url().optional(),
    }),
  ),
  cheerSpots: z
    .array(z.object({ place: key, miles: z.array(z.number().min(0)).min(1).max(4), tip: z.string().optional() }))
    .default([]),
});

export type MarathonSeedInput = z.input<typeof marathonSeedSchema>;
export type MarathonSeed = z.output<typeof marathonSeedSchema>;

/** Typed authoring helper for the `modules.marathon` block of events/<slug>/event.ts. */
export function defineMarathon(seed: MarathonSeedInput): MarathonSeedInput {
  return seed;
}

/** Validates the block on its own and against the core seed it belongs to. */
export function parseMarathonSeed(raw: unknown, core: EventSeed): MarathonSeed {
  const seed = marathonSeedSchema.parse(raw);
  const problems: string[] = [];
  const people = new Map(core.people.map((p) => [p.key, p]));
  const places = new Map(core.places.map((p) => [p.key, p]));

  seed.runners.forEach((runner, i) => {
    if (!people.has(runner.person)) problems.push(`runners.${i}.person: no person "${runner.person}"`);
  });
  seed.cheerSpots.forEach((spot, i) => {
    const place = places.get(spot.place);
    if (!place) problems.push(`cheerSpots.${i}.place: no place "${spot.place}"`);
    else if (place.kind !== "cheer") problems.push(`cheerSpots.${i}.place: "${spot.place}" must be kind "cheer"`);
    spot.miles.forEach((mile, j) => {
      if (mile > seed.distanceMiles) problems.push(`cheerSpots.${i}.miles.${j}: past the finish`);
    });
  });
  if (problems.length) throw new Error(`modules.marathon is invalid:\n  ${problems.join("\n  ")}`);
  return seed;
}

export async function seedMarathon(db: SupabaseClient<Database>, slug: string, data: MarathonSeed | null) {
  const payload = data && {
    ...data,
    runners: data.runners.map(({ pace, ...runner }) => ({ ...runner, paceSecondsPerMile: pace })),
  };
  const { error } = await db.rpc("seed_marathon", { p_slug: slug, p_data: payload });
  if (error) throw new Error(`seed_marathon failed: ${error.message}`);
}
