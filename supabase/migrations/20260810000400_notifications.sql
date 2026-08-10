begin;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null default 'system'
    check (category in ('resource', 'section', 'directory', 'system')),
  audience text not null default 'all'
    check (audience in ('all', 'admin')),
  target_path text check (target_path is null or target_path ~ '^/'),
  related_type text,
  related_id uuid,
  source_key text unique,
  is_active boolean not null default true,
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or expires_at > published_at)
);

create table public.notification_reads (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, profile_id)
);

create index notifications_feed_idx
  on public.notifications (published_at desc)
  where is_active = true;

create index notification_reads_profile_idx
  on public.notification_reads (profile_id, read_at desc);

create trigger set_notifications_updated_at
before update on public.notifications
for each row execute function public.set_updated_at();

alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;

create policy "authenticated read available notifications"
on public.notifications
for select
to authenticated
using (
  is_active = true
  and published_at <= now()
  and (expires_at is null or expires_at > now())
  and (audience = 'all' or (audience = 'admin' and public.is_admin()))
);

create policy "admins manage notifications"
on public.notifications
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "users read own notification state"
on public.notification_reads
for select
to authenticated
using (profile_id = public.current_profile_id());

create policy "users create own notification state"
on public.notification_reads
for insert
to authenticated
with check (profile_id = public.current_profile_id());

create policy "users update own notification state"
on public.notification_reads
for update
to authenticated
using (profile_id = public.current_profile_id())
with check (profile_id = public.current_profile_id());

create policy "users delete own notification state"
on public.notification_reads
for delete
to authenticated
using (profile_id = public.current_profile_id());

grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.notification_reads to authenticated;
grant all on public.notifications to service_role;
grant all on public.notification_reads to service_role;

create or replace function public.notify_published_section()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_active = true and (tg_op = 'INSERT' or old.is_active = false) then
    insert into public.notifications (
      title,
      body,
      category,
      target_path,
      related_type,
      related_id,
      source_key,
      created_by
    )
    values (
      'Nueva seccion disponible',
      new.title || ' ya esta disponible en el HUB.',
      'section',
      '/secciones/' || new.slug,
      'section',
      new.id,
      'section:' || new.id || ':published',
      public.current_profile_id()
    )
    on conflict (source_key) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.notify_published_resource()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  section_title text;
begin
  if new.is_active = true and (tg_op = 'INSERT' or old.is_active = false) then
    select title into section_title
    from public.sections
    where id = new.section_id;

    insert into public.notifications (
      title,
      body,
      category,
      target_path,
      related_type,
      related_id,
      source_key,
      published_at,
      created_by
    )
    values (
      'Nuevo recurso disponible',
      new.title || ' se publico en ' || coalesce(section_title, 'el HUB') || '.',
      'resource',
      '/recursos/' || new.id,
      'resource',
      new.id,
      'resource:' || new.id || ':published',
      coalesce(new.published_at, now()),
      public.current_profile_id()
    )
    on conflict (source_key) do nothing;
  end if;

  return new;
end;
$$;

create trigger notify_section_when_published
after insert or update of is_active on public.sections
for each row execute function public.notify_published_section();

create trigger notify_resource_when_published
after insert or update of is_active on public.section_resources
for each row execute function public.notify_published_resource();

revoke all on function public.notify_published_section() from public;
revoke all on function public.notify_published_resource() from public;

insert into public.notifications (
  title,
  body,
  category,
  target_path,
  related_type,
  related_id,
  source_key,
  published_at
)
select
  'Nuevo recurso disponible',
  resource.title || ' se publico en ' || section.title || '.',
  'resource',
  '/recursos/' || resource.id,
  'resource',
  resource.id,
  'resource:' || resource.id || ':published',
  resource.published_at
from public.section_resources resource
join public.sections section on section.id = resource.section_id
where resource.is_active = true
  and section.is_active = true
order by resource.published_at desc
limit 50
on conflict (source_key) do nothing;

insert into public.notifications (
  title,
  body,
  category,
  target_path,
  related_type,
  related_id,
  source_key,
  published_at
)
select
  'Seccion disponible',
  section.title || ' esta disponible en el HUB.',
  'section',
  '/secciones/' || section.slug,
  'section',
  section.id,
  'section:' || section.id || ':published',
  section.updated_at
from public.sections section
where section.is_active = true
on conflict (source_key) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

commit;
