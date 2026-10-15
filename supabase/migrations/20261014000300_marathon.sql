-- Marathon module: the race, its runners, and cheer spots supporters can claim. These tables hang
-- off the event core (events, people, places); the core never references them.

create table public.marathon_races (
  event_id uuid primary key references public.events on delete cascade,
  name text not null,
  distance_miles numeric(5, 2) not null default 26.2 check (distance_miles > 0),
  course jsonb, -- GeoJSON LineString from start to finish, [lng, lat] pairs
  tracker_url text, -- the official live-tracking page or app
  tracker_note text
);

-- starts_at is when the runner is expected to cross the start mat (their corral's start).
create table public.marathon_runners (
  person_id uuid primary key,
  event_id uuid not null,
  bib text,
  corral text,
  starts_at timestamptz not null,
  pace_seconds_per_mile integer not null check (pace_seconds_per_mile between 240 and 1800),
  fade_percent numeric(4, 1) not null default 0 check (fade_percent between 0 and 50),
  tracker_url text,
  foreign key (person_id, event_id) references public.people (id, event_id) on delete cascade
);

-- A cheer spot is a place of kind 'cheer' plus the mile(s) where runners pass it. Some spots
-- are passed twice, so miles is an array.
create table public.marathon_cheer_spots (
  place_id uuid primary key,
  event_id uuid not null,
  miles numeric(5, 2)[] not null check (cardinality(miles) between 1 and 4),
  tip text,
  unique (place_id, event_id),
  foreign key (place_id, event_id) references public.places (id, event_id) on delete cascade
);

-- "I'll be here." The only table guests write to. Survives re-seeding as long as the spot does.
create table public.marathon_cheer_claims (
  place_id uuid not null,
  person_id uuid not null,
  event_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (place_id, person_id),
  foreign key (place_id, event_id) references public.marathon_cheer_spots (place_id, event_id) on delete cascade,
  foreign key (person_id, event_id) references public.people (id, event_id) on delete cascade
);
create index marathon_cheer_claims_person_id_idx on public.marathon_cheer_claims (person_id);

alter table public.marathon_races enable row level security;
alter table public.marathon_runners enable row level security;
alter table public.marathon_cheer_spots enable row level security;
alter table public.marathon_cheer_claims enable row level security;

create policy "members read the race" on public.marathon_races
  for select to authenticated using (public.is_event_member(event_id));
create policy "members read runners" on public.marathon_runners
  for select to authenticated using (public.is_event_member(event_id));
create policy "members read cheer spots" on public.marathon_cheer_spots
  for select to authenticated using (public.is_event_member(event_id));
create policy "members read cheer claims" on public.marathon_cheer_claims
  for select to authenticated using (public.is_event_member(event_id));
create policy "guests claim spots as themselves" on public.marathon_cheer_claims
  for insert to authenticated with check (person_id = public.my_person_id(event_id));
create policy "guests drop their own claims" on public.marathon_cheer_claims
  for delete to authenticated using (person_id = public.my_person_id(event_id));

revoke all on public.marathon_races, public.marathon_runners, public.marathon_cheer_spots,
  public.marathon_cheer_claims from anon, authenticated;
grant select on public.marathon_races, public.marathon_runners, public.marathon_cheer_spots,
  public.marathon_cheer_claims to authenticated;
grant insert, delete on public.marathon_cheer_claims to authenticated;

-- Applies the marathon block of an event seed after seed_event() has run for that event.
-- p_data null removes the race. Places, people and timezone come from the core seed.
create function public.seed_marathon(p_slug text, p_data jsonb) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_event_id uuid;
  v_tz text;
begin
  select id, timezone into v_event_id, v_tz from public.events where slug = p_slug;
  if v_event_id is null then
    raise exception 'no event %', p_slug;
  end if;

  if p_data is null then
    delete from public.marathon_cheer_spots where event_id = v_event_id;
    delete from public.marathon_runners where event_id = v_event_id;
    delete from public.marathon_races where event_id = v_event_id;
    return;
  end if;

  insert into public.marathon_races (event_id, name, distance_miles, course, tracker_url, tracker_note)
  values (
    v_event_id, p_data->>'name', coalesce((p_data->>'distanceMiles')::numeric, 26.2),
    p_data->'course', p_data->>'trackerUrl', p_data->>'trackerNote'
  )
  on conflict (event_id) do update set
    name = excluded.name, distance_miles = excluded.distance_miles, course = excluded.course,
    tracker_url = excluded.tracker_url, tracker_note = excluded.tracker_note;

  insert into public.marathon_runners
    (person_id, event_id, bib, corral, starts_at, pace_seconds_per_mile, fade_percent, tracker_url)
  select
    p.id, v_event_id, x.bib, x.corral, x."startsAt"::timestamp at time zone v_tz,
    x."paceSecondsPerMile", coalesce(x."fadePercent", 0), x."trackerUrl"
  from jsonb_to_recordset(coalesce(p_data->'runners', '[]')) as x(
    person text, bib text, corral text, "startsAt" text, "paceSecondsPerMile" integer,
    "fadePercent" numeric, "trackerUrl" text
  )
  join public.people p on p.event_id = v_event_id and p.key = x.person
  on conflict (person_id) do update set
    bib = excluded.bib, corral = excluded.corral, starts_at = excluded.starts_at,
    pace_seconds_per_mile = excluded.pace_seconds_per_mile, fade_percent = excluded.fade_percent,
    tracker_url = excluded.tracker_url;
  delete from public.marathon_runners r
  where r.event_id = v_event_id
    and r.person_id not in (
      select p.id from public.people p
      join jsonb_array_elements(coalesce(p_data->'runners', '[]')) x on p.key = x->>'person'
      where p.event_id = v_event_id
    );

  insert into public.marathon_cheer_spots (place_id, event_id, miles, tip)
  select pl.id, v_event_id, x.miles, x.tip
  from jsonb_to_recordset(coalesce(p_data->'cheerSpots', '[]')) as x(place text, miles numeric[], tip text)
  join public.places pl on pl.event_id = v_event_id and pl.key = x.place
  on conflict (place_id) do update set miles = excluded.miles, tip = excluded.tip;
  delete from public.marathon_cheer_spots s
  where s.event_id = v_event_id
    and s.place_id not in (
      select pl.id from public.places pl
      join jsonb_array_elements(coalesce(p_data->'cheerSpots', '[]')) x on pl.key = x->>'place'
      where pl.event_id = v_event_id
    );
end
$$;

revoke execute on function public.seed_marathon(text, jsonb) from public, anon, authenticated;
