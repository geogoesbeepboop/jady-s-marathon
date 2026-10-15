import type { AgendaItem } from "./agenda";
import { formatTimeRange, groupByDay, mapsUrl } from "./format";

export function ScheduleView({ agenda, timeZone }: { agenda: AgendaItem[]; timeZone: string }) {
  if (agenda.length === 0) {
    return <p className="text-ev-muted">Nothing on the schedule yet.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {groupByDay(agenda, timeZone).map((group) => (
        <section key={group.day} aria-labelledby={`day-${group.day}`}>
          <h2 id={`day-${group.day}`} className="sticky top-0 z-10 bg-ev-bg py-2 text-sm font-semibold uppercase tracking-wide text-ev-muted">
            {group.label}
          </h2>
          <ol className="flex flex-col gap-3">
            {group.items.map((item) => (
              <li key={item.id}>
                <AgendaCard item={item} timeZone={timeZone} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function AgendaCard({ item, timeZone }: { item: AgendaItem; timeZone: string }) {
  const directions = item.place ? mapsUrl(item.place) : null;

  return (
    <article data-testid="agenda-item" className="rounded-2xl border border-ev-line bg-ev-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium tabular-nums text-ev-accent">
          {formatTimeRange(item.startsAt, item.endsAt, timeZone)}
        </p>
        {item.audiences.length > 0 && (
          <span className="rounded-full bg-ev-accent/10 px-2 py-0.5 text-xs font-medium text-ev-accent">
            {item.audiences.join(" + ")} only
          </span>
        )}
      </div>
      <h3 className="mt-1 text-lg font-semibold leading-snug">{item.title}</h3>

      {item.place && (
        <p className="mt-1 text-sm text-ev-muted">
          {directions ? (
            <a href={directions} className="underline decoration-ev-line underline-offset-4">
              {item.place.name}
            </a>
          ) : (
            item.place.name
          )}
          {item.place.notes && <span> · {item.place.notes}</span>}
        </p>
      )}
      {item.details && <p className="mt-2 text-[15px] leading-relaxed">{item.details}</p>}
      {item.dressCode && (
        <p className="mt-2 text-sm">
          <span className="text-ev-muted">Dress code:</span> {item.dressCode}
        </p>
      )}
    </article>
  );
}
