-- Fix the trigger function to run with elevated privileges
-- This allows it to properly update standings when matches are completed

create or replace function public.handle_match_update()
returns trigger as $$
begin
  -- Only update standings if match is completed
  if new.status = 'completed' and new.team1_score is not null and new.team2_score is not null then
    perform public.update_standings(new.season_id);
  end if;
  return new;
end;
$$ language plpgsql security definer; -- Added security definer to allow trigger to update standings

-- Recreate the trigger to ensure it uses the updated function
drop trigger if exists update_standings_on_match on public.matches;
create trigger update_standings_on_match
  after insert or update on public.matches
  for each row
  execute function public.handle_match_update();
