import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase =
  isSupabaseConfigured
    ? createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: { persistSession: false },
      })
    : null;

export type MatchRecord = {
  id: string;
  created_at: string;
  winner_team_id: string;
  winner_name: string;
  winner_score: number;
  total_teams: number;
};

export type MatchTeamRecord = {
  id: string;
  match_id: string;
  team_name: string;
  team_color: string;
  score: number;
  position: number;
  riddles_correct: number;
  riddles_attempted: number;
  rank: number;
};
