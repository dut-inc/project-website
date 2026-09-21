-- Apply this once to an existing Supabase project where the view was already created.
-- New installs also get this option from supabase/schema.sql.
alter view public.game_leaderboard_view
  set (security_invoker = true);
