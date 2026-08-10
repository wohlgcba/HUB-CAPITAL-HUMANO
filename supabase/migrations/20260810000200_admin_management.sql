begin;

create unique index if not exists directory_people_email_unique_idx
  on public.directory_people (email)
  where email is not null;

create or replace function public.admin_directory_person_access(target_person_id uuid)
returns table (
  cuit text,
  profile_id uuid,
  auth_user_id uuid,
  system_role public.app_role,
  account_is_active boolean,
  must_change_password boolean,
  first_login_at timestamptz,
  last_login_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  return query
  select
    person.cuit,
    profile.id,
    profile.auth_user_id,
    coalesce(profile.role, 'user'::public.app_role),
    coalesce(profile.is_active, person.is_active),
    coalesce(profile.must_change_password, false),
    profile.first_login_at,
    profile.last_login_at
  from public.directory_people person
  left join public.profiles profile on profile.directory_person_id = person.id
  where person.id = target_person_id;
end;
$$;

create or replace function public.protect_current_admin_profile()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null or old.auth_user_id is distinct from auth.uid() then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE'
     or new.is_active = false
     or new.role is distinct from 'admin'::public.app_role then
    raise exception 'CURRENT_ADMIN_PROTECTED' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_current_admin_profile on public.profiles;
create trigger protect_current_admin_profile
before update or delete on public.profiles
for each row execute function public.protect_current_admin_profile();

create or replace function public.protect_current_admin_directory_person()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if exists (
    select 1
    from public.profiles profile
    where profile.directory_person_id = old.id
      and profile.auth_user_id = auth.uid()
      and profile.role = 'admin'
  ) and (
    tg_op = 'DELETE'
    or new.is_active = false
  ) then
    raise exception 'CURRENT_ADMIN_PROTECTED' using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_current_admin_directory_person on public.directory_people;
create trigger protect_current_admin_directory_person
before update or delete on public.directory_people
for each row execute function public.protect_current_admin_directory_person();

revoke all on function public.admin_directory_person_access(uuid) from public;
revoke all on function public.protect_current_admin_profile() from public;
revoke all on function public.protect_current_admin_directory_person() from public;

grant execute on function public.admin_directory_person_access(uuid) to authenticated;

commit;
