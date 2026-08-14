update public.link_types
set is_active = false
where lower(name) in ('innovación', 'innovacion', 'bienestar')
   or lower(name) like 'innovaci%n';
