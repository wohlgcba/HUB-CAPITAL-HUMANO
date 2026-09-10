begin;

do $$
declare
  duplicate_unit record;
begin
  -- Collapse equivalent units after their parent level has been normalized.
  for unit_depth in 1..3 loop
    for duplicate_unit in
      with ranked_units as (
        select
          id,
          depth,
          parent_id,
          first_value(id) over (
            partition by
              depth,
              parent_id,
              lower(translate(regexp_replace(trim(name), '\\s+', ' ', 'g'), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'))
            order by created_at, id
          ) as canonical_id
        from public.organization_units
        where depth = unit_depth
      )
      select id, canonical_id
      from ranked_units
      where id <> canonical_id
    loop
      update public.directory_people
      set organization_unit_id = duplicate_unit.canonical_id
      where organization_unit_id = duplicate_unit.id;

      update public.organization_units
      set parent_id = duplicate_unit.canonical_id
      where parent_id = duplicate_unit.id;

      delete from public.organization_units
      where id = duplicate_unit.id;
    end loop;
  end loop;

  update public.organization_units
  set path_key = lower(translate(regexp_replace(trim(name), '\\s+', ' ', 'g'), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'))
  where depth = 1;

  update public.organization_units as child
  set path_key = parent.path_key || ' > ' || lower(translate(regexp_replace(trim(child.name), '\\s+', ' ', 'g'), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'))
  from public.organization_units as parent
  where child.depth = 2
    and child.parent_id = parent.id;

  update public.organization_units as child
  set path_key = parent.path_key || ' > ' || lower(translate(regexp_replace(trim(child.name), '\\s+', ' ', 'g'), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'))
  from public.organization_units as parent
  where child.depth = 3
    and child.parent_id = parent.id;
end;
$$;

commit;
