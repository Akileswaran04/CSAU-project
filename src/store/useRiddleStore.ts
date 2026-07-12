import { create } from "zustand";
import { persist } from "zustand/middleware";
import riddlesData from "../data/riddles.json";
import type { Difficulty } from "../lib/scoring";

export type RiddleCategory = "tech" | "non-tech";

export interface Riddle {
  id: string;
  difficulty: Difficulty;
  category: RiddleCategory;
  question: string;
  options: string[];
  correctIndex: number;
  answer: string;
}

export interface RiddleState {
  riddles: Riddle[];
  usedRiddleIds: string[];
  currentRiddle: Riddle | null;
  currentDifficulty: Difficulty | null;
  isForcedRiddle: boolean;
  forcedTeamId: string | null;

  // Actions
  drawRiddle: (difficulty: Difficulty, category?: RiddleCategory) => Riddle | null;
  setCurrentRiddle: (riddle: Riddle | null) => void;
  setCurrentDifficulty: (difficulty: Difficulty | null) => void;
  setIsForcedRiddle: (forced: boolean) => void;
  setForcedTeamId: (id: string | null) => void;
  resetUsedRiddles: () => void;
  closeRiddle: () => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const useRiddleStore = create<RiddleState>()(
  persist(
    (set, get) => ({
      riddles: riddlesData as Riddle[],
      usedRiddleIds: [],
      currentRiddle: null,
      currentDifficulty: null,
      isForcedRiddle: false,
      forcedTeamId: null,

      drawRiddle: (difficulty, category) => {
        const state = get();

        // If no category specified, pick randomly 50/50
        const effectiveCategory = category ?? (Math.random() < 0.5 ? "tech" : "non-tech");

        const available = state.riddles.filter(
          (r) =>
            r.difficulty === difficulty &&
            r.category === effectiveCategory &&
            !state.usedRiddleIds.includes(r.id)
        );

        // If no available riddles for this difficulty+category, fall back to any difficulty+category
        let pool = available.length > 0
          ? available
          : state.riddles.filter((r) => r.difficulty === difficulty && r.category === effectiveCategory);

        if (pool.length === 0) {
          // Extreme fallback: any unused riddle of this difficulty
          pool = state.riddles.filter((r) => r.difficulty === difficulty);
        }

        if (pool.length === 0) return null;

        const shuffled = shuffleArray(pool);
        const riddle = { ...shuffled[0] }; // shallow clone so we can mutate

        // Shuffle options at runtime so the correct answer isn't always option A
        const correctAnswer = riddle.options[riddle.correctIndex];
        riddle.options = shuffleArray(riddle.options);
        riddle.correctIndex = riddle.options.indexOf(correctAnswer);

        set({
          usedRiddleIds: [...state.usedRiddleIds, riddle.id],
          currentRiddle: riddle,
          currentDifficulty: difficulty,
        });

        return riddle;
      },

      setCurrentRiddle: (riddle) => set({ currentRiddle: riddle }),
      setCurrentDifficulty: (difficulty) => set({ currentDifficulty: difficulty }),
      setIsForcedRiddle: (forced) => set({ isForcedRiddle: forced }),
      setForcedTeamId: (id) => set({ forcedTeamId: id }),

      resetUsedRiddles: () => set({ usedRiddleIds: [] }),

      closeRiddle: () =>
        set({
          currentRiddle: null,
          currentDifficulty: null,
          isForcedRiddle: false,
          forcedTeamId: null,
        }),
    }),
    {
      name: "riddle-rush-riddles",
      partialize: (state) => ({
        usedRiddleIds: state.usedRiddleIds,
      }),
    }
  )
);
