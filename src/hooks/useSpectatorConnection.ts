import { useEffect, useCallback, useRef, useState } from "react";

import { useGameStore } from "../store/useGameStore";
import { useLogStore } from "../store/useLogStore";
import {
  connect,
  disconnect,
  spectateRoom,
  onGameState,
  onPlayersChange,
  type PlayerInfo,
} from "../lib/socketClient";

interface SpectatorState {
  roomId: string | null;
  players: PlayerInfo[];
  isConnected: boolean;
  error: string | null;
}

const AUTO_DISCONNECT_DELAY = 8000; // ms — show results before disconnecting

/**
 * useSpectatorConnection — connects to a game room in read-only spectator mode.
 * Receives `game:state` updates and syncs them to the local Zustand store.
 * Also receives `room:players` updates to show who's playing.
 * Auto-disconnects after a delay when the game ends.
 */
export function useSpectatorConnection() {
  const [state, setState] = useState<SpectatorState>({
    roomId: null,
    players: [],
    isConnected: false,
    error: null,
  });
  const mountedRef = useRef(true);
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      disconnect();
    };
  }, []);

  // Auto-disconnect when game ends
  useEffect(() => {
    const unsub = useGameStore.subscribe((storeState) => {
      if (
        storeState.gamePhase === "ended" &&
        state.isConnected &&
        !disconnectTimerRef.current
      ) {
        // Store the current room ID so we can still show results
        disconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            // Just close the socket — keep the UI state so results still show
            disconnect();
            disconnectTimerRef.current = null;
          }
        }, AUTO_DISCONNECT_DELAY);
      }
    });
    return unsub;
  }, [state.isConnected]);

  // Wire up listeners for game state + players
  useEffect(() => {
    const unsubState = onGameState((serverState) => {
      if (!serverState) return;
      // Full state replacement — server teams have authoritative IDs from host's store
      if (serverState.teams) {
        useGameStore.setState({ teams: serverState.teams });
      }
      if (serverState.gamePhase) {
        useGameStore.setState({ gamePhase: serverState.gamePhase });
      }
      if (serverState.winner !== undefined) {
        useGameStore.setState({ winner: serverState.winner });
      }
      if (serverState.diceResult !== undefined) {
        useGameStore.setState({ diceResult: serverState.diceResult });
      }
      if (serverState.isRolling !== undefined) {
        useGameStore.setState({ isRolling: serverState.isRolling });
      }
      if (serverState.currentTeamIndex !== undefined) {
        useGameStore.setState({ currentTeamIndex: serverState.currentTeamIndex });
      }
    });

    const unsubPlayers = onPlayersChange((players) => {
      setState((prev) => ({ ...prev, players }));
    });

    return () => {
      unsubState();
      unsubPlayers();
    };
  }, []);

  const handleSpectate = useCallback(async (roomCode: string) => {
    try {
      connect();
      const result = await spectateRoom(roomCode.toUpperCase());

      if (!mountedRef.current) return;

      if (result.ok && result.roomId) {
        setState({
          roomId: result.roomId,
          players: result.players || [],
          isConnected: true,
          error: null,
        });
        return true;
      } else {
        setState((prev) => ({ ...prev, error: result.error || "Room not found" }));
        return false;
      }
    } catch {
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, error: "Connection failed" }));
      }
      return false;
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    // Reset the local store state
    const store = useGameStore.getState();
    store.resetGame();
    useLogStore.getState().clearLog();

    setState({
      roomId: null,
      players: [],
      isConnected: false,
      error: null,
    });
    disconnect();
  }, []);

  return {
    ...state,
    spectate: handleSpectate,
    disconnect: handleDisconnect,
  };
}
