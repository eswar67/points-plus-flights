create or replace function public.admin_get_cron_secret_meta()
returns table(has_secret boolean, updated_at timestamptz)
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'admin role required';
  end if;
  return query
    select true, c.updated_at
    from private.cron_config c
    where c.key = 'CRON_SECRET'
    union all
    select false, null::timestamptz
    where not exists (select 1 from private.cron_config where key = 'CRON_SECRET')
    limit 1;
end;
$$;

create or replace function public.admin_rotate_cron_secret(_new_value text)
returns timestamptz
language plpgsql
security definer
set search_path = public, private
as $$
declare
  _ts timestamptz := now();
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'admin role required';
  end if;
  if _new_value is null or length(_new_value) < 32 then
    raise exception 'new secret too short';
  end if;
  insert into private.cron_config (key, value, updated_at)
  values ('CRON_SECRET', _new_value, _ts)
  on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;
  return _ts;
end;
$$;

revoke all on function public.admin_get_cron_secret_meta() from public, anon;
revoke all on function public.admin_rotate_cron_secret(text) from public, anon;
grant execute on function public.admin_get_cron_secret_meta() to authenticated;
grant execute on function public.admin_rotate_cron_secret(text) to authenticated;