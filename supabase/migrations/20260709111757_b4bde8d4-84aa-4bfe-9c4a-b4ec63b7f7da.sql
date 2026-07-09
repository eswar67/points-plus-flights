-- Remove the admin caller check from these SECURITY DEFINER functions since
-- they will no longer be callable by authenticated users; enforcement now
-- lives in the server function (which verifies has_role before invoking
-- these via the service role).
CREATE OR REPLACE FUNCTION public.admin_rotate_cron_secret(_new_value text)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
declare
  _ts timestamptz := now();
begin
  if _new_value is null or length(_new_value) < 32 then
    raise exception 'new secret too short';
  end if;
  insert into private.cron_config (key, value, updated_at)
  values ('CRON_SECRET', _new_value, _ts)
  on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;
  return _ts;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_cron_secret_meta()
 RETURNS TABLE(has_secret boolean, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
begin
  return query
    select true, c.updated_at
    from private.cron_config c
    where c.key = 'CRON_SECRET'
    union all
    select false, null::timestamptz
    where not exists (select 1 from private.cron_config where key = 'CRON_SECRET')
    limit 1;
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_rotate_cron_secret(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_cron_secret_meta() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_rotate_cron_secret(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_cron_secret_meta() TO service_role;
