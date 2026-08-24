begin;

insert into public.sections (
  title,
  slug,
  category,
  description,
  sort_order,
  is_active
)
values (
  'Novedades',
  'novedades',
  'Novedades',
  'Compartí recursos y actualizaciones con la Red de Capital Humano.',
  90,
  true
)
on conflict (slug) do nothing;

commit;
