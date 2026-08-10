begin;

update public.directory_people as person
set admin_only = false,
    is_active = true,
    updated_at = now()
from public.profiles as profile
where profile.directory_person_id = person.id
  and profile.role = 'admin'
  and lower(profile.email::text) = 'admin@gmail.com';

commit;
