-- Roles infra (admin/agent escalation-safe)
create type public.app_role as enum ('admin', 'agent');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view own roles" on public.user_roles
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Booking requests
create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  contact_email text not null,
  contact_name text not null,
  passenger_count int not null default 1 check (passenger_count between 1 and 9),
  route_from text not null,
  route_to text not null,
  travel_date date not null,
  cabin text not null check (cabin in ('economy','premium','business','first')),
  program text not null,
  carrier text,
  miles_required int,
  notes text,
  status text not null default 'new' check (status in ('new','in_progress','ticketed','cancelled')),
  agent_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.booking_requests enable row level security;

-- Anyone (including anon) can submit
create policy "Anyone can submit a booking request" on public.booking_requests
  for insert to anon, authenticated
  with check (
    length(contact_email) between 5 and 255
    and length(contact_name) between 1 and 120
    and length(route_from) between 3 and 7
    and length(route_to) between 3 and 7
  );

-- Only agents/admins can read or modify
create policy "Agents view requests" on public.booking_requests
  for select to authenticated
  using (public.has_role(auth.uid(), 'agent') or public.has_role(auth.uid(), 'admin'));

create policy "Agents update requests" on public.booking_requests
  for update to authenticated
  using (public.has_role(auth.uid(), 'agent') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'agent') or public.has_role(auth.uid(), 'admin'));

create policy "Admins delete requests" on public.booking_requests
  for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create index booking_requests_status_idx on public.booking_requests(status, created_at desc);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger booking_requests_updated_at
  before update on public.booking_requests
  for each row execute function public.set_updated_at();