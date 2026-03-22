-- SUPABASE SCHEMA SETUP
-- Run this completely in the Supabase Dashboard SQL Editor

-- 1. Create Incidents Table
CREATE TABLE IF NOT EXISTS public.incidents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  type text NOT NULL,
  area double precision,
  location_name text,
  severity_score integer DEFAULT 0,
  buses_per_day integer DEFAULT 0,
  detected_at timestamp with time zone DEFAULT now(),
  repaired_at timestamp with time zone,
  status text DEFAULT 'active',
  fix_deadline_days integer,
  verified_by text
);

-- 2. Create Wards Table
CREATE TABLE IF NOT EXISTS public.wards (
  id text PRIMARY KEY,
  ward_name text NOT NULL,
  damage_percentage integer DEFAULT 0,
  total_roads integer DEFAULT 0,
  damaged_roads integer DEFAULT 0,
  repaired_this_month integer DEFAULT 0
);

-- 3. Create Fleet Table
CREATE TABLE IF NOT EXISTS public.fleet (
  bus_id text PRIMARY KEY,
  status text DEFAULT 'online',
  last_sync_time text
);

-- 4. Enable Row Level Security (RLS) but allow public read/write for development
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all actions for public" ON public.incidents FOR ALL USING (true);
CREATE POLICY "Enable all actions for public" ON public.wards FOR ALL USING (true);
CREATE POLICY "Enable all actions for public" ON public.fleet FOR ALL USING (true);

-- 5. Turn on REALTIME for the Incidents table so the map updates live
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.incidents;
