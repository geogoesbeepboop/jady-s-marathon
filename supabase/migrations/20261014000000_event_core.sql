-- Event core: an event, the people in it, where things happen, and who sees which agenda item.
-- Guests never get accounts. A private join link binds an anonymous Supabase session to one
-- person (person_devices), and every policy below resolves auth.uid() through that binding.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  timezone text not null,
  starts_on date not null,
  ends_on date not null,
  theme jsonb not null default '{}',
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  key text not null,
  name text not null,
  kind text not null check (kind in ('hotel', 'venue', 'meetup', 'cheer', 'transit', 'other')),
  address text,
  lat double precision,
  lng double precision,
  notes text,
  unique (event_id, key),
  unique (id, event_id)
);

-- role is free text so each event defines its own (runner/supporter, guest/host, ...).
create table public.people (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  key text not null,
  display_name text not null,
  role text not null,
  unique (event_id, key),
  unique (id, event_id)
);

-- Kept apart from people so no member-facing policy can ever expose a hash. Service role only.
create table public.join_tokens (
  person_id uuid primary key references public.people on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now()
);

-- One person per device per event; redeeming another link on the same device switches identity.
create table public.person_devices (
  auth_user_id uuid not null references auth.users on delete cascade,
  event_id uuid not null references public.events on delete cascade,
  person_id uuid not null,
  bound_at timestamptz not null default now(),
  primary key (auth_user_id, event_id),
  foreign key (person_id, event_id) references public.people (id, event_id) on delete cascade
);
create index person_devices_person_id_idx on public.person_devices (person_id);

create table public.audiences (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  key text not null,
  name text not null,
  unique (event_id, key),
  unique (id, event_id)
);

create table public.audience_members (
  audience_id uuid not null,
  person_id uuid not null,
  event_id uuid not null,
  primary key (audience_id, person_id),
  foreign key (audience_id, event_id) references public.audiences (id, event_id) on delete cascade,
  foreign key (person_id, event_id) references public.people (id, event_id) on delete cascade
);
create index audience_members_person_id_idx on public.audience_members (person_id);

create table public.agenda_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  key text not null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  place_id uuid,
  details text,
  dress_code text,
  unique (event_id, key),
  unique (id, event_id),
  check (ends_at is null or ends_at >= starts_at),
  foreign key (place_id, event_id) references public.places (id, event_id) on delete set null (place_id)
);
create index agenda_items_event_starts_idx on public.agenda_items (event_id, starts_at);

-- An item with no audiences is visible to the whole event; otherwise only to listed audiences.
create table public.agenda_item_audiences (
  agenda_item_id uuid not null,
  audience_id uuid not null,
  event_id uuid not null,
  primary key (agenda_item_id, audience_id),
  foreign key (agenda_item_id, event_id) references public.agenda_items (id, event_id) on delete cascade,
  foreign key (audience_id, event_id) references public.audiences (id, event_id) on delete cascade
);
create index agenda_item_audiences_audience_id_idx on public.agenda_item_audiences (audience_id);

-- Policy helpers. security definer so policies can read person_devices without recursing into RLS.

create function public.is_event_member(p_event_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.person_devices
    where auth_user_id = (select auth.uid()) and event_id = p_event_id
  )
$$;

create function public.can_see_agenda_item(p_item_id uuid, p_event_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_event_member(p_event_id) and (
    not exists (select 1 from public.agenda_item_audiences where agenda_item_id = p_item_id)
    or exists (
      select 1
      from public.agenda_item_audiences aia
      join public.audience_members am on am.audience_id = aia.audience_id
      join public.person_devices pd on pd.person_id = am.person_id
      where aia.agenda_item_id = p_item_id and pd.auth_user_id = (select auth.uid())
    )
  )
$$;

alter table public.events enable row level security;
alter table public.places enable row level security;
alter table public.people enable row level security;
alter table public.join_tokens enable row level security;
alter table public.person_devices enable row level security;
alter table public.audiences enable row level security;
alter table public.audience_members enable row level security;
alter table public.agenda_items enable row level security;
alter table public.agenda_item_audiences enable row level security;

create policy "members read their event" on public.events
  for select to authenticated using (public.is_event_member(id));
create policy "members read places" on public.places
  for select to authenticated using (public.is_event_member(event_id));
create policy "members read people" on public.people
  for select to authenticated using (public.is_event_member(event_id));
create policy "devices read their own binding" on public.person_devices
  for select to authenticated using (auth_user_id = (select auth.uid()));
create policy "members read audiences" on public.audiences
  for select to authenticated using (public.is_event_member(event_id));
create policy "members read audience members" on public.audience_members
  for select to authenticated using (public.is_event_member(event_id));
create policy "members read visible agenda items" on public.agenda_items
  for select to authenticated using (public.can_see_agenda_item(id, event_id));
create policy "members read audiences of visible items" on public.agenda_item_audiences
  for select to authenticated using (public.can_see_agenda_item(agenda_item_id, event_id));

-- Reads only. Writes go through the seed (service role) or security definer functions.
revoke all on public.events, public.places, public.people, public.join_tokens, public.person_devices,
  public.audiences, public.audience_members, public.agenda_items, public.agenda_item_audiences
  from anon, authenticated;
grant select on public.events, public.places, public.people, public.person_devices,
  public.audiences, public.audience_members, public.agenda_items, public.agenda_item_audiences
  to authenticated;

-- Shown on the join page before the device is bound. Reveals only what the link holder is owed.
create function public.preview_join_token(p_token text)
returns table (display_name text, event_name text, theme jsonb)
language sql stable security definer set search_path = '' as $$
  select p.display_name, e.name, e.theme
  from public.join_tokens t
  join public.people p on p.id = t.person_id
  join public.events e on e.id = p.event_id
  where t.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
$$;

create function public.redeem_join_token(p_token text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_person_id uuid;
  v_event_id uuid;
  v_slug text;
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  select p.id, p.event_id into v_person_id, v_event_id
  from public.join_tokens t
  join public.people p on p.id = t.person_id
  where t.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');

  if v_person_id is null then
    raise exception 'invalid join link' using errcode = 'P0002';
  end if;

  insert into public.person_devices (auth_user_id, event_id, person_id)
  values (v_uid, v_event_id, v_person_id)
  on conflict (auth_user_id, event_id)
  do update set person_id = excluded.person_id, bound_at = now();

  select slug into v_slug from public.events where id = v_event_id;
  return v_slug;
end
$$;

revoke execute on function public.is_event_member(uuid), public.can_see_agenda_item(uuid, uuid),
  public.redeem_join_token(text), public.preview_join_token(text) from public, anon, authenticated;
grant execute on function public.is_event_member(uuid), public.can_see_agenda_item(uuid, uuid),
  public.redeem_join_token(text) to authenticated;
grant execute on function public.preview_join_token(text) to anon, authenticated;
