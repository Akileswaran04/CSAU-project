import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Participant {
  name: string;
}

/** Available player icon names */
export const TEAM_ICONS = [
  "sword",
  "shield",
  "crown",
  "zap",
  "target",
  "rocket",
  "flame",
  "star",
] as const;

export type TeamIcon = (typeof TEAM_ICONS)[number];

export interface Team {
  id: string;
  name: string;
  participants: Participant[];
  color: string;
  icon: TeamIcon;
  position: number;
  score: number;
  riddlesAttempted: number;
  riddlesCorrect: number;
  riddlesIncorrect: number;
  consecutiveNonRiddleTurns: number;
  totalTurns: number;
  scoreHistory: number[];
}

export type GamePhase = "idle" | "active" | "paused" | "ended";
export type GameMode = "offline" | "online";

/** Input type for addTeam — only requires fields the caller provides */
export type TeamInput = Pick<Team, "name" | "participants" | "color" | "icon">;

export interface GameState {
  teams: Team[];
  gamePhase: GamePhase;
  currentTeamIndex: number;
  activeTeamId: string | null;
  diceResult: number | null;
  isRolling: boolean;
  isRiddleOpen: boolean;
  winner: Team | null;
  resultsSaved: boolean;
  gameMode: GameMode;

  // Actions
  addTeam: (team: TeamInput) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  removeTeam: (id: string) => void;
  setGamePhase: (phase: GamePhase) => void;
  setCurrentTeamIndex: (index: number) => void;
  setActiveTeamId: (id: string | null) => void;
  setDiceResult: (result: number | null) => void;
  setIsRolling: (rolling: boolean) => void;
  setIsRiddleOpen: (open: boolean) => void;
  setWinner: (team: Team | null) => void;
  setResultsSaved: (saved: boolean) => void;
  setGameMode: (mode: GameMode) => void;
  advanceTurn: () => void;
  resetGame: () => void;
  moveTeam: (teamId: string, newPosition: number) => void;
  addScore: (teamId: string, points: number) => void;
  recordRiddleAttempt: (teamId: string, isCorrect: boolean) => void;
  incrementNonRiddleTurns: (teamId: string) => void;
  resetNonRiddleTurns: (teamId: string) => void;
}

const TEAM_COLORS = [
  "#FF7A45",
  "#C6F135",
  "#FFB830",
  "#E11D3C",
  "#A0AEC0",
  "#CD7F32",
  "#06B6D4",
  "#14B8A6",
];

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      teams: [],
      gamePhase: "idle",
      currentTeamIndex: 0,
      activeTeamId: null,
      diceResult: null,
      isRolling: false,
      isRiddleOpen: false,
      winner: null,
      resultsSaved: false,
      gameMode: "offline",

      addTeam: (team) => {
        const state = get();
        const colorIndex = state.teams.length % TEAM_COLORS.length;
        const iconIndex = state.teams.length % TEAM_ICONS.length;
        const newTeam: Team = {
          id: crypto.randomUUID(),
          name: team.name,
          participants: team.participants,
          color: team.color || TEAM_COLORS[colorIndex],
          icon: team.icon || TEAM_ICONS[iconIndex],
          position: 0,
          score: 0,
          riddlesAttempted: 0,
          riddlesCorrect: 0,
          riddlesIncorrect: 0,
          consecutiveNonRiddleTurns: 0,
          totalTurns: 0,
          scoreHistory: [0],
        };
        set({ teams: [...state.teams, newTeam] });
      },

      updateTeam: (id, updates) => {
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      removeTeam: (id) => {
        set((state) => ({
          teams: state.teams.filter((t) => t.id !== id),
        }));
      },

      setGamePhase: (phase) => set({ gamePhase: phase }),
      setCurrentTeamIndex: (index) => set({ currentTeamIndex: index }),
      setActiveTeamId: (id) => set({ activeTeamId: id }),
      setDiceResult: (result) => set({ diceResult: result }),
      setIsRolling: (rolling) => set({ isRolling: rolling }),
      setIsRiddleOpen: (open) => set({ isRiddleOpen: open }),
      setWinner: (team) => set({ winner: team }),
      setResultsSaved: (saved) => set({ resultsSaved: saved }),
      setGameMode: (mode) => set({ gameMode: mode }),

      advanceTurn: () => {
        set((state) => {
          const nextIndex = (state.currentTeamIndex + 1) % state.teams.length;
          const nextTeam = state.teams[nextIndex];
          return {
            currentTeamIndex: nextIndex,
            activeTeamId: nextTeam?.id || null,
            diceResult: null,
            isRolling: false,
          };
        });
      },

      resetGame: () =>
        set({
          teams: [],
          gamePhase: "idle",
          currentTeamIndex: 0,
          activeTeamId: null,
          diceResult: null,
          isRolling: false,
          isRiddleOpen: false,
          winner: null,
          resultsSaved: false,
          gameMode: "offline",
        }),

      moveTeam: (teamId, newPosition) => {
        set((state) => ({
          teams: state.teams.map((t) => {
            if (t.id === teamId) {
              const clampedPos = Math.max(0, Math.min(31, newPosition));
              return {
                ...t,
                position: clampedPos,
                totalTurns: t.totalTurns + 1,
              };
            }
            return t;
          }),
        }));

        const state = get();
        const team = state.teams.find((t) => t.id === teamId);
        if (team && team.position >= 31 && !state.winner) {
          set({ winner: team });
        }
      },

      addScore: (teamId, points) => {
        set((state) => ({
          teams: state.teams.map((t) => {
            if (t.id === teamId) {
              const newScore = Math.max(0, t.score + points);
              return {
                ...t,
                score: newScore,
                scoreHistory: [...t.scoreHistory, newScore],
              };
            }
            return t;
          }),
        }));
      },

      recordRiddleAttempt: (teamId, isCorrect) => {
        set((state) => ({
          teams: state.teams.map((t) => {
            if (t.id === teamId) {
              return {
                ...t,
                riddlesAttempted: t.riddlesAttempted + 1,
                riddlesCorrect: t.riddlesCorrect + (isCorrect ? 1 : 0),
                riddlesIncorrect: t.riddlesIncorrect + (isCorrect ? 0 : 1),
                consecutiveNonRiddleTurns: 0,
              };
            }
            return t;
          }),
        }));
      },

      incrementNonRiddleTurns: (teamId) => {
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId
              ? { ...t, consecutiveNonRiddleTurns: t.consecutiveNonRiddleTurns + 1 }
              : t
          ),
        }));
      },

      resetNonRiddleTurns: (teamId) => {
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId ? { ...t, consecutiveNonRiddleTurns: 0 } : t
          ),
        }));
      },
    }),
    {
      name: "riddle-rush-game",
      partialize: (state) => ({
        teams: state.teams,
        gamePhase: state.gamePhase,
        currentTeamIndex: state.currentTeamIndex,
        activeTeamId: state.activeTeamId,
        winner: state.winner,
        resultsSaved: state.resultsSaved,
        gameMode: state.gameMode,
      }),
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown> | null | undefined;
        return {
          ...current,
          ...p,
          // Keep persisted gameMode if valid, otherwise fall back to default
          gameMode: (p?.gameMode as GameMode) ?? current.gameMode,
        };
      },
    }
  )
);
