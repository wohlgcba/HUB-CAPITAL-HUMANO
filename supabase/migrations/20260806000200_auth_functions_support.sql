grant usage on schema public to anon, authenticated, service_role;

grant select on public.directory_people to authenticated;
grant select on public.link_types to authenticated;
grant select on public.directory_person_link_types to authenticated;
grant select on public.sections to authenticated;
grant select on public.section_resources to authenticated;
grant select on public.resource_files to authenticated;
grant insert on public.audit_events to authenticated;

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
