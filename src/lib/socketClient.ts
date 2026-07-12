/**
 * Socket.io client for Riddle Rush multiplayer.
 *
 * Provides:
 * - Room creation / joining
 * - Game state sync (host → spectators / other players)
 * - Automatic reconnection
 */
import { io, type Socket } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

let socket: Socket | null = null;

export interface PlayerInfo {
  id: string;
  name: string;
  isHost: boolean;
}

export interface RoomResult {
  ok: boolean;
  roomId?: string;
  players?: PlayerInfo[];
  gameState?: any;
  error?: string;
}

type StateListener = (state: any) => void;
type PlayersListener = (players: PlayerInfo[]) => void;

const listeners = {
  state: new Set<StateListener>(),
  players: new Set<PlayersListener>(),
};

/** Connect to the game server */
export function connect(): Socket {
  if (socket?.connected) return socket;

  socket = io(SERVER_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("game:state", (state: any) => {
    listeners.state.forEach((fn) => fn(state));
  });

  socket.on("room:players", (players: PlayerInfo[]) => {
    listeners.players.forEach((fn) => fn(players));
  });

  socket.on("connect_error", (err) => {
    console.warn("[socket] connect_error:", err.message);
  });

  return socket;
}

/** Disconnect from the game server */
export function disconnect(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  listeners.state.clear();
  listeners.players.clear();
}

/** Create a new game room */
export function createRoom(
  playerName: string
): Promise<RoomResult> {
  return new Promise((resolve) => {
    const s = socket || connect();
    s.emit("room:create", { playerName }, (res: RoomResult) => {
      resolve(res);
    });
  });
}

/** Join an existing game room */
export function joinRoom(
  roomId: string,
  playerName: string
): Promise<RoomResult> {
  return new Promise((resolve) => {
    const s = socket || connect();
    s.emit("room:join", { roomId, playerName }, (res: RoomResult) => {
      resolve(res);
    });
  });
}

/** Sync full game state to server (used by host after state changes) */
export function syncGameState(state: any): void {
  if (!socket?.connected) return;
  socket.emit("game:sync", state);
}

/** Subscribe to game state changes */
export function onGameState(fn: StateListener): () => void {
  listeners.state.add(fn);
  return () => listeners.state.delete(fn);
}

/** Subscribe to player list changes */
export function onPlayersChange(fn: PlayersListener): () => void {
  listeners.players.add(fn);
  return () => listeners.players.delete(fn);
}

/** Get current socket ID */
export function getSocketId(): string | null {
  return socket?.id || null;
}

/** Check if connected to server */
export function isConnected(): boolean {
  return socket?.connected || false;
}
