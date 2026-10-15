import { fitProjection, svgPath, thin, type LngLat } from "./course-geometry";

type Marker = { lng: number; lat: number };
type Spot = Marker & { label: string };

// Rendered on the server as plain SVG, so it still shows on a cached page with no signal.
export function CourseSvg({ course, spots, meetups }: { course: LngLat[]; spots: Spot[]; meetups: Marker[] }) {
  const points = thin(course);
  const { width, height, project } = fitProjection([...points, ...spots.map((s) => [s.lng, s.lat] as LngLat)]);
  const start = project(points[0]);
  const finish = project(points[points.length - 1]);

  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Course drawing with numbered cheer spots"
        className="w-full rounded-2xl border border-ev-line bg-ev-card"
      >
        <path d={svgPath(points.map(project))} fill="none" stroke="var(--ev-accent)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
        <circle cx={start.x} cy={start.y} r={6} fill="var(--ev-card)" stroke="var(--ev-fg)" strokeWidth={2} />
        <rect x={finish.x - 6} y={finish.y - 6} width={12} height={12} fill="var(--ev-fg)" />
        {meetups.map((m, i) => {
          const p = project([m.lng, m.lat]);
          return <rect key={i} x={p.x - 5} y={p.y - 5} width={10} height={10} rx={2} fill="var(--ev-muted)" transform={`rotate(45 ${p.x} ${p.y})`} />;
        })}
        {spots.map((s, i) => {
          const p = project([s.lng, s.lat]);
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={10} fill="var(--ev-accent)" stroke="var(--ev-card)" strokeWidth={2} />
              <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill="var(--ev-accent-fg)">
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ev-muted">
        <span>○ start</span>
        <span>■ finish</span>
        <span>◆ meet-up</span>
        <span>numbers = cheer spots below</span>
      </figcaption>
    </figure>
  );
}
