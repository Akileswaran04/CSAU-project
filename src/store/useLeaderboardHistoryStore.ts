import { create } from "zustand";
import {
  fetchRecentMatches,
  fetchAllTimeStandings,
  type LocalMatch,
} from "../lib/leaderboardHistoryService";

export interface AllTimeEntry {
  teamName: string;
  wins: number;
  totalScore: number;
  totalRiddlesCorrect: number;
  totalRiddlesAttempted: number;
  gamesPlayed: number;
}

interface LeaderboardHistoryState {
  recentMatches: LocalMatch[];
  allTimeStandings: AllTimeEntry[];
  isLoading: boolean;
  error: string | null;

  loadHistory: () => Promise<void>;
}

export const useLeaderboardHistoryStore = create<LeaderboardHistoryState>()(
  (set) => ({
    recentMatches: [],
    allTimeStandings: [],
    isLoading: false,
    error: null,

    loadHistory: async () => {
      set({ isLoading: true, error: null });
      try {
        const [recentMatches, allTimeStandings] = await Promise.all([
          fetchRecentMatches(20),
          Promise.resolve(fetchAllTimeStandings()),
        ]);
        set({ recentMatches, allTimeStandings, isLoading: false });
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : "Failed to load history",
          isLoading: false,
        });
      }
    },
  })
);
