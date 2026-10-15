-- Applies an event seed (events/<slug>/event.ts, validated in TypeScript first) in one transaction.
-- The seed is the source of truth: rows whose key left the seed are deleted. Times arrive as local
-- wall-clock strings and are converted in the event's timezone here, so DST is Postgres's problem.
--
-- p_token_hashes holds a candidate hash for every person; only people without a token, or listed
-- in p_rotate, get theirs written. Rotating also signs out every device bound to that person.
-- Returns the keys of people who were issued a new token.

create function public.seed_event(p_seed jsonb, p_token_hashes jsonb, p_rotate text[] default '{}')
returns table (person_key text)
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_event_id uuid;
  v_tz text := p_seed->>'timezone';
begin
  insert into public.events (slug, name, timezone, starts_on, ends_on, theme)
  values (
    p_seed->>'slug', p_seed->>'name', v_tz,
    (p_seed->>'startsOn')::date, (p_seed->>'endsOn')::date, coalesce(p_seed->'theme', '{}')
  )
  on conflict (slug) do update set
    name = excluded.name, timezone = excluded.timezone, starts_on = excluded.starts_on,
    ends_on = excluded.ends_on, theme = excluded.theme
  returning id into v_event_id;

  insert into public.places (event_id, key, name, kind, address, lat, lng, notes)
  select v_event_id, x.key, x.name, x.kind, x.address, x.lat, x.lng, x.notes
  from jsonb_to_recordset(coalesce(p_seed->'places', '[]')) as x(
    key text, name text, kind text, address text, lat double precision, lng double precision, notes text
  )
  on conflict (event_id, key) do update set
    name = excluded.name, kind = excluded.kind, address = excluded.address,
    lat = excluded.lat, lng = excluded.lng, notes = excluded.notes;
  delete from public.places
  where event_id = v_event_id
    and key not in (select x->>'key' from jsonb_array_elements(coalesce(p_seed->'places', '[]')) x);

  insert into public.people (event_id, key, display_name, role)
  select v_event_id, x.key, x."displayName", x.role
  from jsonb_to_recordset(coalesce(p_seed->'people', '[]')) as x(key text, "displayName" text, role text)
  on conflict (event_id, key) do update set display_name = excluded.display_name, role = excluded.role;
  delete from public.people
  where event_id = v_event_id
    and key not in (select x->>'key' from jsonb_array_elements(coalesce(p_seed->'people', '[]')) x);

  insert into public.audiences (event_id, key, name)
  select v_event_id, x.key, x.name
  from jsonb_to_recordset(coalesce(p_seed->'audiences', '[]')) as x(key text, name text)
  on conflict (event_id, key) do update set name = excluded.name;
  delete from public.audiences
  where event_id = v_event_id
    and key not in (select x->>'key' from jsonb_array_elements(coalesce(p_seed->'audiences', '[]')) x);

  delete from public.audience_members where event_id = v_event_id;
  insert into public.audience_members (audience_id, person_id, event_id)
  select a.id, p.id, v_event_id
  from jsonb_array_elements(coalesce(p_seed->'audiences', '[]')) aj
  join public.audiences a on a.event_id = v_event_id and a.key = aj->>'key'
  cross join jsonb_array_elements_text(aj->'members') m(person_key)
  join public.people p on p.event_id = v_event_id and p.key = m.person_key;

  insert into public.agenda_items (event_id, key, title, starts_at, ends_at, place_id, details, dress_code)
  select
    v_event_id, x.key, x.title,
    x."startsAt"::timestamp at time zone v_tz,
    x."endsAt"::timestamp at time zone v_tz,
    pl.id, x.details, x."dressCode"
  from jsonb_to_recordset(coalesce(p_seed->'agenda', '[]')) as x(
    key text, title text, "startsAt" text, "endsAt" text, place text, details text, "dressCode" text
  )
  left join public.places pl on pl.event_id = v_event_id and pl.key = x.place
  on conflict (event_id, key) do update set
    title = excluded.title, starts_at = excluded.starts_at, ends_at = excluded.ends_at,
    place_id = excluded.place_id, details = excluded.details, dress_code = excluded.dress_code;
  delete from public.agenda_items
  where event_id = v_event_id
    and key not in (select x->>'key' from jsonb_array_elements(coalesce(p_seed->'agenda', '[]')) x);

  delete from public.agenda_item_audiences where event_id = v_event_id;
  insert into public.agenda_item_audiences (agenda_item_id, audience_id, event_id)
  select ai.id, a.id, v_event_id
  from jsonb_array_elements(coalesce(p_seed->'agenda', '[]')) ij
  join public.agenda_items ai on ai.event_id = v_event_id and ai.key = ij->>'key'
  cross join jsonb_array_elements_text(coalesce(ij->'audiences', '[]')) aud(audience_key)
  join public.audiences a on a.event_id = v_event_id and a.key = aud.audience_key;

  delete from public.person_devices pd
  using public.people p
  where p.id = pd.person_id and p.event_id = v_event_id and p.key = any(p_rotate);

  return query
  with issued as (
    insert into public.join_tokens (person_id, token_hash)
    select p.id, p_token_hashes->>p.key
    from public.people p
    where p.event_id = v_event_id
      and p_token_hashes ? p.key
      and (p.key = any(p_rotate) or not exists (select 1 from public.join_tokens t where t.person_id = p.id))
    on conflict (person_id) do update set token_hash = excluded.token_hash, created_at = now()
    returning join_tokens.person_id
  )
  select p.key from issued i join public.people p on p.id = i.person_id;
end
$$;

revoke execute on function public.seed_event(jsonb, jsonb, text[]) from public, anon, authenticated;
