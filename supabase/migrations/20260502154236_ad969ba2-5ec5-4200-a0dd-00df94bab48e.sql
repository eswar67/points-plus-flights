
create table public.user_program_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id text not null,
  program_name text not null,
  balance integer not null default 0 check (balance >= 0 and balance <= 50000000),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, program_id)
);

create index idx_user_program_balances_user on public.user_program_balances(user_id);

alter table public.user_program_balances enable row level security;

create policy "Users view own balances"
  on public.user_program_balances for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own balances"
  on public.user_program_balances for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own balances"
  on public.user_program_balances for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own balances"
  on public.user_program_balances for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger trg_user_program_balances_updated_at
  before update on public.user_program_balances
  for each row execute function public.set_updated_at();
