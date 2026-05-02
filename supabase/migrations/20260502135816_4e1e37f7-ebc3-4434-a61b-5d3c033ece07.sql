-- Profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  telegram_chat_id text,
  programs_held text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users view own profile" on public.profiles
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Watchlists
create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  origin text not null,
  destination text not null,
  date_from date not null,
  date_to date not null,
  cabin text not null check (cabin in ('economy','premium','business','first')),
  pax int not null default 1 check (pax between 1 and 9),
  max_miles int,
  min_cpp_aud numeric(4,2) default 2.5,
  channel text not null default 'telegram' check (channel in ('telegram','email','app')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(origin) between 3 and 7),
  check (length(destination) between 3 and 7),
  check (date_to >= date_from)
);

alter table public.watchlists enable row level security;

create policy "Users view own watchlists" on public.watchlists
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own watchlists" on public.watchlists
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own watchlists" on public.watchlists
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own watchlists" on public.watchlists
  for delete to authenticated using (auth.uid() = user_id);

create index watchlists_active_idx on public.watchlists(active, created_at desc);
create trigger watchlists_updated_at
  before update on public.watchlists
  for each row execute function public.set_updated_at();

-- Alert dedupe
create table public.alerts_sent (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  fingerprint text not null,
  cpp_aud numeric(4,2),
  miles int,
  sent_at timestamptz not null default now(),
  unique (watchlist_id, fingerprint)
);

alter table public.alerts_sent enable row level security;

create policy "Users view own alerts" on public.alerts_sent
  for select to authenticated
  using (exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = auth.uid()));

create index alerts_sent_recent_idx on public.alerts_sent(sent_at desc);

-- Lock down the new helper
revoke execute on function public.handle_new_user() from public, anon, authenticated;