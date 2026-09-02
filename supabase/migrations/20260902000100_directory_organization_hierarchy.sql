begin;

create table public.organization_units (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  parent_id uuid references public.organization_units(id) on delete restrict,
  depth smallint not null,
  path_key text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_units_depth_valid check (depth between 1 and 3),
  constraint organization_units_root_depth_valid check (
    (parent_id is null and depth = 1)
    or (parent_id is not null and depth > 1)
  )
);

create index organization_units_parent_idx
  on public.organization_units (parent_id, name);

create trigger set_organization_units_updated_at
before update on public.organization_units
for each row execute function public.set_updated_at();

alter table public.organization_units enable row level security;

create policy "authenticated read organization units"
on public.organization_units
for select
to authenticated
using (is_active = true or public.is_admin());

create policy "admins manage organization units"
on public.organization_units
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.organization_units to authenticated;
grant all on public.organization_units to service_role;

alter table public.directory_people
  add column organization_unit_id uuid references public.organization_units(id) on delete set null;

create index directory_people_organization_unit_idx
  on public.directory_people (organization_unit_id)
  where organization_unit_id is not null;

create or replace function public.clear_stale_directory_organization_unit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.area is distinct from old.area
    and new.organization_unit_id is not distinct from old.organization_unit_id then
    new.organization_unit_id := null;
  end if;
  return new;
end;
$$;

create trigger clear_stale_directory_organization_unit
before update of area on public.directory_people
for each row execute function public.clear_stale_directory_organization_unit();

revoke all on function public.clear_stale_directory_organization_unit() from public;

commit;
