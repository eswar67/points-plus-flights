create or replace function public.user_has_plus(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = uid
      and (
        (status in ('active', 'trialing') and (current_period_end is null or current_period_end > now()))
        or (status = 'canceled' and current_period_end > now())
      )
  );
$$;

revoke all on function public.user_has_plus(uuid) from public, anon;
grant execute on function public.user_has_plus(uuid) to authenticated, service_role;

create or replace function public.active_watchlist_count(uid uuid, exclude_id uuid default null)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.watchlists
  where user_id = uid
    and active
    and (exclude_id is null or id <> exclude_id);
$$;

revoke all on function public.active_watchlist_count(uuid, uuid) from public, anon;
grant execute on function public.active_watchlist_count(uuid, uuid) to authenticated, service_role;

create policy "Free tier watchlist insert limit"
  on public.watchlists
  as restrictive
  for insert
  to authenticated
  with check (
    (not active)
    or public.user_has_plus(auth.uid())
    or public.active_watchlist_count(auth.uid()) < 1
  );

create policy "Free tier watchlist activation limit"
  on public.watchlists
  as restrictive
  for update
  to authenticated
  with check (
    (not active)
    or public.user_has_plus(auth.uid())
    or public.active_watchlist_count(auth.uid(), id) < 1
  );

create policy "Users view own requests"
  on public.booking_requests
  for select
  to authenticated
  using (user_id = auth.uid());
