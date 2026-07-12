import { create } from "zustand";
import {
  fetchRecentMatches,
  fetchAllTimeStandings,
  type LocalMatch,
  type GameMode,
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
  historyMode: GameMode;

  loadHistory: (mode?: GameMode) => Promise<void>;
  setHistoryMode: (mode: GameMode) => void;
}

export const useLeaderboardHistoryStore = create<LeaderboardHistoryState>()(
  (set) => ({
    recentMatches: [],
    allTimeStandings: [],
    isLoading: false,
    error: null,
    historyMode: "offline",

    loadHistory: async (mode?: GameMode) => {
      set({ isLoading: true, error: null });
      try {
        const actualMode = mode || useLeaderboardHistoryStore.getState().historyMode;
        const [recentMatches, allTimeStandings] = await Promise.all([
          fetchRecentMatches(20, actualMode),
          Promise.resolve(fetchAllTimeStandings(actualMode)),
        ]);
        set({ recentMatches, allTimeStandings, isLoading: false });
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : "Failed to load history",
          isLoading: false,
        });
      }
    },

    setHistoryMode: (mode: GameMode) => {
      set({ historyMode: mode });
      // Reload data with new mode
      useLeaderboardHistoryStore.getState().loadHistory(mode);
    },
  })
);
