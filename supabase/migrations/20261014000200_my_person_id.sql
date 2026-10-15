-- The person this device is bound to in an event (null if none). For write policies: a guest may
-- only write rows that are about themselves.
create function public.my_person_id(p_event_id uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select person_id from public.person_devices
  where auth_user_id = (select auth.uid()) and event_id = p_event_id
$$;

revoke execute on function public.my_person_id(uuid) from public, anon, authenticated;
grant execute on function public.my_person_id(uuid) to authenticated;
