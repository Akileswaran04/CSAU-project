import { useState, useCallback, useEffect, useRef } from "react";
import {
  spectateRoom,
  disconnectSpectator,
  onStateChange,
  onPresenceChange,
} from "../lib/supabaseMultiplayer";
import { useGameStore } from "../store/useGameStore";
import { applySyncableState, type SyncableState } from "../hooks/useRealtimeRoom";
import type { PresenceState } from "../lib/supabaseMultiplayer";

interface SpectatorState {
  roomId: string | null;
  players: PresenceState[];
  isConnected: boolean;
  error: string | null;
}

/**
 * useSpectatorConnection — Spectates an online game room via Supabase Realtime.
 *
 * Uses the `spectateRoom` function which joins the room's Realtime Channel
 * in read-only mode (invisible spectator, no presence tracking).
 * Receives live game state broadcasts and player presence updates.
 */
export function useSpectatorConnection() {
  const [state, setState] = useState<SpectatorState>({
    roomId: null,
    players: [],
    isConnected: false,
    error: null,
  });
  const roomIdRef = useRef<string | null>(null);

  // Subscribe to game state broadcasts
  useEffect(() => {
    const unsub = onStateChange((gameState: any) => {
      if (!gameState || !roomIdRef.current) return;
      if (gameState.teams) useGameStore.setState({ teams: gameState.teams });
      if (gameState.gamePhase) useGameStore.setState({ gamePhase: gameState.gamePhase });
      if (gameState.winner !== undefined) useGameStore.setState({ winner: gameState.winner });
      if (gameState.diceResult !== undefined) useGameStore.setState({ diceResult: gameState.diceResult });
      if (gameState.isRolling !== undefined) useGameStore.setState({ isRolling: gameState.isRolling });
      if (gameState.currentTeamIndex !== undefined) useGameStore.setState({ currentTeamIndex: gameState.currentTeamIndex });
      if (gameState.activeTeamId !== undefined) useGameStore.setState({ activeTeamId: gameState.activeTeamId });
      if (gameState.isRiddleOpen !== undefined) useGameStore.setState({ isRiddleOpen: gameState.isRiddleOpen });
    });

    const unsubPlayers = onPresenceChange((players) => {
      setState((prev) => ({ ...prev, players }));
    });

    return () => {
      unsub();
      unsubPlayers();
    };
  }, []);

  // Cleanup spectator channel on unmount
  useEffect(() => {
    return () => {
      disconnectSpectator();
    };
  }, []);

  const handleSpectate = useCallback(async (roomCode: string) => {
    try {
      setState((prev) => ({ ...prev, error: null }));
      const result = await spectateRoom(roomCode.toUpperCase());

      if (result.ok) {
        roomIdRef.current = roomCode.toUpperCase();
        setState({
          roomId: roomCode.toUpperCase(),
          players: [],
          isConnected: true,
          error: null,
        });

        // If there's existing game state, apply the full SyncableState
        if (result.gameState) {
          applySyncableState(result.gameState as SyncableState);
        }
      } else {
        setState((prev) => ({ ...prev, error: result.error || "Room not found" }));
      }
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err?.message || "Failed to spectate" }));
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    roomIdRef.current = null;
    disconnectSpectator();
    useGameStore.setState({
      teams: [],
      gamePhase: "idle",
      winner: null,
      diceResult: null,
      isRolling: false,
      currentTeamIndex: 0,
      activeTeamId: null,
    });
    setState({
      roomId: null,
      players: [],
      isConnected: false,
      error: null,
    });
  }, []);

  return {
    roomId: state.roomId,
    players: state.players,
    isConnected: state.isConnected,
    error: state.error,
    spectateRoom: handleSpectate,
    disconnect: handleDisconnect,
  };
}
