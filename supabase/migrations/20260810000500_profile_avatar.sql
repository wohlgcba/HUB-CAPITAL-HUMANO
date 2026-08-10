begin;

alter table public.profiles
  add column if not exists avatar_path text;

alter table public.profiles
  drop constraint if exists profiles_avatar_path_format;

alter table public.profiles
  add constraint profiles_avatar_path_format
  check (
    avatar_path is null
    or (
      avatar_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[^/]+$'
      and position('..' in avatar_path) = 0
    )
  );

create or replace function public.get_my_profile_details()
returns table (
  profile_id uuid,
  auth_user_id uuid,
  directory_person_id uuid,
  full_name text,
  area text,
  job_role text,
  phone text,
  email text,
  gcba_building text,
  cuit text,
  system_role public.app_role,
  is_active boolean,
  must_change_password boolean,
  avatar_path text,
  email_notifications_enabled boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profile.id,
    profile.auth_user_id,
    profile.directory_person_id,
    profile.full_name,
    person.area,
    person.job_role,
    person.phone,
    profile.email::text,
    person.gcba_building,
    profile.cuit,
    profile.role,
    profile.is_active,
    profile.must_change_password,
    profile.avatar_path,
    null::boolean
  from public.profiles profile
  left join public.directory_people person
    on person.id = profile.directory_person_id
  where profile.auth_user_id = auth.uid()
    and profile.is_active = true
  limit 1;
$$;

create or replace function public.update_my_profile_avatar(new_avatar_path text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_avatar_path text;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if new_avatar_path is not null and (
    not starts_with(new_avatar_path, auth.uid()::text || '/')
    or position('..' in new_avatar_path) > 0
    or new_avatar_path like '%/%/%'
  ) then
    raise exception 'INVALID_AVATAR_PATH';
  end if;

  update public.profiles
  set avatar_path = new_avatar_path,
      updated_at = now()
  where auth_user_id = auth.uid()
    and is_active = true
  returning avatar_path into updated_avatar_path;

  if not found then
    raise exception 'ACTIVE_PROFILE_NOT_FOUND';
  end if;

  return updated_avatar_path;
end;
$$;

revoke all on function public.get_my_profile_details() from public;
revoke all on function public.update_my_profile_avatar(text) from public;
grant execute on function public.get_my_profile_details() to authenticated;
grant execute on function public.update_my_profile_avatar(text) to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-avatars',
  'profile-avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "users read own profile avatar"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users upload own profile avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users update own profile avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users delete own profile avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
