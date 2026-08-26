begin;

create table public.directory_change_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  directory_person_id uuid not null references public.directory_people(id) on delete cascade,
  current_values jsonb not null default '{}'::jsonb,
  requested_changes jsonb not null,
  status text not null default 'pending',
  reviewer_profile_id uuid references public.profiles(id) on delete set null,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint directory_change_requests_status_allowed
    check (status in ('pending', 'approved', 'rejected')),
  constraint directory_change_requests_payload_object
    check (jsonb_typeof(current_values) = 'object' and jsonb_typeof(requested_changes) = 'object'),
  constraint directory_change_requests_payload_not_empty
    check (requested_changes <> '{}'::jsonb)
);

create unique index directory_change_requests_one_pending_idx
  on public.directory_change_requests (profile_id)
  where status = 'pending';

create index directory_change_requests_admin_queue_idx
  on public.directory_change_requests (status, created_at desc);

create index directory_change_requests_person_idx
  on public.directory_change_requests (directory_person_id, status);

create trigger set_directory_change_requests_updated_at
before update on public.directory_change_requests
for each row execute function public.set_updated_at();

alter table public.directory_change_requests enable row level security;

create policy "users read own directory change requests"
on public.directory_change_requests
for select
to authenticated
using (
  profile_id = public.current_profile_id()
  or public.is_admin()
);

grant select on public.directory_change_requests to authenticated;
grant all on public.directory_change_requests to service_role;

create or replace function public.update_my_contact_details(
  new_full_name text,
  new_phone text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles%rowtype;
  normalized_name text := btrim(coalesce(new_full_name, ''));
  normalized_phone text := nullif(btrim(coalesce(new_phone, '')), '');
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if char_length(normalized_name) < 2 or char_length(normalized_name) > 160 then
    raise exception 'INVALID_FULL_NAME' using errcode = '22023';
  end if;

  if normalized_phone is not null and char_length(normalized_phone) > 80 then
    raise exception 'INVALID_PHONE' using errcode = '22023';
  end if;

  select * into current_profile
  from public.profiles
  where auth_user_id = auth.uid()
    and is_active = true
  limit 1;

  if current_profile.id is null then
    raise exception 'ACTIVE_PROFILE_NOT_FOUND' using errcode = '42501';
  end if;

  update public.profiles
  set full_name = normalized_name
  where id = current_profile.id;

  if current_profile.directory_person_id is not null then
    update public.directory_people
    set full_name = normalized_name,
        phone = normalized_phone
    where id = current_profile.directory_person_id;
  end if;

  insert into public.audit_events (profile_id, event_type, entity_type, entity_id)
  values (current_profile.id, 'profile_contact_updated', 'profile', current_profile.id);
end;
$$;

create or replace function public.submit_my_directory_change_request(
  new_cuit text,
  new_area text,
  new_gcba_building text,
  new_link_type_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.profiles%rowtype;
  current_person public.directory_people%rowtype;
  normalized_cuit text := regexp_replace(coalesce(new_cuit, ''), '[^0-9]', '', 'g');
  normalized_area text := btrim(coalesce(new_area, ''));
  normalized_building text := nullif(btrim(coalesce(new_gcba_building, '')), '');
  current_links uuid[];
  requested_links uuid[];
  current_payload jsonb := '{}'::jsonb;
  changes_payload jsonb := '{}'::jsonb;
  request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select * into current_profile
  from public.profiles
  where auth_user_id = auth.uid()
    and is_active = true
  limit 1;

  if current_profile.id is null or current_profile.directory_person_id is null then
    raise exception 'DIRECTORY_PROFILE_NOT_FOUND' using errcode = '42501';
  end if;

  select * into current_person
  from public.directory_people
  where id = current_profile.directory_person_id
    and is_active = true;

  if current_person.id is null then
    raise exception 'DIRECTORY_PROFILE_NOT_FOUND' using errcode = '42501';
  end if;

  if normalized_cuit !~ '^[0-9]{11}$' then
    raise exception 'INVALID_CUIT' using errcode = '22023';
  end if;

  if normalized_area = '' or char_length(normalized_area) > 180 then
    raise exception 'INVALID_AREA' using errcode = '22023';
  end if;

  if normalized_building is not null and char_length(normalized_building) > 200 then
    raise exception 'INVALID_BUILDING' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct link_id order by link_id), array[]::uuid[])
  into requested_links
  from unnest(coalesce(new_link_type_ids, array[]::uuid[])) as requested(link_id);

  if exists (
    select 1
    from unnest(requested_links) as requested(link_id)
    where not exists (
      select 1
      from public.link_types link_type
      where link_type.id = requested.link_id
        and link_type.is_active = true
    )
  ) then
    raise exception 'INVALID_LINK_TYPE' using errcode = '22023';
  end if;

  select coalesce(array_agg(relation.link_type_id order by relation.link_type_id), array[]::uuid[])
  into current_links
  from public.directory_person_link_types relation
  join public.link_types link_type on link_type.id = relation.link_type_id and link_type.is_active = true
  where relation.person_id = current_person.id;

  if current_person.cuit is distinct from normalized_cuit then
    current_payload := current_payload || jsonb_build_object('cuit', current_person.cuit);
    changes_payload := changes_payload || jsonb_build_object('cuit', normalized_cuit);
  end if;

  if current_person.area is distinct from normalized_area then
    current_payload := current_payload || jsonb_build_object('area', current_person.area);
    changes_payload := changes_payload || jsonb_build_object('area', normalized_area);
  end if;

  if current_person.gcba_building is distinct from normalized_building then
    current_payload := current_payload || jsonb_build_object('gcba_building', current_person.gcba_building);
    changes_payload := changes_payload || jsonb_build_object('gcba_building', normalized_building);
  end if;

  if current_links is distinct from requested_links then
    current_payload := current_payload || jsonb_build_object('link_type_ids', to_jsonb(current_links));
    changes_payload := changes_payload || jsonb_build_object('link_type_ids', to_jsonb(requested_links));
  end if;

  if changes_payload = '{}'::jsonb then
    raise exception 'NO_CHANGES' using errcode = '22023';
  end if;

  insert into public.directory_change_requests (
    profile_id,
    directory_person_id,
    current_values,
    requested_changes,
    status,
    reviewer_profile_id,
    review_note,
    reviewed_at
  )
  values (
    current_profile.id,
    current_person.id,
    current_payload,
    changes_payload,
    'pending',
    null,
    null,
    null
  )
  on conflict (profile_id) where status = 'pending'
  do update set
    directory_person_id = excluded.directory_person_id,
    current_values = excluded.current_values,
    requested_changes = excluded.requested_changes,
    reviewer_profile_id = null,
    review_note = null,
    reviewed_at = null,
    updated_at = now()
  returning id into request_id;

  insert into public.audit_events (profile_id, event_type, entity_type, entity_id)
  values (current_profile.id, 'directory_change_requested', 'directory_change_request', request_id);

  return request_id;
end;
$$;

create or replace function public.review_directory_change_request(
  target_request_id uuid,
  approve_request boolean,
  reviewer_note text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewer_id uuid;
  request_row public.directory_change_requests%rowtype;
  changes jsonb;
  next_cuit text;
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  reviewer_id := public.current_profile_id();

  select * into request_row
  from public.directory_change_requests
  where id = target_request_id
    and status = 'pending'
  for update;

  if request_row.id is null then
    raise exception 'PENDING_REQUEST_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not approve_request then
    update public.directory_change_requests
    set status = 'rejected',
        reviewer_profile_id = reviewer_id,
        review_note = nullif(btrim(coalesce(reviewer_note, '')), ''),
        reviewed_at = now()
    where id = request_row.id;

    insert into public.audit_events (profile_id, event_type, entity_type, entity_id)
    values (reviewer_id, 'directory_change_rejected', 'directory_change_request', request_row.id);
    return 'rejected';
  end if;

  changes := request_row.requested_changes;

  if changes ? 'cuit' then
    next_cuit := changes ->> 'cuit';
    update public.directory_people set cuit = next_cuit where id = request_row.directory_person_id;
    update public.profiles set cuit = next_cuit where id = request_row.profile_id;
  end if;

  if changes ? 'area' then
    update public.directory_people
    set area = changes ->> 'area'
    where id = request_row.directory_person_id;
  end if;

  if changes ? 'gcba_building' then
    update public.directory_people
    set gcba_building = changes ->> 'gcba_building'
    where id = request_row.directory_person_id;
  end if;

  if changes ? 'link_type_ids' then
    delete from public.directory_person_link_types
    where person_id = request_row.directory_person_id;

    insert into public.directory_person_link_types (person_id, link_type_id)
    select request_row.directory_person_id, value::uuid
    from jsonb_array_elements_text(changes -> 'link_type_ids') as requested(value);
  end if;

  update public.directory_change_requests
  set status = 'approved',
      reviewer_profile_id = reviewer_id,
      review_note = nullif(btrim(coalesce(reviewer_note, '')), ''),
      reviewed_at = now()
  where id = request_row.id;

  insert into public.audit_events (profile_id, event_type, entity_type, entity_id)
  values (reviewer_id, 'directory_change_approved', 'directory_change_request', request_row.id);

  return 'approved';
end;
$$;

create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  person_id uuid;
begin
  if new.email is null or lower(new.email) = lower(coalesce(old.email, '')) then
    return new;
  end if;

  update public.profiles
  set email = new.email
  where auth_user_id = new.id
  returning directory_person_id into person_id;

  if person_id is not null then
    update public.directory_people
    set email = new.email
    where id = person_id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_profile_email_from_auth on auth.users;
create trigger sync_profile_email_from_auth
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.sync_profile_email_from_auth();

revoke all on function public.update_my_contact_details(text, text) from public;
revoke all on function public.submit_my_directory_change_request(text, text, text, uuid[]) from public;
revoke all on function public.review_directory_change_request(uuid, boolean, text) from public;
revoke all on function public.sync_profile_email_from_auth() from public;

grant execute on function public.update_my_contact_details(text, text) to authenticated;
grant execute on function public.submit_my_directory_change_request(text, text, text, uuid[]) to authenticated;
grant execute on function public.review_directory_change_request(uuid, boolean, text) to authenticated;

commit;
