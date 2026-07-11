import { isSupabaseConfigured, supabase, type MatchRecord, type MatchTeamRecord } from "./supabaseClient";
import type { Team } from "../store/useGameStore";

/* ─── LocalStorage fallback types ─── */

export interface LocalMatch {
  id: string;
  createdAt: string;
  winnerTeamId: string;
  winnerName: string;
  winnerScore: number;
  totalTeams: number;
  teams: LocalMatchTeam[];
}

export interface LocalMatchTeam {
  teamName: string;
  teamColor: string;
  score: number;
  position: number;
  riddlesCorrect: number;
  riddlesAttempted: number;
  rank: number;
}

const STORAGE_KEY = "riddle-rush-match-history";
const MAX_LOCAL_MATCHES = 200;

/* ─── Helpers ─── */

function generateId(): string {
  return crypto.randomUUID();
}

function serializeTeam(team: Team, rank: number): LocalMatchTeam {
  return {
    teamName: team.name,
    teamColor: team.color,
    score: team.score,
    position: team.position,
    riddlesCorrect: team.riddlesCorrect,
    riddlesAttempted: team.riddlesAttempted,
    rank,
  };
}

/* ─── LocalStorage helpers ─── */

function readLocalMatches(): LocalMatch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalMatch[];
  } catch {
    return [];
  }
}

function writeLocalMatches(matches: LocalMatch[]): void {
  try {
    const trimmed = matches.slice(0, MAX_LOCAL_MATCHES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage may be full or unavailable
  }
}

/* ─── Public API ─── */

export async function saveMatchResult(teams: Team[]): Promise<void> {
  if (teams.length === 0) return;

  const sorted = [...teams].sort((a, b) => {
    if (b.position !== a.position) return b.position - a.position;
    return b.score - a.score;
  });

  const winner = sorted[0];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .insert({
          winner_team_id: winner.id,
          winner_name: winner.name,
          winner_score: winner.score,
          total_teams: teams.length,
        })
        .select("id")
        .single();

      if (matchError) throw matchError;

      const teamRows = sorted.map((t, i) => ({
        match_id: matchData.id,
        team_name: t.name,
        team_color: t.color,
        score: t.score,
        position: t.position,
        riddles_correct: t.riddlesCorrect,
        riddles_attempted: t.riddlesAttempted,
        rank: i + 1,
      }));

      const { error: teamsError } = await supabase
        .from("match_teams")
        .insert(teamRows);

      if (teamsError) throw teamsError;

      return;
    } catch {
      // Fall through to localStorage fallback
    }
  }

  // Fallback: save to localStorage
  const localMatch: LocalMatch = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    winnerTeamId: winner.id,
    winnerName: winner.name,
    winnerScore: winner.score,
    totalTeams: teams.length,
    teams: sorted.map((t, i) => serializeTeam(t, i + 1)),
  };

  const existing = readLocalMatches();
  existing.unshift(localMatch);
  writeLocalMatches(existing);
}

export async function fetchRecentMatches(limit = 20): Promise<LocalMatch[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const matches = data as MatchRecord[];

      const matchIds = matches.map((m) => m.id);
      const { data: teamData, error: teamsError } = await supabase
        .from("match_teams")
        .select("*")
        .in("match_id", matchIds);

      if (teamsError) throw teamsError;

      const teamMap = new Map<string, LocalMatchTeam[]>();
      (teamData as MatchTeamRecord[]).forEach((t) => {
        const list = teamMap.get(t.match_id) || [];
        list.push({
          teamName: t.team_name,
          teamColor: t.team_color,
          score: t.score,
          position: t.position,
          riddlesCorrect: t.riddles_correct,
          riddlesAttempted: t.riddles_attempted,
          rank: t.rank,
        });
        teamMap.set(t.match_id, list);
      });

      return matches.map((m) => ({
        id: m.id,
        createdAt: m.created_at,
        winnerTeamId: m.winner_team_id,
        winnerName: m.winner_name,
        winnerScore: m.winner_score,
        totalTeams: m.total_teams,
        teams: teamMap.get(m.id) || [],
      }));
    } catch {
      // Fall through to localStorage
    }
  }

  // Fallback: read from localStorage
  return readLocalMatches().slice(0, limit);
}

export function fetchAllTimeStandings(): {
  teamName: string;
  wins: number;
  totalScore: number;
  totalRiddlesCorrect: number;
  totalRiddlesAttempted: number;
  gamesPlayed: number;
}[] {
  const matches = readLocalMatches();

  const standings = new Map<
    string,
    {
      wins: number;
      totalScore: number;
      totalRiddlesCorrect: number;
      totalRiddlesAttempted: number;
      gamesPlayed: number;
    }
  >();

  for (const match of matches) {
    for (const team of match.teams) {
      const existing = standings.get(team.teamName) || {
        wins: 0,
        totalScore: 0,
        totalRiddlesCorrect: 0,
        totalRiddlesAttempted: 0,
        gamesPlayed: 0,
      };

      existing.wins += team.rank === 1 ? 1 : 0;
      existing.totalScore += team.score;
      existing.totalRiddlesCorrect += team.riddlesCorrect;
      existing.totalRiddlesAttempted += team.riddlesAttempted;
      existing.gamesPlayed += 1;

      standings.set(team.teamName, existing);
    }
  }

  return [...standings.entries()]
    .map(([teamName, stats]) => ({
      teamName,
      ...stats,
    }))
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.teamName.localeCompare(b.teamName);
    });
}
