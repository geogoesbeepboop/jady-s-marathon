# Event site engine

Private, per-person event sites for multi-day events. First instance: Jady's New Orleans Marathon
weekend (race day Saturday Nov 14, 2026).
Planned second instance: Mae Win Media luxury weddings, at which point this moves into the
WinPhotography monorepo as `apps/events`.

Each person gets a private link. Opening it binds an anonymous Supabase session on that phone to
that person, and Postgres row-level security decides what they see (e.g. runners-only items).
Nobody signs up.

## Run it locally

Needs Docker running.

```bash
pnpm install
pnpm db:start          # local Supabase on ports 553xx (WinPhotography keeps 543xx)
pnpm db:env            # writes .env.local from the running stack
pnpm seed jady-marathon
pnpm dev               # http://localhost:3100
```

Join links land in `.links/jady-marathon--127.0.0.1.csv`. That file is the only copy (tokens are
stored hashed). Lost it? `pnpm seed jady-marathon --rotate-all`.

## Layout

| Path | What |
|---|---|
| `events/<slug>/event.ts` | The event as data: people, audiences, places, agenda, theme, plus module blocks (`modules.marathon`). Edit, then re-seed. |
| `events/jady-marathon/course.json` | Course line traced from the official turn list over OpenStreetMap; the unpublished Lakeshore U-turn is placed so it measures 26.2 mi. Swap in the official GPX when it's published. |
| `src/core/` | Event-agnostic engine: access, schedule, places, theme, offline status. Lint fails if it imports `src/modules/` or `events/`. |
| `src/modules/marathon/` | Race day: runners, pace→ETA windows, cheer spots and claims, course drawing, street map. |
| `src/seed.ts` | Composes the core seed with module seeds (the only place that knows which modules exist). |
| `public/sw.js` | Offline: keeps the last good copy of each event page (production builds only). |
| `supabase/migrations/` | Schema, RLS, `seed_event()`, `seed_marathon()` |

## Checks

```bash
pnpm lint && pnpm typecheck
pnpm test              # unit + RLS (RLS needs the local stack)
pnpm e2e               # Playwright on a production build (the service worker is production-only)
pnpm build
```

## Commands

| Command | Does |
|---|---|
| `pnpm seed <slug>` | Apply `events/<slug>/event.ts`; issues links only to new people |
| `pnpm seed <slug> --rotate jady,cheer-1` | New links for those people; signs out their devices |
| `pnpm db:reset` | Rebuild the local DB from migrations (re-seed after) |
| `pnpm db:types` | Regenerate `src/core/db/database.types.ts` after a migration |
