
create schema if not exists private;

create table if not exists private.cron_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table private.cron_config enable row level security;
revoke all on private.cron_config from anon, authenticated;
-- No policies => only service_role (which bypasses RLS) can read/write.
