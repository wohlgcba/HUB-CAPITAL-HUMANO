begin;

drop index if exists public.directory_people_email_unique_idx;

create unique index if not exists directory_people_email_ci_unique_idx
  on public.directory_people (lower(email))
  where email is not null;

commit;
