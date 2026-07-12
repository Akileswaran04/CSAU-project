import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "volcanic";

export interface SettingsState {
  backgroundIntensity: number; // 0 = off, 100 = full
  theme: ThemeMode;
  musicVolume: number; // 0-100
  sfxVolume: number; // 0-100
  setBackgroundIntensity: (intensity: number) => void;
  setTheme: (theme: ThemeMode) => void;
  setMusicVolume: (vol: number) => void;
  setSfxVolume: (vol: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      backgroundIntensity: 100,
      theme: "dark" as ThemeMode,
      musicVolume: 60,
      sfxVolume: 80,
      setBackgroundIntensity: (intensity) =>
        set({ backgroundIntensity: Math.max(0, Math.min(100, intensity)) }),
      setTheme: (theme) => set({ theme }),
      setMusicVolume: (vol) =>
        set({ musicVolume: Math.max(0, Math.min(100, vol)) }),
      setSfxVolume: (vol) =>
        set({ sfxVolume: Math.max(0, Math.min(100, vol)) }),
    }),
    {
      name: "riddle-rush-settings",
      partialize: (state) => ({
        backgroundIntensity: state.backgroundIntensity,
        theme: state.theme,
        musicVolume: state.musicVolume,
        sfxVolume: state.sfxVolume,
      }),
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown> | null | undefined;
        return {
          ...current,
          ...p,
          // Migrate legacy "light" theme → "volcanic"
          theme: p?.theme === "light" ? "volcanic" : (p?.theme as ThemeMode) ?? current.theme,
        };
      },
    }
  )
);
