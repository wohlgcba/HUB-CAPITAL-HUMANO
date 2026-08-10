begin;

create or replace function public.protect_current_admin_profile()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null
     or old.auth_user_id is distinct from auth.uid()
     or old.role is distinct from 'admin'::public.app_role then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE'
     or new.is_active = false
     or new.role is distinct from 'admin'::public.app_role then
    raise exception 'CURRENT_ADMIN_PROTECTED' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_current_admin_profile() from public;

commit;
