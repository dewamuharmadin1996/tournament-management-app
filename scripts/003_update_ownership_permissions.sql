-- Update RLS policies to allow users to manage their own tournaments

-- Drop old tournament policies
drop policy if exists "Admins can manage tournaments" on public.tournaments;

-- Create new tournament policies based on ownership
create policy "Users can create tournaments"
  on public.tournaments for insert
  with check (auth.uid() = created_by);

create policy "Users can update their own tournaments"
  on public.tournaments for update
  using (auth.uid() = created_by);

create policy "Users can delete their own tournaments"
  on public.tournaments for delete
  using (auth.uid() = created_by);

-- Update seasons policies to check tournament ownership
drop policy if exists "Admins can manage seasons" on public.seasons;

create policy "Tournament owners can manage seasons"
  on public.seasons for all
  using (
    exists (
      select 1 from public.tournaments
      where id = seasons.tournament_id
      and created_by = auth.uid()
    )
  );

-- Update season_teams policies
drop policy if exists "Admins can manage season teams" on public.season_teams;

create policy "Tournament owners can manage season teams"
  on public.season_teams for all
  using (
    exists (
      select 1 from public.seasons s
      join public.tournaments t on t.id = s.tournament_id
      where s.id = season_teams.season_id
      and t.created_by = auth.uid()
    )
  );

-- Update matches policies
drop policy if exists "Admins can manage matches" on public.matches;

create policy "Tournament owners can manage matches"
  on public.matches for all
  using (
    exists (
      select 1 from public.seasons s
      join public.tournaments t on t.id = s.tournament_id
      where s.id = matches.season_id
      and t.created_by = auth.uid()
    )
  );

-- Update standings policies
drop policy if exists "Admins can manage standings" on public.standings;

create policy "Tournament owners can manage standings"
  on public.standings for all
  using (
    exists (
      select 1 from public.seasons s
      join public.tournaments t on t.id = s.tournament_id
      where s.id = standings.season_id
      and t.created_by = auth.uid()
    )
  );

-- Update team_members policies to allow any authenticated user
drop policy if exists "Admins can manage team members" on public.team_members;

create policy "Authenticated users can manage team members"
  on public.team_members for all
  using (auth.uid() is not null);

-- Update teams policies to allow any authenticated user to create/manage teams
drop policy if exists "Admins can insert teams" on public.teams;
drop policy if exists "Admins can update teams" on public.teams;
drop policy if exists "Admins can delete teams" on public.teams;

create policy "Authenticated users can create teams"
  on public.teams for insert
  with check (auth.uid() is not null);

create policy "Users can update their own teams"
  on public.teams for update
  using (auth.uid() = created_by);

create policy "Users can delete their own teams"
  on public.teams for delete
  using (auth.uid() = created_by);

-- Update people policies to allow any authenticated user to create/manage people
drop policy if exists "Admins can insert people" on public.people;
drop policy if exists "Admins can update people" on public.people;
drop policy if exists "Admins can delete people" on public.people;

create policy "Authenticated users can create people"
  on public.people for insert
  with check (auth.uid() is not null);

create policy "Users can update their own people"
  on public.people for update
  using (auth.uid() = created_by);

create policy "Users can delete their own people"
  on public.people for delete
  using (auth.uid() = created_by);
