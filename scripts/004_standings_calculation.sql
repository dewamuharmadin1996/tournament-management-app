-- Function to update standings for a season
create or replace function public.update_standings(p_season_id uuid)
returns void as $$
declare
  v_season record;
  v_match record;
  v_team1_points integer;
  v_team2_points integer;
begin
  -- Get season details
  select * into v_season from public.seasons where id = p_season_id;
  
  if not found then
    raise exception 'Season not found';
  end if;
  
  -- Only update standings for league format
  if v_season.format != 'league' then
    return;
  end if;
  
  -- Reset all standings for this season
  update public.standings
  set played = 0, won = 0, drawn = 0, lost = 0,
      points = 0, goals_for = 0, goals_against = 0, goal_difference = 0
  where season_id = p_season_id;
  
  -- Process each completed match
  for v_match in
    select * from public.matches
    where season_id = p_season_id
    and status = 'completed'
    and team1_score is not null
    and team2_score is not null
  loop
    -- Calculate points based on result
    if v_match.team1_score > v_match.team2_score then
      v_team1_points := v_season.points_win;
      v_team2_points := v_season.points_loss;
      
      -- Update team1 (winner)
      update public.standings
      set played = played + 1,
          won = won + 1,
          points = points + v_team1_points,
          goals_for = goals_for + v_match.team1_score,
          goals_against = goals_against + v_match.team2_score,
          goal_difference = goal_difference + (v_match.team1_score - v_match.team2_score)
      where season_id = p_season_id and team_id = v_match.team1_id;
      
      -- Update team2 (loser)
      update public.standings
      set played = played + 1,
          lost = lost + 1,
          points = points + v_team2_points,
          goals_for = goals_for + v_match.team2_score,
          goals_against = goals_against + v_match.team1_score,
          goal_difference = goal_difference + (v_match.team2_score - v_match.team1_score)
      where season_id = p_season_id and team_id = v_match.team2_id;
      
    elsif v_match.team1_score < v_match.team2_score then
      v_team1_points := v_season.points_loss;
      v_team2_points := v_season.points_win;
      
      -- Update team1 (loser)
      update public.standings
      set played = played + 1,
          lost = lost + 1,
          points = points + v_team1_points,
          goals_for = goals_for + v_match.team1_score,
          goals_against = goals_against + v_match.team2_score,
          goal_difference = goal_difference + (v_match.team1_score - v_match.team2_score)
      where season_id = p_season_id and team_id = v_match.team1_id;
      
      -- Update team2 (winner)
      update public.standings
      set played = played + 1,
          won = won + 1,
          points = points + v_team2_points,
          goals_for = goals_for + v_match.team2_score,
          goals_against = goals_against + v_match.team1_score,
          goal_difference = goal_difference + (v_match.team2_score - v_match.team1_score)
      where season_id = p_season_id and team_id = v_match.team2_id;
      
    else
      -- Draw
      v_team1_points := v_season.points_draw;
      v_team2_points := v_season.points_draw;
      
      -- Update team1
      update public.standings
      set played = played + 1,
          drawn = drawn + 1,
          points = points + v_team1_points,
          goals_for = goals_for + v_match.team1_score,
          goals_against = goals_against + v_match.team2_score,
          goal_difference = goal_difference + (v_match.team1_score - v_match.team2_score)
      where season_id = p_season_id and team_id = v_match.team1_id;
      
      -- Update team2
      update public.standings
      set played = played + 1,
          drawn = drawn + 1,
          points = points + v_team2_points,
          goals_for = goals_for + v_match.team2_score,
          goals_against = goals_against + v_match.team1_score,
          goal_difference = goal_difference + (v_match.team2_score - v_match.team1_score)
      where season_id = p_season_id and team_id = v_match.team2_id;
    end if;
  end loop;
end;
$$ language plpgsql security definer;

-- Trigger function to update standings when a match is updated
create or replace function public.handle_match_update()
returns trigger as $$
begin
  -- Only update standings if match is completed
  if new.status = 'completed' and new.team1_score is not null and new.team2_score is not null then
    perform public.update_standings(new.season_id);
  end if;
  return new;
end;
$$ language plpgsql;

-- Create trigger on matches table
drop trigger if exists update_standings_on_match on public.matches;
create trigger update_standings_on_match
  after insert or update on public.matches
  for each row
  execute function public.handle_match_update();
