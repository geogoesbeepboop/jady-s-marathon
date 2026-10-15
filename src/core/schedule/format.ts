// Pure display helpers. Everything is shown in the event's timezone, not the phone's, so a
// supporter flying in from another coast still sees "race starts 7:30 AM".

export type DayGroup<T> = { day: string; label: string; items: T[] };

export function dayKey(iso: string, timeZone: string) {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(iso),
  );
}

export function groupByDay<T extends { startsAt: string }>(items: T[], timeZone: string): DayGroup<T>[] {
  const label = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long", month: "short", day: "numeric" });
  const groups = new Map<string, DayGroup<T>>();
  for (const item of [...items].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
    const day = dayKey(item.startsAt, timeZone);
    if (!groups.has(day)) groups.set(day, { day, label: label.format(new Date(item.startsAt)), items: [] });
    groups.get(day)!.items.push(item);
  }
  return [...groups.values()];
}

export function formatTimeRange(startsAt: string, endsAt: string | null, timeZone: string) {
  const time = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" });
  return endsAt ? time.formatRange(new Date(startsAt), new Date(endsAt)) : time.format(new Date(startsAt));
}

type Mappable = { name: string; address: string | null; lat: number | null; lng: number | null };

/** A universal Google Maps link (opens the app on either phone), or null while the place is TBD. */
export function mapsUrl(place: Mappable) {
  const query =
    place.lat != null && place.lng != null
      ? `${place.lat},${place.lng}`
      : place.address && place.address !== "TBD"
        ? `${place.name}, ${place.address}`
        : null;
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}
