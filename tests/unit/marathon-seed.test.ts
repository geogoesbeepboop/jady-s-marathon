import { describe, expect, it } from "vitest";
import { fitProjection, thin } from "@/modules/marathon/course-geometry";
import { validateEvent } from "@/seed";
import { testEvent } from "../fixtures/test-event";

describe("marathon seed block", () => {
  it("parses pace strings into seconds per mile", () => {
    const { marathon } = validateEvent(testEvent("x"));
    expect(marathon?.runners[0].pace).toBe(600);
    expect(marathon?.cheerSpots.map((s) => s.place)).toEqual(["park", "bridge"]);
  });

  it("checks references against the core seed", () => {
    const seed = testEvent("x");
    const marathon = seed.modules!.marathon as { runners: { person: string }[]; cheerSpots: { place: string; miles: number[] }[] };
    marathon.runners[0].person = "ghost";
    marathon.cheerSpots[0].place = "hotel"; // exists, but isn't a cheer spot
    marathon.cheerSpots[1].miles = [30];
    expect(() => validateEvent(seed)).toThrow(
      [
        "modules.marathon is invalid:",
        '  runners.0.person: no person "ghost"',
        '  cheerSpots.0.place: "hotel" must be kind "cheer"',
        "  cheerSpots.1.miles.0: past the finish",
      ].join("\n"),
    );
  });

  it("rejects modules nobody implements", () => {
    expect(() => validateEvent({ ...testEvent("x"), modules: { wedding: {} } })).toThrow("unknown modules: wedding");
  });

  it("works without any module", () => {
    expect(validateEvent({ ...testEvent("x"), modules: {} }).marathon).toBeNull();
  });
});

describe("course geometry", () => {
  it("fits the course inside the box with north up", () => {
    const { width, height, project } = fitProjection([
      [-90.07, 29.95],
      [-90.12, 29.93],
      [-90.09, 29.99],
    ]);
    expect(width).toBe(340);
    const north = project([-90.09, 29.99]);
    const south = project([-90.12, 29.93]);
    expect(north.y).toBeLessThan(south.y);
    for (const p of [north, south]) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(width);
      expect(p.y).toBeLessThanOrEqual(height);
    }
  });

  it("thins long tracks but keeps both ends", () => {
    const track = Array.from({ length: 2000 }, (_, i) => i);
    const thinned = thin(track, 600);
    expect(thinned.length).toBeLessThanOrEqual(601);
    expect(thinned[0]).toBe(0);
    expect(thinned.at(-1)).toBe(1999);
  });
});
