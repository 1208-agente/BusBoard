create table if not exists public.trips (
  id text primary key,
  day text not null check (day in ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  company text not null,
  departure_time time not null,
  arrival_time time not null,
  origin text not null,
  destination text not null,
  route text not null,
  status text not null default 'on_time' check (status in ('on_time','boarding','arriving','delayed','cancelled')),
  delay integer not null default 0,
  start_date date,
  end_date date,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.stations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  station text,
  title text not null,
  text text,
  type text not null check (type in ('image','youtube','tiktok','link')),
  image_url text,
  youtube_url text,
  target_url text,
  start_date date,
  end_date date,
  active boolean not null default true,
  display_order integer not null default 100,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

drop trigger if exists ads_set_updated_at on public.ads;
create trigger ads_set_updated_at
before update on public.ads
for each row execute function public.set_updated_at();

drop trigger if exists stations_set_updated_at on public.stations;
create trigger stations_set_updated_at
before update on public.stations
for each row execute function public.set_updated_at();

alter table public.trips enable row level security;
alter table public.ads enable row level security;
alter table public.stations enable row level security;

drop policy if exists "Public can read active trips" on public.trips;
create policy "Public can read active trips"
on public.trips for select
using (active = true);

drop policy if exists "Authenticated admins can manage trips" on public.trips;
create policy "Authenticated admins can manage trips"
on public.trips for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read active ads" on public.ads;
create policy "Public can read active ads"
on public.ads for select
using (
  active = true
  and (start_date is null or start_date <= current_date)
  and (end_date is null or end_date >= current_date)
);

drop policy if exists "Authenticated admins can manage ads" on public.ads;
create policy "Authenticated admins can manage ads"
on public.ads for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read active stations" on public.stations;
create policy "Public can read active stations"
on public.stations for select
using (active = true);

drop policy if exists "Authenticated admins can manage stations" on public.stations;
create policy "Authenticated admins can manage stations"
on public.stations for all
to authenticated
using (true)
with check (true);

insert into public.stations
  (name, active)
values
  ('Marcala', true),
  ('La Paz', true),
  ('Tegucigalpa', true),
  ('Comayagua', true)
on conflict (name) do nothing;

insert into public.trips
  (id, day, company, departure_time, arrival_time, origin, destination, route, status, delay)
values
  ('monday-trip-demo-1', 'monday', 'Transportes Marcala', '07:00', '07:50', 'Marcala', 'La Paz', 'ML-01', 'on_time', 0),
  ('monday-trip-demo-2', 'monday', 'Rapidos Centro', '08:30', '09:20', 'La Paz', 'Marcala', 'LM-02', 'on_time', 0),
  ('tuesday-trip-demo-1', 'tuesday', 'Transportes Marcala', '07:00', '07:50', 'Marcala', 'La Paz', 'ML-01', 'on_time', 0)
on conflict (id) do nothing;

insert into public.ads
  (station, title, text, type, youtube_url, target_url, display_order)
values
  ('Marcala', 'Video Marcala', 'Publicidad local', 'youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com', 10),
  (null, 'Anunciate aqui', 'Publicidad para todas las estaciones', 'link', null, 'https://example.com', 100)
on conflict do nothing;
