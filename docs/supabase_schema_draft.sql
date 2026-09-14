-- Draft only. Do not apply until the project switches from demo auth to Supabase.

create table admin_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  name text not null,
  department text not null,
  role text not null check (role in ('operator', 'admin')),
  created_at timestamptz not null default now()
);

create table operation_settings (
  id uuid primary key default gen_random_uuid(),
  dispatch_interval_minutes integer not null default 10,
  max_wait_minutes integer not null default 15,
  updated_by uuid references admin_profiles(id),
  updated_at timestamptz not null default now()
);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  plate_no text not null unique,
  driver_name text,
  capacity integer not null default 8,
  status text not null default '대기'
);

create table routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_name text not null,
  end_name text not null,
  active boolean not null default true,
  estimated_minutes integer not null
);

create table reservations (
  id uuid primary key default gen_random_uuid(),
  passenger_name text not null,
  phone text,
  departure text not null,
  destination text not null,
  passengers integer not null default 1,
  status text not null,
  requested_at timestamptz not null default now(),
  vehicle_id uuid references vehicles(id)
);
