import { describe, expect, it } from "vitest";
import { elapsedSeconds, etaWindow, finishTime, formatDuration, formatPace } from "@/modules/marathon/eta";

const start = "2027-02-28T13:00:00.000Z";
const even = { startsAt: start, paceSecondsPerMile: 600, fadePercent: 0 };
const minutesAfterStart = (d: Date) => (d.getTime() - Date.parse(start)) / 60_000;

describe("elapsedSeconds", () => {
  it("is distance × pace at even pace", () => {
    expect(elapsedSeconds(even, 13.1, 26.2)).toBe(7860); // 2:11 at 10:00/mi
  });

  it("adds half the fade over the whole race", () => {
    // pace climbs from 10:00 to 11:00 → average 10:30 → 26.2 × 630 s
    expect(elapsedSeconds({ ...even, fadePercent: 10 }, 26.2, 26.2)).toBeCloseTo(26.2 * 630, 6);
  });

  it("costs little early and a lot late", () => {
    const fading = { ...even, fadePercent: 10 };
    const earlyCost = elapsedSeconds(fading, 5, 26.2) - elapsedSeconds(even, 5, 26.2);
    const lateCost = elapsedSeconds(fading, 25, 26.2) - elapsedSeconds(even, 25, 26.2);
    expect(earlyCost).toBeLessThan(30);
    expect(lateCost).toBeGreaterThan(10 * 60);
  });
});

describe("etaWindow", () => {
  it("keeps at least a two-minute window near the start", () => {
    const w = etaWindow(even, 1, 26.2);
    expect(minutesAfterStart(w.expected)).toBe(10);
    expect(minutesAfterStart(w.earliest)).toBe(8);
    expect(minutesAfterStart(w.latest)).toBe(13);
  });

  it("widens with distance and leans late", () => {
    const w = etaWindow(even, 20, 26.2); // 200 min expected, 4% = 8 min spread
    expect(minutesAfterStart(w.expected)).toBe(200);
    expect(minutesAfterStart(w.earliest)).toBe(192);
    expect(minutesAfterStart(w.latest)).toBe(212);
  });
});

describe("finish and formatting", () => {
  it("projects the finish", () => {
    expect(finishTime(even, 26.2).toISOString()).toBe("2027-02-28T17:22:00.000Z");
  });

  it("formats pace and durations", () => {
    expect(formatPace(570)).toBe("9:30 /mi");
    expect(formatPace(485)).toBe("8:05 /mi");
    expect(formatDuration(15720)).toBe("4:22");
  });
});
