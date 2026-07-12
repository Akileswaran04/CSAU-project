import { useEffect, useCallback, useRef, useState } from "react";
import { useGameStore } from "../store/useGameStore";
import {
  connect,
  disconnect,
  createRoom,
  joinRoom,
  onGameState,
  onPlayersChange,
  syncGameState,
  getSocketId,
  isConnected,
  type PlayerInfo,
  type RoomResult,
} from "../lib/socketClient";

interface MultiplayerState {
  roomId: string | null;
  players: PlayerInfo[];
  isHost: boolean;
  isConnected: boolean;
  error: string | null;
}

/**
 * useMultiplayer — syncs the local Zustand game store with the WebSocket server.
 *
 * The HOST player's state changes are broadcast to all other connected clients.
 * Spectators / non-host players receive state updates from the server.
 */
export function useMultiplayer() {
  const [mState, setMState] = useState<MultiplayerState>({
    roomId: null,
    players: [],
    isHost: false,
    isConnected: false,
    error: null,
  });
  const isHostRef = useRef(false);
  const syncingRef = useRef(false);

  // Wire up listeners
  useEffect(() => {
    const unsubState = onGameState((serverState) => {
      // Non-host players apply server state to their local store
      if (!isHostRef.current && serverState) {
        syncingRef.current = true;

        const store = useGameStore.getState();
        if (serverState.teams) {
          // Apply server teams
          store.teams.forEach((localTeam) => {
            const serverTeam = serverState.teams.find(
              (t: any) => t.id === localTeam.id
            );
            if (serverTeam) {
              store.updateTeam(localTeam.id, {
                position: serverTeam.position,
                score: serverTeam.score,
              });
            }
          });
        }

        if (serverState.gamePhase) {
          store.setGamePhase(serverState.gamePhase);
        }
        if (serverState.winner !== undefined) {
          store.setWinner(serverState.winner);
        }
        if (serverState.diceResult !== undefined) {
          store.setDiceResult(serverState.diceResult);
        }
        if (serverState.isRolling !== undefined) {
          store.setIsRolling(serverState.isRolling);
        }
        if (serverState.currentTeamIndex !== undefined) {
          store.setCurrentTeamIndex(serverState.currentTeamIndex);
        }

        syncingRef.current = false;
      }
    });

    const unsubPlayers = onPlayersChange((players) => {
      setMState((prev) => ({ ...prev, players }));
    });

    return () => {
      unsubState();
      unsubPlayers();
    };
  }, []);

  // Sync local state changes to server (host only)
  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      if (isHostRef.current && !syncingRef.current) {
        syncGameState({
          teams: state.teams,
          gamePhase: state.gamePhase,
          currentTeamIndex: state.currentTeamIndex,
          diceResult: state.diceResult,
          isRolling: state.isRolling,
          winner: state.winner,
        });
      }
    });

    return unsub;
  }, []);

  const handleCreateRoom = useCallback(async (playerName: string) => {
    try {
      connect();
      const result: RoomResult = await createRoom(playerName);
      if (result.ok && result.roomId) {
        isHostRef.current = true;
        setMState({
          roomId: result.roomId,
          players: result.players || [],
          isHost: true,
          isConnected: true,
          error: null,
        });
        return result.roomId;
      } else {
        setMState((prev) => ({ ...prev, error: result.error || "Failed to create room" }));
        return null;
      }
    } catch (err) {
      setMState((prev) => ({ ...prev, error: "Connection failed" }));
      return null;
    }
  }, []);

  const handleJoinRoom = useCallback(async (roomId: string, playerName: string) => {
    try {
      connect();
      const result: RoomResult = await joinRoom(roomId, playerName);
      if (result.ok) {
        isHostRef.current = false;
        setMState({
          roomId,
          players: result.players || [],
          isHost: false,
          isConnected: true,
          error: null,
        });
        return true;
      } else {
        setMState((prev) => ({ ...prev, error: result.error || "Failed to join room" }));
        return false;
      }
    } catch (err) {
      setMState((prev) => ({ ...prev, error: "Connection failed" }));
      return false;
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    isHostRef.current = false;
    setMState({
      roomId: null,
      players: [],
      isHost: false,
      isConnected: false,
      error: null,
    });
    disconnect();
  }, []);

  return {
    ...mState,
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    disconnect: handleDisconnect,
  };
}
