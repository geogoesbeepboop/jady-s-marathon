import { z } from "zod";
import { themeSchema } from "../theme/theme";

// The authoring format for events/<slug>/event.ts. Everything is addressed by a stable key so
// re-seeding updates rows in place instead of duplicating them. Times are local wall-clock time
// in the event's timezone ("2026-11-01T08:00"); Postgres converts them on seed.

const key = z.string().regex(/^[a-z0-9-]+$/, "keys are lowercase letters, digits and dashes");
const localDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'local time as "YYYY-MM-DDTHH:mm"');

function isTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const placeKinds = ["hotel", "venue", "meetup", "cheer", "transit", "other"] as const;

export const eventSeedSchema = z
  .object({
    slug: key,
    name: z.string().min(1),
    timezone: z.string().refine(isTimeZone, "unknown IANA timezone"),
    startsOn: z.iso.date(),
    endsOn: z.iso.date(),
    theme: themeSchema.default(themeSchema.parse({})),
    places: z
      .array(
        z.object({
          key,
          name: z.string().min(1),
          kind: z.enum(placeKinds),
          address: z.string().optional(),
          lat: z.number().min(-90).max(90).optional(),
          lng: z.number().min(-180).max(180).optional(),
          notes: z.string().optional(),
        }),
      )
      .default([]),
    people: z
      .array(z.object({ key, displayName: z.string().min(1), role: z.string().min(1) }))
      .min(1),
    audiences: z
      .array(z.object({ key, name: z.string().min(1), members: z.array(key) }))
      .default([]),
    agenda: z
      .array(
        z.object({
          key,
          title: z.string().min(1),
          startsAt: localDateTime,
          endsAt: localDateTime.optional(),
          place: key.optional(),
          details: z.string().optional(),
          dressCode: z.string().optional(),
          audiences: z.array(key).default([]),
        }),
      )
      .default([]),
    // Event-type blocks (e.g. `marathon`), validated and applied by their module, never by core.
    modules: z.record(z.string(), z.unknown()).default({}),
  })
  .superRefine((seed, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    for (const collection of ["places", "people", "audiences", "agenda"] as const) {
      const seen = new Set<string>();
      seed[collection].forEach((item, i) => {
        if (seen.has(item.key)) issue([collection, i, "key"], `duplicate key "${item.key}"`);
        seen.add(item.key);
      });
    }

    if (seed.endsOn < seed.startsOn) issue(["endsOn"], "endsOn is before startsOn");

    const people = new Set(seed.people.map((p) => p.key));
    const places = new Set(seed.places.map((p) => p.key));
    const audiences = new Set(seed.audiences.map((a) => a.key));

    seed.audiences.forEach((audience, i) =>
      audience.members.forEach((member, j) => {
        if (!people.has(member)) issue(["audiences", i, "members", j], `no person "${member}"`);
      }),
    );

    seed.agenda.forEach((item, i) => {
      if (item.place && !places.has(item.place)) issue(["agenda", i, "place"], `no place "${item.place}"`);
      item.audiences.forEach((audience, j) => {
        if (!audiences.has(audience)) issue(["agenda", i, "audiences", j], `no audience "${audience}"`);
      });
      if (item.endsAt && item.endsAt < item.startsAt) issue(["agenda", i, "endsAt"], "endsAt is before startsAt");
      const day = item.startsAt.slice(0, 10);
      if (day < seed.startsOn || day > seed.endsOn) {
        issue(["agenda", i, "startsAt"], `${day} is outside ${seed.startsOn}..${seed.endsOn}`);
      }
    });
  });

export type EventSeedInput = z.input<typeof eventSeedSchema>;
export type EventSeed = z.output<typeof eventSeedSchema>;

/** Typed authoring helper for events/<slug>/event.ts. Validation happens when the seed runs. */
export function defineEvent(seed: EventSeedInput): EventSeedInput {
  return seed;
}
