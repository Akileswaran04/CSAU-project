import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light";

export interface SettingsState {
  backgroundIntensity: number; // 0 = off, 100 = full
  theme: ThemeMode;
  setBackgroundIntensity: (intensity: number) => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      backgroundIntensity: 100,
      theme: "dark" as ThemeMode,
      setBackgroundIntensity: (intensity) =>
        set({ backgroundIntensity: Math.max(0, Math.min(100, intensity)) }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "riddle-rush-settings",
      partialize: (state) => ({
        backgroundIntensity: state.backgroundIntensity,
        theme: state.theme,
      }),
    }
  )
);
