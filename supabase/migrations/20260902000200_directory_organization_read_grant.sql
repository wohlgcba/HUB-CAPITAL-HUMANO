begin;

grant select (organization_unit_id)
on public.directory_people
to authenticated;

commit;
