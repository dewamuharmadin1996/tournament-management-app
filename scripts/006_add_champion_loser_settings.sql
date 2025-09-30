-- Add champion/loser display settings to tournaments table
alter table public.tournaments
  add column if not exists show_champion boolean default true,
  add column if not exists show_loser boolean default false,
  add column if not exists champion_label text default 'Champion',
  add column if not exists loser_label text default 'Last Place';

-- Add champion/loser display settings to seasons table
alter table public.seasons
  add column if not exists show_champion boolean default true,
  add column if not exists show_loser boolean default false,
  add column if not exists champion_label text default 'Champion',
  add column if not exists loser_label text default 'Last Place';
