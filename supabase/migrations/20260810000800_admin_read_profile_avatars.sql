begin;

create policy "admins read profile avatars"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and public.is_admin()
);

commit;
