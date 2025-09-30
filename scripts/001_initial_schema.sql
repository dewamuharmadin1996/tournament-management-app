-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table for user management
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  is_admin boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admin check function
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
end;
$$ language plpgsql security definer;

-- People Master table
create table if not exists public.people (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role text,
  avatar_url text,
  is_private boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.people enable row level security;

create policy "Anyone can view public people"
  on public.people for select
  using (not is_private or auth.uid() is not null);

create policy "Admins can insert people"
  on public.people for insert
  with check (is_admin());

create policy "Admins can update people"
  on public.people for update
  using (is_admin());

create policy "Admins can delete people"
  on public.people for delete
  using (is_admin());

-- Teams Master table
create table if not exists public.teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  logo_url text,
  banner_url text,
  is_private boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.teams enable row level security;

create policy "Anyone can view public teams"
  on public.teams for select
  using (not is_private or auth.uid() is not null);

create policy "Admins can insert teams"
  on public.teams for insert
  with check (is_admin());

create policy "Admins can update teams"
  on public.teams for update
  using (is_admin());

create policy "Admins can delete teams"
  on public.teams for delete
  using (is_admin());

-- Team members junction table
create table if not exists public.team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references public.teams(id) on delete cascade,
  person_id uuid references public.people(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(team_id, person_id)
);

alter table public.team_members enable row level security;

create policy "Anyone can view team members"
  on public.team_members for select
  using (true);

create policy "Admins can manage team members"
  on public.team_members for all
  using (is_admin());

-- Tournaments table
create table if not exists public.tournaments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  logo_url text,
  banner_url text,
  is_private boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.tournaments enable row level security;

create policy "Anyone can view public tournaments"
  on public.tournaments for select
  using (not is_private or auth.uid() is not null);

create policy "Admins can manage tournaments"
  on public.tournaments for all
  using (is_admin());

-- Seasons table
create table if not exists public.seasons (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  name text not null,
  format text not null check (format in ('cup', 'league', 'double_elimination')),
  points_win integer default 3,
  points_draw integer default 1,
  points_loss integer default 0,
  priority_mode text check (priority_mode in ('highest', 'lowest', null)),
  status text default 'draft' check (status in ('draft', 'active', 'completed')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.seasons enable row level security;

create policy "Anyone can view seasons of public tournaments"
  on public.seasons for select
  using (
    exists (
      select 1 from public.tournaments
      where id = seasons.tournament_id
      and (not is_private or auth.uid() is not null)
    )
  );

create policy "Admins can manage seasons"
  on public.seasons for all
  using (is_admin());

-- Season teams junction table
create table if not exists public.season_teams (
  id uuid primary key default uuid_generate_v4(),
  season_id uuid references public.seasons(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(season_id, team_id)
);

alter table public.season_teams enable row level security;

create policy "Anyone can view season teams"
  on public.season_teams for select
  using (true);

create policy "Admins can manage season teams"
  on public.season_teams for all
  using (is_admin());

-- Matches table
create table if not exists public.matches (
  id uuid primary key default uuid_generate_v4(),
  season_id uuid references public.seasons(id) on delete cascade,
  round integer,
  match_number integer,
  bracket_position text, -- for elimination brackets: 'upper', 'lower', 'final'
  team1_id uuid references public.teams(id),
  team2_id uuid references public.teams(id),
  team1_score integer,
  team2_score integer,
  winner_id uuid references public.teams(id),
  status text default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed')),
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.matches enable row level security;

create policy "Anyone can view matches"
  on public.matches for select
  using (true);

create policy "Admins can manage matches"
  on public.matches for all
  using (is_admin());

-- Standings table (for league format)
create table if not exists public.standings (
  id uuid primary key default uuid_generate_v4(),
  season_id uuid references public.seasons(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  played integer default 0,
  won integer default 0,
  drawn integer default 0,
  lost integer default 0,
  points integer default 0,
  goals_for integer default 0,
  goals_against integer default 0,
  goal_difference integer default 0,
  unique(season_id, team_id)
);

alter table public.standings enable row level security;

create policy "Anyone can view standings"
  on public.standings for select
  using (true);

create policy "Admins can manage standings"
  on public.standings for all
  using (is_admin());

-- Create trigger function for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.people
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.teams
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.tournaments
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.seasons
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.matches
  for each row execute function public.handle_updated_at();
