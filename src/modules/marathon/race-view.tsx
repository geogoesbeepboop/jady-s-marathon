import type { Place } from "@/core/places/places";
import { formatTimeRange, mapsUrl } from "@/core/schedule/format";
import { ClaimButton } from "./claim-button";
import { CourseSvg } from "./course-svg";
import { etaWindow, finishTime, formatDuration, formatPace, elapsedSeconds } from "./eta";
import type { Race, Runner } from "./race";
import { StreetMap } from "./street-map";

type Props = {
  race: Race;
  eventSlug: string;
  viewer: { personId: string; role: string };
  meetups: Place[];
  timeZone: string;
};

export function RaceView({ race, eventSlug, viewer, meetups, timeZone }: Props) {
  const time = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" });
  const mappedSpots = race.spots.flatMap((s, i) =>
    s.lat != null && s.lng != null ? [{ lat: s.lat, lng: s.lng, label: String(i + 1) }] : [],
  );
  const mappedMeetups = meetups.filter((m) => m.lat != null && m.lng != null) as { lat: number; lng: number }[];
  const isRunner = race.runners.some((r) => r.personId === viewer.personId);

  return (
    <div className="flex flex-col gap-8">
      {race.trackerUrl ? (
        <a
          href={race.trackerUrl}
          className="flex flex-col gap-0.5 rounded-2xl bg-ev-accent px-5 py-4 text-ev-accent-fg"
        >
          <span className="text-base font-semibold">Live tracking →</span>
          <span className="text-sm opacity-90">{race.trackerNote ?? "Official splits from the timing mats."}</span>
        </a>
      ) : (
        race.trackerNote && (
          <div className="flex flex-col gap-0.5 rounded-2xl border border-ev-line bg-ev-card px-5 py-4">
            <span className="text-base font-semibold">Live tracking</span>
            <span className="text-sm text-ev-muted">{race.trackerNote}</span>
          </div>
        )
      )}

      <section aria-labelledby="runners" className="flex flex-col gap-3">
        <h2 id="runners" className="text-sm font-semibold uppercase tracking-wide text-ev-muted">
          Our runners
        </h2>
        {race.runners.map((runner) => (
          <RunnerCard key={runner.personId} runner={runner} race={race} time={time} />
        ))}
      </section>

      {race.course && (
        <section aria-labelledby="course" className="flex flex-col gap-3">
          <h2 id="course" className="text-sm font-semibold uppercase tracking-wide text-ev-muted">
            Course
          </h2>
          <CourseSvg course={race.course} spots={mappedSpots} meetups={mappedMeetups} />
          <StreetMap course={race.course} spots={mappedSpots} />
        </section>
      )}

      <section aria-labelledby="cheer" className="flex flex-col gap-3">
        <h2 id="cheer" className="text-sm font-semibold uppercase tracking-wide text-ev-muted">
          Cheer spots
        </h2>
        <p className="text-sm text-ev-muted">
          Times are estimates from each runner&apos;s target pace. Use live tracking on the day.
        </p>
        <ol className="flex flex-col gap-3">
          {race.spots.map((spot, i) => {
            const directions = mapsUrl(spot);
            const claimed = spot.claimedBy.some((c) => c.personId === viewer.personId);
            return (
              <li key={spot.placeId} data-testid="cheer-spot" className="rounded-2xl border border-ev-line bg-ev-card p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ev-accent text-sm font-bold text-ev-accent-fg">
                    {i + 1}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="text-lg font-semibold leading-snug">{spot.name}</h3>
                    <p className="text-sm text-ev-muted">
                      {spot.miles.length === 1 ? "Runners pass once" : `Runners pass ${spot.miles.length} times`}
                      {directions && (
                        <>
                          {" · "}
                          <a href={directions} className="underline decoration-ev-line underline-offset-4">
                            Directions
                          </a>
                        </>
                      )}
                    </p>
                    {spot.tip && <p className="text-[15px] leading-relaxed">{spot.tip}</p>}
                  </div>
                </div>

                {race.runners.length > 0 && (
                  <ul className="mt-3 flex flex-col">
                    {spot.miles.map((mile) => {
                      const etas = race.runners
                        .map((runner) => ({ runner, window: etaWindow(runner, mile, race.distanceMiles) }))
                        .sort((a, b) => a.window.expected.getTime() - b.window.expected.getTime());
                      const from = etas[0].window.earliest;
                      const to = new Date(Math.max(...etas.map((e) => e.window.latest.getTime())));
                      return (
                        <li key={mile} data-testid="pass" className="flex items-baseline gap-3 border-t border-ev-line py-2">
                          <span className="w-16 shrink-0 text-sm font-semibold tabular-nums">Mile {mile}</span>
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <p className="text-sm tabular-nums">
                              {etas.map(({ runner, window }, i) => (
                                <span key={runner.personId}>
                                  {i > 0 && " · "}
                                  <span className="whitespace-nowrap">
                                    {runner.name} ~{time.format(window.expected)}
                                  </span>
                                </span>
                              ))}
                            </p>
                            <p className="text-xs tabular-nums text-ev-muted">
                              Watch {formatTimeRange(from.toISOString(), to.toISOString(), timeZone)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-ev-muted">
                    {spot.claimedBy.length ? `Here: ${spot.claimedBy.map((c) => c.name).join(", ")}` : "Nobody here yet"}
                  </p>
                  {!isRunner && <ClaimButton eventSlug={eventSlug} placeId={spot.placeId} claimed={claimed} />}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {meetups.length > 0 && (
        <section aria-labelledby="meetup" className="flex flex-col gap-3">
          <h2 id="meetup" className="text-sm font-semibold uppercase tracking-wide text-ev-muted">
            After the finish
          </h2>
          {meetups.map((place) => {
            const directions = mapsUrl(place);
            return (
              <div key={place.id} className="rounded-2xl border border-ev-line bg-ev-card p-4">
                <h3 className="text-lg font-semibold">{place.name}</h3>
                {place.notes && <p className="mt-1 text-[15px]">{place.notes}</p>}
                {directions && (
                  <a href={directions} className="mt-1 inline-block text-sm text-ev-muted underline decoration-ev-line underline-offset-4">
                    Directions
                  </a>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

function RunnerCard({ runner, race, time }: { runner: Runner; race: Race; time: Intl.DateTimeFormat }) {
  const finish = finishTime(runner, race.distanceMiles);
  const tracker = runner.trackerUrl ?? race.trackerUrl;

  return (
    <article data-testid="runner" className="rounded-2xl border border-ev-line bg-ev-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold">{runner.name}</h3>
        {runner.bib && <span className="text-sm tabular-nums text-ev-muted">Bib {runner.bib}</span>}
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-ev-muted">Starts</dt>
          <dd className="font-medium tabular-nums">{time.format(new Date(runner.startsAt))}</dd>
          {runner.corral && <dd className="text-xs text-ev-muted">Corral {runner.corral}</dd>}
        </div>
        <div>
          <dt className="text-ev-muted">Target</dt>
          <dd className="font-medium tabular-nums">{formatPace(runner.paceSecondsPerMile)}</dd>
        </div>
        <div>
          <dt className="text-ev-muted">Finish ~</dt>
          <dd className="font-medium tabular-nums">{time.format(finish)}</dd>
          <dd className="text-xs text-ev-muted">{formatDuration(elapsedSeconds(runner, race.distanceMiles, race.distanceMiles))}</dd>
        </div>
      </dl>
      {tracker && (
        <a href={tracker} className="mt-2 inline-block text-sm font-medium text-ev-accent underline underline-offset-4">
          Track {runner.name} live
        </a>
      )}
    </article>
  );
}
