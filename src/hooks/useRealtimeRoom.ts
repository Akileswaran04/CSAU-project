import { useEffect, useCallback } from "react";
import { useGameStore, type Team, type GamePhase } from "../store/useGameStore";
import { useRiddleStore, type Riddle, type Difficulty } from "../store/useRiddleStore";
import { useRoomStore } from "../store/useRoomStore";
import {
  createRoom,
  joinRoom,
  reconnectToRoom,
  leaveRoom,
  deleteRoom,
  persistGameState,
  broadcastGameState,
  broadcastGameEvent,
  onStateChange,
  onPresenceChange,
  onConnectionChange,
} from "../lib/supabaseMultiplayer";

/* ─── Fields to sync between host and players ─── */
export interface SyncableState {
  teams: Team[];
  gamePhase: GamePhase;
  currentTeamIndex: number;
  activeTeamId: string | null;
  diceResult: number | null;
  isRolling: boolean;
  isRiddleOpen: boolean;
  winner: Team | null;
  resultsSaved: boolean;
  usedRiddleIds: string[];
  // Riddle modal state (needed for non-host to see the riddle)
  currentRiddle: Riddle | null;
  currentDifficulty: Difficulty | null;
  isForcedRiddle: boolean;
  forcedTeamId: string | null;
}

function extractSyncableState(): SyncableState {
  const game = useGameStore.getState();
  const riddle = useRiddleStore.getState();
  return {
    teams: game.teams,
    gamePhase: game.gamePhase,
    currentTeamIndex: game.currentTeamIndex,
    activeTeamId: game.activeTeamId,
    diceResult: game.diceResult,
    isRolling: game.isRolling,
    isRiddleOpen: game.isRiddleOpen,
    winner: game.winner,
    resultsSaved: game.resultsSaved,
    usedRiddleIds: riddle.usedRiddleIds,
    currentRiddle: riddle.currentRiddle,
    currentDifficulty: riddle.currentDifficulty,
    isForcedRiddle: riddle.isForcedRiddle,
    forcedTeamId: riddle.forcedTeamId,
  };
}

export function applySyncableState(state: SyncableState): void {
  useGameStore.setState({
    teams: state.teams,
    gamePhase: state.gamePhase,
    currentTeamIndex: state.currentTeamIndex,
    activeTeamId: state.activeTeamId,
    diceResult: state.diceResult,
    isRolling: state.isRolling,
    isRiddleOpen: state.isRiddleOpen,
    winner: state.winner,
    resultsSaved: state.resultsSaved,
  });
  useRiddleStore.setState({
    usedRiddleIds: state.usedRiddleIds,
    currentRiddle: state.currentRiddle,
    currentDifficulty: state.currentDifficulty,
    isForcedRiddle: state.isForcedRiddle,
    forcedTeamId: state.forcedTeamId,
  });
}

/* ─── Saved room (localStorage for reconnection) ─── */

const STORAGE_KEY = "ruflo_room";

interface SavedRoom {
  code: string;
  playerName: string;
  isHost: boolean;
}

export function getSavedRoom(): SavedRoom | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.code && parsed.playerName) {
      return parsed as SavedRoom;
    }
    return null;
  } catch {
    return null;
  }
}

function saveRoom(data: SavedRoom): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* silent */ }
}

function clearSavedRoom(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* silent */ }
}

/* ─── Module-level singleton state ─── */
let isInitialized = false;
let isHostRefGlobal = false;
let syncingRefGlobal = false;
let broadcastTimer: ReturnType<typeof setTimeout> | null = null;

function clearBroadcastTimer(): void {
  if (broadcastTimer !== null) {
    clearTimeout(broadcastTimer);
    broadcastTimer = null;
  }
}

/* ─── Hook ─── */
export function useRealtimeRoom() {
  const roomStore = useRoomStore();

  /* ─── Initialize once ─── */
  useEffect(() => {
    const wasInitialized = isInitialized;
    if (!wasInitialized) {
      isInitialized = true;
    }

    const unsubState = onStateChange((serverState: SyncableState | any) => {
      if (!isHostRefGlobal && serverState) {
        syncingRefGlobal = true;

        if (serverState.gamePhase === "active" || serverState.gamePhase === "ended") {
          useRoomStore.getState().setGameActive(true);
        }

        setTimeout(() => {
          applySyncableState(serverState);
          syncingRefGlobal = false;
        }, 0);
      }
    });

    const unsubPresence = onPresenceChange((players) => {
      useRoomStore.getState().setPlayers(players);
    });

    return () => {
      unsubState();
      unsubPresence();
      clearBroadcastTimer();
      if (!wasInitialized) {
        isInitialized = false;
      }
    };
  }, []);

  /* ─── Broadcast game state changes (host only, debounced) ─── */
  useEffect(() => {
    const unsubGame = useGameStore.subscribe(() => {
      if (isHostRefGlobal && !syncingRefGlobal) {
        clearBroadcastTimer();
        broadcastTimer = setTimeout(() => {
          const syncable = extractSyncableState();
          broadcastGameState(syncable);

          const code = useRoomStore.getState().roomCode;
          if (code) persistGameState(code, syncable);
        }, 50);
      }
    });

    return () => {
      unsubGame();
      clearBroadcastTimer();
    };
  }, []);

  /* ─── Riddle store changes also trigger broadcast (debounced) ─── */
  useEffect(() => {
    const unsubRiddle = useRiddleStore.subscribe(() => {
      if (isHostRefGlobal && !syncingRefGlobal) {
        clearBroadcastTimer();
        broadcastTimer = setTimeout(() => {
          const syncable = extractSyncableState();
          broadcastGameState(syncable);

          const code = useRoomStore.getState().roomCode;
          if (code) persistGameState(code, syncable);
        }, 50);
      }
    });

    return () => {
      unsubRiddle();
      clearBroadcastTimer();
    };
  }, []);

  /* ─── Persist teams immediately during waiting phase (no debounce) ─── */
  useEffect(() => {
    const unsub = useGameStore.subscribe(() => {
      if (isHostRefGlobal) {
        const code = useRoomStore.getState().roomCode;
        if (code) {
          const phase = useGameStore.getState().gamePhase;
          if (phase === "idle") {
            // Teams change during waiting — persist immediately (no debounce)
            const syncable = extractSyncableState();
            persistGameState(code, syncable);
          }
        }
      }
    });
    return () => unsub();
  }, []);

  /* ─── Track Realtime channel connection status ─── */
  useEffect(() => {
    let disconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const unsub = onConnectionChange((connected) => {
      if (connected) {
        // Connection restored — clear the dropped flag immediately
        if (disconnectTimer) {
          clearTimeout(disconnectTimer);
          disconnectTimer = null;
        }
        useRoomStore.getState().setConnectionDropped(false);
        useRoomStore.getState().setIsConnected(true);
      } else {
        // Connection lost — wait 3s before showing the banner (avoid flash)
        if (!disconnectTimer) {
          disconnectTimer = setTimeout(() => {
            useRoomStore.getState().setConnectionDropped(true);
            useRoomStore.getState().setIsConnected(false);
            disconnectTimer = null;
          }, 3000);
        }
      }
    });

    return () => {
      unsub();
      if (disconnectTimer) clearTimeout(disconnectTimer);
    };
  }, []);

  /* ─── Actions ─── */

  const handleCreateRoom = useCallback(async (playerName: string) => {
    try {
      const result = await createRoom(playerName);
      if (result.ok && result.roomCode) {
        isHostRefGlobal = true;
        roomStore.setRoomCode(result.roomCode);
        roomStore.setIsConnected(true);
        roomStore.setIsHost(true);
        roomStore.setError(null);
        saveRoom({ code: result.roomCode, playerName, isHost: true });
        return result.roomCode;
      } else {
        roomStore.setError(result.error || "Failed to create room");
        return null;
      }
    } catch (err: any) {
      roomStore.setError(err?.message || "Connection failed");
      return null;
    }
  }, []);

  const handleJoinRoom = useCallback(async (roomCode: string, playerName: string) => {
    try {
      const result = await joinRoom(roomCode, playerName);
      if (result.ok && result.roomCode) {
        isHostRefGlobal = false;
        roomStore.setRoomCode(result.roomCode);
        roomStore.setIsConnected(true);
        roomStore.setIsHost(false);
        roomStore.setError(null);
        saveRoom({ code: result.roomCode, playerName, isHost: false });

        if (result.gameState) {
          syncingRefGlobal = true;
          applySyncableState(result.gameState as SyncableState);
          syncingRefGlobal = false;
        }

        return true;
      } else {
        roomStore.setError(result.error || "Failed to join room");
        return false;
      }
    } catch (err: any) {
      roomStore.setError(err?.message || "Connection failed");
      return false;
    }
  }, []);

  const handleStartGame = useCallback(() => {
    if (!isHostRefGlobal) return;
    broadcastGameEvent("started");
  }, []);

  const handleInitializeGame = useCallback(() => {
    const state = useGameStore.getState();
    if (state.teams.length === 0) return;

    state.setGamePhase("active");
    state.setCurrentTeamIndex(0);
    const firstTeam = state.teams[0];
    if (firstTeam) state.setActiveTeamId(firstTeam.id);
    state.setResultsSaved(false);

    const syncable = extractSyncableState();
    broadcastGameState(syncable);

    const code = useRoomStore.getState().roomCode;
    if (code) persistGameState(code, syncable);
  }, []);

  const handleReconnect = useCallback(async () => {
    const saved = getSavedRoom();
    if (!saved) return false;

    try {
      const result = await reconnectToRoom(saved.code, saved.playerName);
      if (result.ok) {
        isHostRefGlobal = result.isHost ?? false;
        roomStore.setRoomCode(saved.code);
        roomStore.setIsConnected(true);
        roomStore.setIsHost(result.isHost ?? false);
        roomStore.setError(null);
        saveRoom({ code: saved.code, playerName: saved.playerName, isHost: result.isHost ?? false });

        if (result.gameState) {
          syncingRefGlobal = true;
          applySyncableState(result.gameState as SyncableState);

          // If game is active, mark it so non-host auto-navigates to board
          if (result.gameState.gamePhase === "active" || result.gameState.gamePhase === "ended") {
            useRoomStore.getState().setGameActive(true);
          }

          syncingRefGlobal = false;
        }

        return true;
      } else {
        // Room is gone — clear saved data
        clearSavedRoom();
        roomStore.setError(result.error || "Could not reconnect");
        return false;
      }
    } catch (err: any) {
      clearSavedRoom();
      roomStore.setError(err?.message || "Reconnection failed");
      return false;
    }
  }, []);

  const handleLeaveRoom = useCallback(async () => {
    isHostRefGlobal = false;
    clearBroadcastTimer();
    clearSavedRoom();
    roomStore.reset();
    roomStore.setGameActive(false);
    useGameStore.getState().setGamePhase("idle");
    await leaveRoom();
  }, []);

  const handleEndRoom = useCallback(async () => {
    const code = roomStore.roomCode;
    if (code) await deleteRoom(code);
    await handleLeaveRoom();
  }, [roomStore.roomCode, handleLeaveRoom]);

  const savedRoom = getSavedRoom();

  return {
    roomCode: roomStore.roomCode,
    players: roomStore.players,
    isHost: roomStore.isHost,
    isConnected: roomStore.isConnected,
    error: roomStore.error,
    isGameActive: roomStore.isGameActive,
    savedRoom,
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    reconnect: handleReconnect,
    startGame: handleStartGame,
    initializeGame: handleInitializeGame,
    leaveRoom: handleLeaveRoom,
    endRoom: handleEndRoom,
  };
}
