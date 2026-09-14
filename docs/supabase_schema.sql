-- Duruon production-ready MVP schema for Supabase Free.
-- Apply in Supabase SQL Editor. Auth users live in auth.users.

create extension if not exists pgcrypto;

create type public.admin_role as enum ('operator', 'admin');
create type public.reservation_status as enum ('requested', 'confirmed', 'boarding', 'completed', 'cancelled');
create type public.payment_status as enum ('pending', 'simulated_paid', 'paid', 'refunded');

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  department text not null default '영주 관광 DRT',
  role public.admin_role not null default 'operator',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.stations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  active boolean not null default true
);

create table public.routes (
  id uuid primary key default gen_random_uuid(),
  start_station_id uuid not null references public.stations(id),
  end_station_id uuid not null references public.stations(id),
  estimated_minutes integer not null check (estimated_minutes > 0),
  active boolean not null default true,
  unique (start_station_id, end_station_id)
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate_no text not null unique,
  capacity integer not null check (capacity > 0),
  status text not null default '대기',
  created_at timestamptz not null default now()
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id),
  route_id uuid references public.routes(id),
  departure text not null,
  destination text not null,
  passengers integer not null default 1 check (passengers between 1 and 8),
  scheduled_at timestamptz not null,
  arrival_at timestamptz not null,
  status public.reservation_status not null default 'requested',
  fare integer not null check (fare >= 0),
  payment_method text not null default 'onsite',
  payment_status public.payment_status not null default 'pending',
  vehicle_id uuid references public.vehicles(id),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key),
  check (arrival_at >= scheduled_at)
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  provider text not null check (provider in ('naver_pay', 'kakao_pay')),
  display_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table public.ride_events (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  event_type text not null check (event_type in ('confirmed', 'boarding', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index reservations_status_scheduled_idx on public.reservations(status, scheduled_at);
create index reservations_user_idx on public.reservations(user_id, created_at desc);
create unique index reservations_active_vehicle_slot_idx
  on public.reservations(vehicle_id, scheduled_at)
  where vehicle_id is not null and status in ('requested', 'confirmed', 'boarding');

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_profiles_updated_at before update on public.user_profiles
for each row execute function public.set_updated_at();
create trigger reservations_updated_at before update on public.reservations
for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.reservations enable row level security;
alter table public.payment_methods enable row level security;
alter table public.ride_events enable row level security;

create policy user_profiles_self on public.user_profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy reservations_self_read on public.reservations
  for select using (user_id = auth.uid());
create policy reservations_self_insert on public.reservations
  for insert with check (user_id = auth.uid());
create policy reservations_self_update on public.reservations
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy payment_methods_self on public.payment_methods
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy admin_profiles_self on public.admin_profiles
  for select using (id = auth.uid());

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_profiles where id = auth.uid() and active); $$;

create policy admin_reservations_read on public.reservations
  for select using (public.is_admin());
create policy admin_reservations_update on public.reservations
  for update using (public.is_admin()) with check (public.is_admin());

create or replace function public.create_reservation(
  p_route_id uuid,
  p_departure text,
  p_destination text,
  p_passengers integer,
  p_scheduled_at timestamptz,
  p_duration_minutes integer,
  p_fare integer,
  p_payment_method text,
  p_payment_status public.payment_status,
  p_idempotency_key text
) returns public.reservations
language plpgsql security invoker set search_path = public
as $$
declare result public.reservations;
begin
  if p_passengers < 1 or p_passengers > 8 then raise exception 'invalid passenger count'; end if;
  insert into public.reservations (
    user_id, route_id, departure, destination, passengers, scheduled_at, arrival_at,
    fare, payment_method, payment_status, idempotency_key
  ) values (
    auth.uid(), p_route_id, p_departure, p_destination, p_passengers, p_scheduled_at,
    p_scheduled_at + make_interval(mins => p_duration_minutes), p_fare,
    p_payment_method, p_payment_status, p_idempotency_key
  )
  on conflict (user_id, idempotency_key) do update set updated_at = now()
  returning * into result;
  return result;
end;
$$;
