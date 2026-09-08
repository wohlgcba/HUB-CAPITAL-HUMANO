begin;

alter table public.section_resources
  add column if not exists content_json jsonb;

comment on column public.section_resources.content_json is
  'Structured rich text content produced by the resource editor. Legacy resources continue using description.';

commit;
