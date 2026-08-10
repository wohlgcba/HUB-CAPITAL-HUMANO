begin;

alter table public.directory_people
  add column if not exists admin_only boolean not null default false;

drop policy if exists "authenticated read active directory" on public.directory_people;
create policy "authenticated read active directory"
on public.directory_people
for select
to authenticated
using (
  is_active = true
  and (admin_only = false or public.is_admin())
);

drop policy if exists "authenticated read directory link types" on public.directory_person_link_types;
create policy "authenticated read directory link types"
on public.directory_person_link_types
for select
to authenticated
using (
  exists (
    select 1
    from public.directory_people person
    where person.id = directory_person_link_types.person_id
      and person.is_active = true
      and (person.admin_only = false or public.is_admin())
  )
);

grant select (avatar_path) on public.profiles to authenticated;

do $$
declare
  admin_profile public.profiles%rowtype;
  admin_person_id uuid;
begin
  select * into admin_profile
  from public.profiles
  where lower(email::text) = 'admin@gmail.com'
    and role = 'admin'
  limit 1;

  if admin_profile.id is null then
    return;
  end if;

  if admin_profile.directory_person_id is null then
    insert into public.directory_people (
      cuit,
      area,
      full_name,
      phone,
      email,
      job_role,
      gcba_building,
      is_active,
      admin_only
    )
    values (
      null,
      'ADMINISTRACIÓN DEL HUB',
      admin_profile.full_name,
      null,
      admin_profile.email,
      'Administrador del HUB',
      null,
      true,
      true
    )
    returning id into admin_person_id;

    update public.profiles
    set directory_person_id = admin_person_id,
        updated_at = now()
    where id = admin_profile.id;
  else
    update public.directory_people
    set admin_only = true,
        is_active = true,
        updated_at = now()
    where id = admin_profile.directory_person_id;
  end if;
end;
$$;

commit;
