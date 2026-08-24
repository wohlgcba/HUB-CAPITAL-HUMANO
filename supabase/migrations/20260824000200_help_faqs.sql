begin;

create table if not exists public.help_faqs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null,
  icon_name text not null default 'help',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  admin_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint help_faqs_title_not_blank check (btrim(title) <> ''),
  constraint help_faqs_content_not_blank check (btrim(content) <> ''),
  constraint help_faqs_category_not_blank check (btrim(category) <> ''),
  constraint help_faqs_sort_order_non_negative check (sort_order >= 0),
  constraint help_faqs_icon_name_allowed check (
    icon_name in (
      'help',
      'lock',
      'fileDescription',
      'download',
      'usersGroup',
      'search',
      'bell',
      'upload',
      'clipboard',
      'bulb',
      'mail',
      'calendar',
      'settings'
    )
  )
);

create index if not exists help_faqs_visibility_sort_idx
  on public.help_faqs (is_active, admin_only, sort_order, created_at);

drop trigger if exists set_help_faqs_updated_at on public.help_faqs;
create trigger set_help_faqs_updated_at
before update on public.help_faqs
for each row execute function public.set_updated_at();

alter table public.help_faqs enable row level security;

drop policy if exists "authenticated read help faqs" on public.help_faqs;
create policy "authenticated read help faqs"
on public.help_faqs
for select
to authenticated
using (
  public.is_admin()
  or (is_active = true and admin_only = false)
);

drop policy if exists "admins insert help faqs" on public.help_faqs;
create policy "admins insert help faqs"
on public.help_faqs
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admins update help faqs" on public.help_faqs;
create policy "admins update help faqs"
on public.help_faqs
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update on public.help_faqs to authenticated;
grant all on public.help_faqs to service_role;

insert into public.help_faqs (
  id,
  title,
  content,
  category,
  icon_name,
  sort_order,
  is_active,
  admin_only
)
values
  (
    'bb2e0000-0000-4000-8000-000000000001',
    'No puedo ingresar a mi cuenta',
    'Verificá que estés usando el correo registrado. Si no recordás la contraseña, utilizá la opción de recuperación disponible en la pantalla de ingreso.',
    'Acceso',
    'lock',
    10,
    true,
    false
  ),
  (
    'bb2e0000-0000-4000-8000-000000000002',
    '¿Cómo consulto un recurso?',
    'Ingresá a una sección del HUB, elegí el recurso y abrí el archivo disponible. Los PDF y las imágenes pueden visualizarse dentro de la aplicación.',
    'Recursos',
    'fileDescription',
    20,
    true,
    false
  ),
  (
    'bb2e0000-0000-4000-8000-000000000003',
    'No aparece la opción de descarga',
    'La descarga depende de la configuración definida para cada archivo. Cuando no está habilitada, el recurso puede consultarse únicamente desde el visor.',
    'Recursos',
    'download',
    30,
    true,
    false
  ),
  (
    'bb2e0000-0000-4000-8000-000000000004',
    'Necesito actualizar mis datos del Directorio',
    'Solicitá la actualización a la coordinación de la Red por los canales institucionales habituales. Los cambios deben ser validados por un administrador.',
    'Directorio',
    'usersGroup',
    40,
    true,
    false
  ),
  (
    'bb2e0000-0000-4000-8000-000000000005',
    '¿Cómo encuentro una persona?',
    'En Directorio podés buscar por nombre, área, rol, correo o edificio y combinar la búsqueda con los filtros disponibles.',
    'Directorio',
    'search',
    50,
    true,
    false
  ),
  (
    'bb2e0000-0000-4000-8000-000000000006',
    '¿Qué aparece en Novedades?',
    'Novedades informa la publicación de secciones y recursos. Cada actualización puede marcarse como leída y, cuando corresponde, abrir directamente su contenido.',
    'Novedades',
    'bell',
    60,
    true,
    false
  ),
  (
    'bb2e0000-0000-4000-8000-000000000007',
    '¿Cómo publico contenido?',
    'Desde el HUB administrativo podés crear secciones y añadir recursos. Una publicación activa genera automáticamente una novedad para los integrantes.',
    'Administración',
    'upload',
    70,
    true,
    true
  )
on conflict (id) do nothing;

commit;
