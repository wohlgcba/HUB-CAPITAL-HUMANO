create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.app_role as enum ('user', 'admin');
create type public.resource_file_kind as enum ('pdf', 'word', 'powerpoint', 'spreadsheet', 'image', 'other');

create table public.directory_people (
  id uuid primary key default gen_random_uuid(),
  cuit text unique not null,
  area text not null,
  full_name text not null,
  phone text,
  email citext unique not null,
  job_role text,
  gcba_building text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint directory_people_cuit_format check (cuit ~ '^[0-9]{2}-?[0-9]{8}-?[0-9]$')
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  directory_person_id uuid unique references public.directory_people(id) on delete set null,
  cuit text unique not null,
  email citext unique not null,
  full_name text not null,
  role public.app_role not null default 'user',
  must_change_password boolean not null default true,
  is_active boolean not null default true,
  first_login_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_cuit_format check (cuit ~ '^[0-9]{2}-?[0-9]{8}-?[0-9]$')
);

create table public.link_types (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  color text not null default '#8DE2D6',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.directory_person_link_types (
  person_id uuid not null references public.directory_people(id) on delete cascade,
  link_type_id uuid not null references public.link_types(id) on delete restrict,
  primary key (person_id, link_type_id)
);

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category text not null,
  description text not null,
  banner_path text,
  cover_image_path text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sections_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.section_resources (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  title text not null,
  description text,
  cover_image_path text,
  thumbnail_strategy text not null default 'auto_from_first_file',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.resource_files (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.section_resources(id) on delete cascade,
  storage_bucket text not null default 'resource-files',
  storage_path text not null,
  file_name text not null,
  file_kind public.resource_file_kind not null default 'other',
  mime_type text,
  file_size_bytes bigint,
  thumbnail_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index directory_people_area_idx on public.directory_people (area);
create index directory_people_email_idx on public.directory_people (email);
create index directory_people_active_idx on public.directory_people (is_active);
create index profiles_auth_user_id_idx on public.profiles (auth_user_id);
create index profiles_role_idx on public.profiles (role);
create index sections_active_sort_idx on public.sections (is_active, sort_order);
create index section_resources_section_sort_idx on public.section_resources (section_id, is_active, sort_order);
create index resource_files_resource_sort_idx on public.resource_files (resource_id, sort_order);
create index audit_events_profile_created_idx on public.audit_events (profile_id, created_at desc);
create index audit_events_type_created_idx on public.audit_events (event_type, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_directory_people_updated_at
before update on public.directory_people
for each row execute function public.set_updated_at();

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_sections_updated_at
before update on public.sections
for each row execute function public.set_updated_at();

create trigger set_section_resources_updated_at
before update on public.section_resources
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where auth_user_id = auth.uid()
    and is_active = true
  limit 1;
$$;

alter table public.directory_people enable row level security;
alter table public.profiles enable row level security;
alter table public.link_types enable row level security;
alter table public.directory_person_link_types enable row level security;
alter table public.sections enable row level security;
alter table public.section_resources enable row level security;
alter table public.resource_files enable row level security;
alter table public.audit_events enable row level security;

create policy "authenticated read active directory"
on public.directory_people
for select
to authenticated
using (is_active = true);

create policy "admins manage directory"
on public.directory_people
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "users read own profile"
on public.profiles
for select
to authenticated
using (auth_user_id = auth.uid());

create policy "admins manage profiles"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated read active link types"
on public.link_types
for select
to authenticated
using (is_active = true);

create policy "admins manage link types"
on public.link_types
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

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
  )
);

create policy "admins manage directory link types"
on public.directory_person_link_types
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated read active sections"
on public.sections
for select
to authenticated
using (is_active = true);

create policy "admins manage sections"
on public.sections
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated read active resources"
on public.section_resources
for select
to authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.sections section
    where section.id = section_resources.section_id
      and section.is_active = true
  )
);

create policy "admins manage resources"
on public.section_resources
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated read resource files"
on public.resource_files
for select
to authenticated
using (
  exists (
    select 1
    from public.section_resources resource
    join public.sections section on section.id = resource.section_id
    where resource.id = resource_files.resource_id
      and resource.is_active = true
      and section.is_active = true
  )
);

create policy "admins manage resource files"
on public.resource_files
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "users insert own audit events"
on public.audit_events
for insert
to authenticated
with check (profile_id = public.current_profile_id());

create policy "admins read audit events"
on public.audit_events
for select
to authenticated
using (public.is_admin());

create policy "admins manage audit events"
on public.audit_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.link_types (name, color, sort_order)
values
  ('Capital Humano', '#8DE2D6', 10),
  ('Comunicación Interna', '#FFCC00', 20),
  ('Discapacidad', '#CDB7F6', 30),
  ('Innovación', '#BEE6B4', 40),
  ('Bienestar', '#9DD1F1', 50)
on conflict (name) do update
set color = excluded.color,
    sort_order = excluded.sort_order;

insert into public.sections (title, slug, category, description, sort_order)
values
  ('Ejes de Trabajo', 'ejes-de-trabajo', 'Programas', 'Conocé los principales ejes de trabajo de la Red y las líneas de acción prioritarias.', 10),
  ('Encuentros 2026', 'encuentros-2026', 'Encuentros', 'Cronograma, presentaciones y materiales de los encuentros de la Red 2026.', 20),
  ('Reconocimiento', 'reconocimiento', 'Programas', 'Información y recursos sobre el Plan de Reconocimiento y las acciones destacadas.', 30),
  ('Gob Lab', 'gob-lab', 'Programas', 'Iniciativas colaborativas para innovar en la gestión pública y generar valor.', 40),
  ('Salud Mental', 'salud-mental', 'Recursos', 'Recursos y herramientas para acompañar el bienestar de los equipos de trabajo.', 50),
  ('Guías Operativas', 'guias-operativas', 'Recursos', 'Guías, instructivos y buenas prácticas para la gestión del talento.', 60),
  ('Mentoreo', 'mentoreo', 'Programas', 'Programa de mentoreo y desarrollo profesional dentro de la Red.', 70),
  ('Encuentros 2025', 'encuentros-2025', 'Encuentros', 'Accedé a los materiales y presentaciones de encuentros anteriores.', 80)
on conflict (slug) do update
set title = excluded.title,
    category = excluded.category,
    description = excluded.description,
    sort_order = excluded.sort_order,
    updated_at = now();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'section-banners',
    'section-banners',
    false,
    10485760,
    array['image/png', 'image/jpeg', 'image/webp']
  ),
  (
    'resource-covers',
    'resource-covers',
    false,
    10485760,
    array['image/png', 'image/jpeg', 'image/webp']
  ),
  (
    'resource-files',
    'resource-files',
    false,
    52428800,
    array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg',
      'image/webp'
    ]
  )
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "authenticated read hub storage"
on storage.objects
for select
to authenticated
using (bucket_id in ('section-banners', 'resource-covers', 'resource-files'));

create policy "admins upload hub storage"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('section-banners', 'resource-covers', 'resource-files')
  and public.is_admin()
);

create policy "admins update hub storage"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('section-banners', 'resource-covers', 'resource-files')
  and public.is_admin()
)
with check (
  bucket_id in ('section-banners', 'resource-covers', 'resource-files')
  and public.is_admin()
);

create policy "admins delete hub storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('section-banners', 'resource-covers', 'resource-files')
  and public.is_admin()
);
