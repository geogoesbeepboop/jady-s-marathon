import { defineEvent } from "@/core/seed/schema";
import { defineMarathon, type MarathonSeedInput } from "@/modules/marathon/seed";
import course from "./course.json";

// 2026 New Orleans Marathon (Premier Event Management), Saturday Nov 14, 2026. Race facts come
// from the official RunSignup pages as of 2026-10-14. Not yet published: live tracking, wave
// times, a family reunion area, road closures, the course GPX.
//
// course.json is traced from the official turn list over OpenStreetMap streets; the Lakeshore Dr
// U-turn isn't published, so it is placed to make the course 26.2 mi. Cheer-spot miles are
// measured on that line and agree with an independent estimate within ~0.3 mi.
//
// TODO(you): runner paces and corrals, the second runner, the crew list, hotel and dinners.
// Re-run `pnpm seed jady-marathon` after editing; keys are stable, so rows update in place.

export default defineEvent({
  slug: "jady-marathon",
  name: "Jady's New Orleans Marathon",
  timezone: "America/Chicago",
  startsOn: "2026-11-13",
  endsOn: "2026-11-15",
  theme: {
    background: "#fbf7ef",
    foreground: "#1f1a2e",
    muted: "#6e667a",
    card: "#ffffff",
    line: "#ece2cf",
    accent: "#5b2a86", // Mardi Gras purple; the finish is branded "Mardi Gras Mall"
    accentForeground: "#ffffff",
    font: "rounded",
  },

  places: [
    { key: "hotel", name: "Crew hotel (TBD)", kind: "hotel", address: "TBD" },
    {
      key: "tad-gormley",
      name: "Tad Gormley Stadium",
      kind: "venue",
      address: "5400 Stadium Dr, New Orleans, LA 70124",
      lat: 29.9899,
      lng: -90.0996,
    },
    {
      key: "start",
      name: "Start: New Orleans Museum of Art",
      kind: "venue",
      address: "1 Collins Diboll Cir, New Orleans, LA 70124",
      lat: 29.986,
      lng: -90.0933,
      notes: "Corrals on Victory Ave",
    },
    {
      key: "finish",
      name: "Finish: Roosevelt Mall",
      kind: "venue",
      lat: 29.99,
      lng: -90.0973,
      notes: "Beside Tad Gormley Stadium",
    },
    {
      key: "reunion",
      name: "Fit Fête party, Tad Gormley Stadium floor",
      kind: "meetup",
      lat: 29.9899,
      lng: -90.0996,
      notes: "No official reunion area is published. We'll post an exact landmark in the group chat on the day.",
    },
    { key: "cheer-harrison", name: "Wisner Blvd & Harrison Ave", kind: "cheer", lat: 29.9993, lng: -90.0861 },
    { key: "cheer-bridge", name: "Allen Toussaint Blvd bridge", kind: "cheer", lat: 30.0207, lng: -90.0828 },
    { key: "cheer-lakeshore", name: "Lakeshore Dr at Oriole St", kind: "cheer", lat: 30.0262, lng: -90.08 },
    { key: "cheer-elysian", name: "Lakeshore Dr at Elysian Fields", kind: "cheer", lat: 30.0305, lng: -90.0613 },
    { key: "cheer-palm", name: "Henry Thomas Dr & Palm Dr", kind: "cheer", lat: 29.9908, lng: -90.0934 },
  ],

  people: [
    { key: "jady", displayName: "Jady", role: "runner" },
    { key: "runner-2", displayName: "Runner 2 (TBD)", role: "runner" },
    { key: "cheer-1", displayName: "Supporter 1 (TBD)", role: "supporter" },
    { key: "cheer-2", displayName: "Supporter 2 (TBD)", role: "supporter" },
    { key: "cheer-3", displayName: "Supporter 3 (TBD)", role: "supporter" },
  ],

  audiences: [
    { key: "runners", name: "Runners", members: ["jady", "runner-2"] },
    { key: "supporters", name: "Cheer crew", members: ["cheer-1", "cheer-2", "cheer-3"] },
  ],

  agenda: [
    {
      key: "shakeout",
      title: "Easy shakeout run",
      startsAt: "2026-11-13T08:00",
      endsAt: "2026-11-13T08:40",
      place: "hotel",
      details: "Unofficial: the race doesn't host one. Two or three easy miles, then breakfast.",
      audiences: ["runners"],
    },
    {
      key: "packet-pickup",
      title: "Packet pickup",
      startsAt: "2026-11-13T10:00",
      endsAt: "2026-11-13T19:00",
      place: "tad-gormley",
      details:
        "Bring photo ID. Also open Thursday 12–6 PM. The race director walks through the course at 4:00 PM on the main stage.",
      audiences: ["runners"],
    },
    { key: "check-in", title: "Check in at the hotel", startsAt: "2026-11-13T15:00", place: "hotel" },
    {
      key: "sign-making",
      title: "Make cheer signs",
      startsAt: "2026-11-13T16:00",
      place: "hotel",
      audiences: ["supporters"],
    },
    { key: "welcome-dinner", title: "Welcome dinner", startsAt: "2026-11-13T19:30", details: "Place TBD. Early night for runners." },
    {
      key: "leave-for-start",
      title: "Head to City Park",
      startsAt: "2026-11-14T05:45",
      place: "hotel",
      details:
        "Gear check opens 5:30 AM on Roosevelt Mall: white drawstring bag, bib number on it, no valuables. The start at NOMA is about a 10-minute walk from there.",
      audiences: ["runners"],
    },
    {
      key: "supporters-head-out",
      title: "Get to your first cheer spot",
      startsAt: "2026-11-14T06:45",
      details:
        "Streets along the course close early. Pick a spot on the Race day tab. Sunrise is about 6:25 and race morning averages around 55°F; the lakefront is windy.",
      audiences: ["supporters"],
    },
    {
      key: "corrals",
      title: "Corrals open",
      startsAt: "2026-11-14T07:10",
      place: "start",
      details: "Self-seeded by pace (corral D is 10:00/mi). Staging is on Victory Ave west of NOMA.",
      audiences: ["runners"],
    },
    {
      key: "race-start",
      title: "Race starts",
      startsAt: "2026-11-14T07:30",
      place: "start",
      details: "Two 13.1-mile loops. Runners must start lap 2 by 11:45 AM or they're sent to the finish.",
    },
    {
      key: "reunion",
      title: "Meet at the stadium party",
      startsAt: "2026-11-14T12:30",
      place: "reunion",
      details: "The Fit Fête party runs 7 AM–4 PM on the stadium floor. Marathon awards are at 11:30.",
    },
    { key: "celebration-dinner", title: "Celebration dinner", startsAt: "2026-11-14T19:00", details: "Place TBD." },
    {
      key: "brunch",
      title: "Recovery brunch",
      startsAt: "2026-11-15T10:30",
      dressCode: "Wear your medal",
      details: "Place TBD. The Saints host Carolina at noon at the Superdome, so downtown traffic gets heavy.",
    },
  ],

  modules: {
    marathon: defineMarathon({
      name: "New Orleans Marathon",
      course: course as MarathonSeedInput["course"],
      trackerNote:
        "Not announced yet. Chip timing is by Race Result; the tracking link should come with race-week emails.",
      runners: [
        // TBD: real corrals and target paces. Corral start is the gun (7:30) plus a few minutes.
        { person: "jady", corral: "D", startsAt: "2026-11-14T07:36", pace: "10:00", fadePercent: 5 },
        { person: "runner-2", corral: "C", startsAt: "2026-11-14T07:34", pace: "9:00", fadePercent: 5 },
      ],
      cheerSpots: [
        {
          place: "cheer-harrison",
          miles: [1.4, 10.6, 14.4, 23.6],
          tip: "City Park entrance on the bayou's west bank, about 1 mile from the start. Runners pass both ways on both laps.",
        },
        {
          place: "cheer-bridge",
          miles: [3.0, 9.0, 16.0, 22.0],
          tip: "The best spot: runners go out and back across this short stretch on both laps, so you see each runner four times without moving.",
        },
        {
          place: "cheer-lakeshore",
          miles: [3.5, 8.4, 16.5, 21.4],
          tip: "An 8-minute walk north of the bridge along St. Bernard Ave. Open lakefront: windy, bring a layer.",
        },
        {
          place: "cheer-elysian",
          miles: [4.8, 7.2, 17.8, 20.2],
          tip: "Far lakefront by UNO. Only worth it with a bike: car access here is placard-only on race day.",
        },
        {
          place: "cheer-palm",
          miles: [12.2, 25.2],
          tip: "The last mile. Cheer here, then walk about 5 minutes to the finish while your runner covers a mile.",
        },
      ],
    }),
  },
});
