// When will a runner pass a given mile? A target pace that slows steadily by `fadePercent` by the
// finish (most marathoners fade), plus a window that widens with distance and leans late, since
// runners fall behind plan far more often than they beat it.

export type PacePlan = {
  /** ISO time the runner crosses the start mat. */
  startsAt: string;
  paceSecondsPerMile: number;
  /** How much slower the last mile is than the first, in percent. 0 = even pace. */
  fadePercent: number;
};

export type EtaWindow = { earliest: Date; expected: Date; latest: Date };

/** Seconds from the start mat to `mile`, with pace rising linearly from p to p·(1+fade). */
export function elapsedSeconds(plan: PacePlan, mile: number, distanceMiles: number) {
  const fade = plan.fadePercent / 100;
  return plan.paceSecondsPerMile * (mile + (fade * mile * mile) / (2 * distanceMiles));
}

const MIN_SPREAD_SECONDS = 120;
const SPREAD_FRACTION = 0.04;
const LATE_BIAS = 1.5;

export function etaWindow(plan: PacePlan, mile: number, distanceMiles: number): EtaWindow {
  const start = Date.parse(plan.startsAt);
  const elapsed = elapsedSeconds(plan, mile, distanceMiles);
  const spread = Math.max(MIN_SPREAD_SECONDS, elapsed * SPREAD_FRACTION);
  return {
    earliest: new Date(start + (elapsed - spread) * 1000),
    expected: new Date(start + elapsed * 1000),
    latest: new Date(start + (elapsed + spread * LATE_BIAS) * 1000),
  };
}

export function finishTime(plan: PacePlan, distanceMiles: number) {
  return new Date(Date.parse(plan.startsAt) + elapsedSeconds(plan, distanceMiles, distanceMiles) * 1000);
}

/** "9:30 /mi" */
export function formatPace(secondsPerMile: number) {
  const m = Math.floor(secondsPerMile / 60);
  const s = Math.round(secondsPerMile % 60);
  return `${m}:${String(s).padStart(2, "0")} /mi`;
}

/** "4:12" (h:mm) for a duration in seconds. */
export function formatDuration(seconds: number) {
  const totalMinutes = Math.round(seconds / 60);
  return `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, "0")}`;
}
