import { create } from "zustand";

export interface LogEntry {
  id: string;
  timestamp: number;
  teamId: string | null;
  teamName: string;
  message: string;
  type: "roll" | "riddle" | "movement" | "forced" | "system" | "score";
}

export interface LogState {
  entries: LogEntry[];

  addEntry: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
  clearLog: () => void;
}

export const useLogStore = create<LogState>()((set) => ({
  entries: [],

  addEntry: (entry) => {
    const newEntry: LogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    set((state) => ({
      entries: [newEntry, ...state.entries],
    }));
  },

  clearLog: () => set({ entries: [] }),
}));
