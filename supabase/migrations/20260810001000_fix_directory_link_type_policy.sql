begin;

create or replace function public.can_read_directory_person(target_person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.directory_people person
    where person.id = target_person_id
      and person.is_active = true
      and (person.admin_only = false or public.is_admin())
  );
$$;

revoke all on function public.can_read_directory_person(uuid) from public;
grant execute on function public.can_read_directory_person(uuid) to authenticated;

drop policy if exists "authenticated read directory link types" on public.directory_person_link_types;
create policy "authenticated read directory link types"
on public.directory_person_link_types
for select
to authenticated
using (public.can_read_directory_person(person_id));

commit;
