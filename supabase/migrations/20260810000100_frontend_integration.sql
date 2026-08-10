begin;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.directory_people to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.link_types to authenticated;
grant select, insert, update, delete on public.directory_person_link_types to authenticated;
grant select, insert, update, delete on public.sections to authenticated;
grant select, insert, update, delete on public.section_resources to authenticated;
grant select, insert, update, delete on public.resource_files to authenticated;
grant select, insert, update, delete on public.audit_events to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter table public.directory_people
  alter column cuit drop not null,
  alter column email drop not null;

alter table public.profiles
  alter column cuit drop not null;

alter table public.section_resources
  add column if not exists is_featured boolean not null default false,
  add column if not exists published_at timestamptz not null default now();

alter table public.resource_files
  add column if not exists allow_download boolean not null default true;

alter table public.directory_people
  drop constraint if exists directory_people_email_key;

create index if not exists section_resources_published_idx
  on public.section_resources (published_at desc)
  where is_active = true;

create index if not exists directory_people_building_idx
  on public.directory_people (gcba_building)
  where is_active = true;

create index if not exists directory_people_name_search_idx
  on public.directory_people using gin (
    to_tsvector(
      'simple',
      coalesce(full_name, '') || ' ' ||
      coalesce(area, '') || ' ' ||
      coalesce(email::text, '') || ' ' ||
      coalesce(gcba_building, '') || ' ' ||
      coalesce(job_role, '')
    )
  );

-- Remove the two provisional records from the earlier local draft, if that
-- draft reached a remote environment before it was corrected.
delete from public.directory_people
where cuit in ('00-00000000-0', '00-00000001-9');

revoke select on public.directory_people from authenticated;
grant select (
  id,
  area,
  full_name,
  phone,
  email,
  job_role,
  gcba_building,
  is_active,
  created_at,
  updated_at
) on public.directory_people to authenticated;

revoke select on public.profiles from authenticated;
grant select (
  id,
  auth_user_id,
  directory_person_id,
  email,
  full_name,
  role,
  must_change_password,
  is_active,
  first_login_at,
  last_login_at,
  created_at,
  updated_at
) on public.profiles to authenticated;

create or replace function public.link_auth_user_to_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null then
    return new;
  end if;

  update public.profiles
  set auth_user_id = new.id,
      updated_at = now()
  where lower(email::text) = lower(new.email)
    and (auth_user_id is null or auth_user_id = new.id);

  return new;
end;
$$;

drop trigger if exists link_auth_user_to_profile on auth.users;
create trigger link_auth_user_to_profile
after insert or update of email on auth.users
for each row execute function public.link_auth_user_to_profile();

create or replace function public.record_login()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_uuid uuid;
begin
  update public.profiles
  set last_login_at = now(),
      updated_at = now()
  where auth_user_id = auth.uid()
    and is_active = true
  returning id into profile_uuid;

  if profile_uuid is null then
    raise exception 'ACTIVE_PROFILE_NOT_FOUND';
  end if;

  insert into public.audit_events (profile_id, event_type, entity_type)
  values (profile_uuid, 'login', 'session');
end;
$$;

create or replace function public.complete_password_change()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_uuid uuid;
begin
  update public.profiles
  set must_change_password = false,
      first_login_at = coalesce(first_login_at, now()),
      updated_at = now()
  where auth_user_id = auth.uid()
    and is_active = true
  returning id into profile_uuid;

  if profile_uuid is null then
    raise exception 'ACTIVE_PROFILE_NOT_FOUND';
  end if;

  insert into public.audit_events (profile_id, event_type, entity_type)
  values (profile_uuid, 'password_changed', 'profile');
end;
$$;

create or replace function public.log_audit_event(
  event_name text,
  target_type text default null,
  target_id uuid default null,
  event_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_uuid uuid;
begin
  select id into profile_uuid
  from public.profiles
  where auth_user_id = auth.uid()
    and is_active = true
  limit 1;

  if profile_uuid is null then
    raise exception 'ACTIVE_PROFILE_NOT_FOUND';
  end if;

  insert into public.audit_events (profile_id, event_type, entity_type, entity_id, metadata)
  values (
    profile_uuid,
    left(event_name, 120),
    nullif(left(target_type, 120), ''),
    target_id,
    coalesce(event_metadata, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.link_auth_user_to_profile() from public;
revoke all on function public.record_login() from public;
revoke all on function public.complete_password_change() from public;
revoke all on function public.log_audit_event(text, text, uuid, jsonb) from public;

grant execute on function public.record_login() to authenticated;
grant execute on function public.complete_password_change() to authenticated;
grant execute on function public.log_audit_event(text, text, uuid, jsonb) to authenticated;

commit;
