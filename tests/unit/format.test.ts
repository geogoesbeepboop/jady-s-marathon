import { describe, expect, it } from "vitest";
import { formatTimeRange, groupByDay, mapsUrl } from "@/core/schedule/format";

const LA = "America/Los_Angeles";

describe("groupByDay", () => {
  it("groups by the event's calendar day, not UTC's", () => {
    const groups = groupByDay(
      [
        { id: "late-fri", startsAt: "2026-11-07T05:00:00+00:00" }, // Fri 9:00 PM in LA
        { id: "sat", startsAt: "2026-11-07T16:00:00+00:00" },
        { id: "fri", startsAt: "2026-11-06T23:00:00+00:00" },
      ],
      LA,
    );
    expect(groups.map((g) => [g.day, g.items.map((i) => i.id)])).toEqual([
      ["2026-11-06", ["fri", "late-fri"]],
      ["2026-11-07", ["sat"]],
    ]);
    expect(groups[0].label).toBe("Friday, Nov 6");
  });
});

describe("formatTimeRange", () => {
  it("shows a start time alone", () => {
    expect(formatTimeRange("2026-11-08T15:30:00+00:00", null, LA)).toBe("7:30 AM");
  });

  it("shows a range in the event timezone", () => {
    expect(formatTimeRange("2026-11-07T01:00:00+00:00", "2026-11-07T02:30:00+00:00", LA)).toMatch(
      /^5:00\s?–\s?6:30\sPM$/,
    );
  });
});

describe("mapsUrl", () => {
  const place = { name: "Expo", address: null, lat: null, lng: null };

  it("is null while the place is TBD", () => {
    expect(mapsUrl(place)).toBeNull();
    expect(mapsUrl({ ...place, address: "TBD" })).toBeNull();
  });

  it("prefers coordinates, then name + address", () => {
    expect(mapsUrl({ ...place, lat: 40.6, lng: -74.06, address: "x" })).toContain("query=40.6%2C-74.06");
    expect(mapsUrl({ ...place, address: "1 Main St" })).toContain("query=Expo%2C%201%20Main%20St");
  });
});
