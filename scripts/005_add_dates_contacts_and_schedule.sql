-- Seasons: date range
alter table if exists public.seasons
  add column if not exists start_date date,
  add column if not exists end_date date;

-- Matches: scheduled datetime
alter table if exists public.matches
  add column if not exists scheduled_at timestamptz;

-- People: email and whatsapp
alter table if exists public.people
  add column if not exists email text,
  add column if not exists whatsapp text;

-- Optional: simple not-null checks can be added later as needed; keeping nullable for flexibility.
