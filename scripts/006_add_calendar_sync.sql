alter table if exists public.matches
  add column if not exists calendar_event_id text,
  add column if not exists calendar_provider text;

comment on column public.matches.calendar_event_id is 'External calendar event ID for syncing';
comment on column public.matches.calendar_provider is 'Calendar provider key, e.g., google';
