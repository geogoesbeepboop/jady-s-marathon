import { defineEvent } from "@/core/seed/schema";
import { defineMarathon } from "@/modules/marathon/seed";

// A small event with one item per visibility case. Race day is the DST change in New York
// (2026-11-01), so seeding also proves local times convert in the event's timezone.
export function testEvent(slug: string) {
  return defineEvent({
    slug,
    name: `Test weekend (${slug})`,
    timezone: "America/New_York",
    startsOn: "2026-10-31",
    endsOn: "2026-11-01",
    places: [
      { key: "hotel", name: "Test hotel", kind: "hotel", address: "1 Main St" },
      { key: "start", name: "Start line", kind: "venue", lat: 40.6, lng: -74.06 },
      { key: "bridge", name: "Bridge corner", kind: "cheer", lat: 40.65, lng: -73.98 },
      { key: "park", name: "Park loop", kind: "cheer", lat: 40.78, lng: -73.96 },
      { key: "reunion", name: "Reunion area", kind: "meetup", lat: 40.77, lng: -73.98, notes: "Letter R" },
    ],
    people: [
      { key: "rae", displayName: "Rae", role: "runner" },
      { key: "sam", displayName: "Sam", role: "supporter" },
    ],
    audiences: [
      { key: "runners", name: "Runners", members: ["rae"] },
      { key: "supporters", name: "Cheer crew", members: ["sam"] },
    ],
    agenda: [
      { key: "dinner", title: "Team dinner", startsAt: "2026-10-31T19:00", place: "hotel" },
      { key: "shakeout", title: "Shakeout run", startsAt: "2026-10-31T08:00", audiences: ["runners"] },
      { key: "signs", title: "Make cheer signs", startsAt: "2026-10-31T12:00", audiences: ["supporters"] },
      { key: "race", title: "Race starts", startsAt: "2026-11-01T08:00", place: "start" },
    ],
    modules: {
      marathon: defineMarathon({
        name: "Test Marathon",
        trackerUrl: "https://example.com/track",
        course: {
          type: "LineString",
          coordinates: [
            [-74.06, 40.6],
            [-73.98, 40.65],
            [-73.96, 40.78],
            [-73.98, 40.77],
          ],
        },
        runners: [{ person: "rae", bib: "1234", corral: "B", startsAt: "2026-11-01T08:10", pace: "10:00" }],
        cheerSpots: [
          { place: "park", miles: [20, 24], tip: "Both sides of the loop." },
          { place: "bridge", miles: [8] },
        ],
      }),
    },
  });
}
