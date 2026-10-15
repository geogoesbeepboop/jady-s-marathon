import { describe, expect, it } from "vitest";
import jady from "../../events/jady-marathon/event";
import { eventSeedSchema, type EventSeedInput } from "@/core/seed/schema";
import { themeToCssVars } from "@/core/theme/theme";
import { testEvent } from "../fixtures/test-event";

function errors(input: EventSeedInput) {
  const result = eventSeedSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

describe("event seed schema", () => {
  it("accepts the real events", () => {
    expect(errors(jady)).toEqual([]);
    expect(errors(testEvent("x"))).toEqual([]);
  });

  it("rejects broken references", () => {
    const seed = testEvent("x");
    seed.audiences![0].members.push("nobody");
    seed.agenda![0].place = "nowhere";
    seed.agenda![1].audiences = ["vips"];
    expect(errors(seed)).toEqual([
      'audiences.0.members.1: no person "nobody"',
      'agenda.0.place: no place "nowhere"',
      'agenda.1.audiences.0: no audience "vips"',
    ]);
  });

  it("rejects duplicate keys and times outside the event", () => {
    const seed = testEvent("x");
    seed.people.push({ key: "rae", displayName: "Rae again", role: "runner" });
    seed.agenda![0].startsAt = "2026-11-05T09:00";
    expect(errors(seed)).toEqual([
      'people.2.key: duplicate key "rae"',
      "agenda.0.startsAt: 2026-11-05 is outside 2026-10-31..2026-11-01",
    ]);
  });

  it("rejects an unknown timezone and a bad theme colour", () => {
    expect(errors({ ...testEvent("x"), timezone: "Mars/Olympus", theme: { accent: "orange" } })).toEqual([
      "timezone: unknown IANA timezone",
      "theme.accent: use a 6-digit hex colour",
    ]);
  });
});

describe("themeToCssVars", () => {
  it("fills unset colours with defaults", () => {
    const vars = themeToCssVars({ accent: "#ff5a1f" });
    expect(vars["--ev-accent"]).toBe("#ff5a1f");
    expect(vars["--ev-bg"]).toBe("#faf8f5");
  });
});
