import { create } from "zustand";
import type { PresenceState } from "../lib/supabaseMultiplayer";

export interface RoomState {
  roomCode: string | null;
  players: PresenceState[];
  isHost: boolean;
  isConnected: boolean;
  error: string | null;
  isGameActive: boolean; // true when game state has been broadcast (auto-navigation flag)
  connectionDropped: boolean; // true when Realtime channel has been disconnected for 3+ seconds

  setRoomCode: (code: string | null) => void;
  setPlayers: (players: PresenceState[]) => void;
  setIsHost: (host: boolean) => void;
  setIsConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setGameActive: (active: boolean) => void;
  setConnectionDropped: (dropped: boolean) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomCode: null,
  players: [],
  isHost: false,
  isConnected: false,
  error: null,
  isGameActive: false,
  connectionDropped: false,

  setRoomCode: (code) => set({ roomCode: code }),
  setPlayers: (players) => set({ players }),
  setIsHost: (host) => set({ isHost: host }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setError: (error) => set({ error }),
  setGameActive: (active) => set({ isGameActive: active }),
  setConnectionDropped: (dropped) => set({ connectionDropped: dropped }),
  reset: () =>
    set({
      roomCode: null,
      players: [],
      isHost: false,
      isConnected: false,
      error: null,
      isGameActive: false,
      connectionDropped: false,
    }),
}));
